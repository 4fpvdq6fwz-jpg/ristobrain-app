import { config } from './config';

type SendArgs = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!config.resendApiKey) {
    console.warn('Email non inviata: RESEND_API_KEY non configurata. Destinatario:', to);
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({ from: config.mailFrom, to: [to], subject, html }),
    });
    if (!response.ok) {
      const t = await response.text();
      console.error('Errore invio email Resend:', response.status, t.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error('Errore invio email:', err);
    return false;
  }
}

function layout(title: string, bodyHtml: string, buttonUrl?: string, buttonLabel?: string): string {
  const btn = buttonUrl && buttonLabel
    ? `<a href="${buttonUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">${buttonLabel}</a>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;background:#0f0f0f;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;color:#e5e5e5;">
      <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:24px;">RistoBrain</div>
      <h1 style="font-size:20px;color:#ffffff;margin:0 0 16px;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#bdbdbd;">${bodyHtml}</div>
      ${btn ? `<div style="margin:28px 0;">${btn}</div>` : ''}
      <div style="margin-top:32px;border-top:1px solid #2a2a2a;padding-top:16px;font-size:12px;color:#777777;">
        RistoBrain — Software Food Cost e Menu Engineering
      </div>
    </div>
  </body></html>`;
}

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Conferma la tua email — RistoBrain',
    html: layout(
      'Conferma il tuo indirizzo email',
      'Grazie per esserti registrato a RistoBrain. Conferma la tua email per attivare tutte le funzioni del tuo account.',
      link,
      'Conferma email'
    ),
  };
}

export function resetEmail(link: string): { subject: string; html: string } {
  return {
    subject: 'Reimposta la password — RistoBrain',
    html: layout(
      'Reimposta la tua password',
      'Hai richiesto di reimpostare la password. Clicca il pulsante qui sotto per sceglierne una nuova. Il link e valido per 1 ora. Se non hai richiesto tu il reset, puoi ignorare questa email.',
      link,
      'Reimposta password'
    ),
  };
}
