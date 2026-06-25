import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://ristobrain:ristobrain_secret@localhost:5432/ristobrain',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || '/tmp/ristobrain-uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'RistoBrain <noreply@ristobrain.com>',
  appUrl: process.env.APP_URL || 'https://app.ristobrain.com',
  masterEmails: (process.env.MASTER_EMAILS || 'chef@demo.it,davide.inchef@gmail.com,massatani.d@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
};
