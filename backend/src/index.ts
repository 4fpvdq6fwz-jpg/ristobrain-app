import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { runMigrations } from './migrate';

import authRouter from './routes/auth';
import ingredientsRouter from './routes/ingredients';
import recipesRouter from './routes/recipes';
import menusRouter from './routes/menus';
import salesRouter from './routes/sales';
import calculationsRouter from './routes/calculations';
import locationsRouter from './routes/locations';
import suppliersRouter from './routes/suppliers';
// AI consultant + knowledge base routes (Claude integration)
import aiRouter from './routes/ai';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/menus', menusRouter);
app.use('/api/sales', salesRouter);
app.use('/api/calc', calculationsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/ai', aiRouter);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  // Run DB migrations before starting server
  try {
    await runMigrations();
  } catch (err) {
    console.error('Failed to run migrations, continuing anyway...', err);
  }

  app.listen(config.port, () => {
    console.log(`🍽️ RistoBrain API running on port ${config.port} [${config.nodeEnv}]`);
    console.log(`📊 Health check: http://localhost:${config.port}/health`);
  });
}

startServer();

export default app;
