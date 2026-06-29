import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { query, queryOne } from '../db';
import { config } from '../config';

const router = Router();

const getStripe = () => {
  if (!config.stripeSecretKey) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' as any });
};

// Mappa nome piano → price ID Stripe
const priceForPlan = (plan: string): string => {
  if (plan === 'business') return config.stripeBusinessPriceId;
  return config.stripeProPriceId;
};

// GET /api/billing/status
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const ws = await queryOne<any>(
      `SELECT plan, stripe_subscription_status, stripe_customer_id, plan_expires_at
       FROM workspaces WHERE id = $1`,
      [req.user!.workspaceId]
    );
    return res.json({
      plan: ws?.plan || 'free',
      subscriptionStatus: ws?.stripe_subscription_status || null,
      hasCustomer: !!ws?.stripe_customer_id,
      expiresAt: ws?.plan_expires_at || null,
    });
  } catch (err) {
    console.error('Billing status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/checkout  body: { plan?: 'pro' | 'business' }
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const plan = (req.body && req.body.plan === 'business') ? 'business' : 'pro';
    const priceId = priceForPlan(plan);
    if (!priceId) {
      const envName = plan === 'business' ? 'STRIPE_BUSINESS_PRICE_ID' : 'STRIPE_PRO_PRICE_ID';
      return res.status(400).json({ error: `Prezzo per il piano ${plan} non configurato. Aggiungi ${envName} nelle variabili del backend su Railway.` });
    }

    const ws = await queryOne<any>(
      'SELECT stripe_customer_id FROM workspaces WHERE id = $1',
      [req.user!.workspaceId]
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: ws?.stripe_customer_id || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=1`,
      cancel_url: `${frontendUrl}/billing?canceled=1`,
      metadata: { workspaceId: req.user!.workspaceId, plan },
      client_reference_id: req.user!.workspaceId,
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Could not create checkout session' });
  }
});

// POST /api/billing/portal
router.post('/portal', authenticate, async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const ws = await queryOne<any>(
      'SELECT stripe_customer_id FROM workspaces WHERE id = $1',
      [req.user!.workspaceId]
    );

    if (!ws?.stripe_customer_id) {
      return res.status(400).json({ error: 'Nessun abbonamento attivo trovato' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: ws.stripe_customer_id,
      return_url: `${frontendUrl}/billing`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal error:', err);
    return res.status(500).json({ error: err.message || 'Could not create portal session' });
  }
});

export default router;

// Stripe webhook handler — raw body, registered in index.ts
export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!config.stripeWebhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId || session.client_reference_id;
        const plan = session.metadata?.plan === 'business' ? 'business' : 'pro';
        if (workspaceId && session.customer && session.subscription) {
          await query(
            `UPDATE workspaces SET
              stripe_customer_id = $1,
              stripe_subscription_id = $2,
              stripe_subscription_status = 'active',
              plan = $4
            WHERE id = $3`,
            [session.customer as string, session.subscription as string, workspaceId, plan]
          );
          console.log(`Workspace ${workspaceId} upgraded to ${plan}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const isPro = sub.status === 'active' || sub.status === 'trialing';
        const priceId = (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price && sub.items.data[0].price.id) || '';
        const planName = priceId && priceId === config.stripeBusinessPriceId ? 'business' : 'pro';
        await query(
          `UPDATE workspaces SET
            stripe_subscription_status = $1,
            plan = $2
          WHERE stripe_subscription_id = $3`,
          [sub.status, isPro ? planName : 'free', sub.id]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await query(
          `UPDATE workspaces SET
            stripe_subscription_status = 'canceled',
            plan = 'free'
          WHERE stripe_subscription_id = $1`,
          [sub.id]
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await query(
            `UPDATE workspaces SET stripe_subscription_status = 'past_due'
             WHERE stripe_subscription_id = $1`,
            [invoice.subscription as string]
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  return res.json({ received: true });
};
