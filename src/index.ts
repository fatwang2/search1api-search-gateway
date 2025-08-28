import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import router from './routes';
import { Logger } from './utils/logger';

const appLogger = new Logger('App');

// Create Hono app
const app = new Hono();

// Add middleware
app.use('*', logger());
app.use('*', cors());

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Search API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Register all routes
app.route('/', router);

// Error handling
app.onError((err, c) => {
  appLogger.error(`Global error handler: ${err.message}`, err);
  return c.json({
    error: err.message
  }, 500);
});

export default app;
