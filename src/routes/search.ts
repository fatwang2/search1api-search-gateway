/**
 * Search routes
 */
import { Hono } from 'hono';
import { config } from '../config';
import { forwardRequest } from '../utils/request';
import { Logger } from '../utils/logger';
import { cacheMiddleware } from '../middleware/cache';
import { executeWithFailover } from '../utils/failover';

const router = new Hono();
const logger = new Logger('SearchRouter');

// Apply cache middleware with default 1 minute TTL
router.use('*', cacheMiddleware());

/**
 * Forward search requests with simple failover support
 */
router.get('/', async (c) => {
  try {
    // Get query parameters from request
    const url = new URL(c.req.url);
    
    // Convert all URL search params to a Record object
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Add default language parameter if not present
    if (!params.language) {
      params.language = 'all';
    }
    
    logger.info(`Forwarding search request: ${params.q}`);
    
    // Execute request with failover support
    const { result, usedEndpoint } = await executeWithFailover(
      config.endpoints.search.urls,
      async (endpoint, pageNo) => {
        logger.debug(`Request function called with endpoint: ${endpoint}, pageNo: ${pageNo}`);
        logger.debug(`Original params: ${JSON.stringify(params)}`);
        
        // Create a copy of params for this request
        const requestParams = { ...params };
        
        // If user didn't provide pageno, use the failover pageNo
        if (!params.pageno) {
          requestParams.pageno = pageNo.toString();
          logger.debug(`Auto-adding pageno=${pageNo} to request params`);
        } else {
          logger.debug(`Using user-provided pageno=${params.pageno}`);
        }
        
        logger.debug(`Final request params: ${JSON.stringify(requestParams)}`);
        
        // Forward the request to the endpoint
        return await forwardRequest(
          endpoint,
          'GET',
          undefined, 
          {
            params: requestParams,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    );
    
    logger.info(`Successfully used endpoint: ${usedEndpoint}`);
    return c.json(result);
  } catch (error) {
    logger.error('Search request failed', error);
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default router;
