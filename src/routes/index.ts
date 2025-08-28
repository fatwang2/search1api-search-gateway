/**
 * Routes index
 */
import { Hono } from 'hono';
import searchRouter from './search';

// Create main router
const router = new Hono();

// Register routes
router.route('/search', searchRouter);

export default router;
