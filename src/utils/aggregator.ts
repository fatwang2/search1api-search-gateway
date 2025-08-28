/**
 * Search results aggregation utilities
 * Handles multi-page search result aggregation with limit-based pagination
 */
import { Logger } from './logger';
import { config } from '../config';
import { executeWithFailover } from './failover';
import { forwardRequest } from './request';

const logger = new Logger('Aggregator');

/**
 * Aggregates search results across multiple pages until reaching the specified limit
 * @param endpoints List of search endpoints to try
 * @param baseParams Base search parameters (without pageno)
 * @param limit Maximum number of results to return
 * @returns Aggregated search results with the specified limit
 */
export async function aggregateSearchResults(
  endpoints: string[],
  baseParams: Record<string, string>,
  limit: number
): Promise<any> {
  const allResults: any[] = [];
  let lastResponse: any = null;
  let currentPage = 1;
  
  logger.info(`Starting search aggregation with limit=${limit}, maxPages=${config.search.maxPages}`);
  
  for (currentPage = 1; currentPage <= config.search.maxPages; currentPage++) {
    try {
      logger.debug(`Requesting page ${currentPage} for aggregation`);
      
      // Create request function for this page
      const pageParams = { ...baseParams };
      
      // Use the existing failover system for each page
      const { result, usedEndpoint } = await executeWithFailover(
        endpoints,
        async (endpoint, pageNo) => {
          // Override the failover pageNo with our aggregation page number
          const requestParams = { ...pageParams, pageno: currentPage.toString() };
          
          logger.debug(`Aggregation page ${currentPage}: requesting from ${endpoint} with params: ${JSON.stringify(requestParams)}`);
          
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
        },
        1  // For aggregation, don't use page-level failover, just endpoint failover
      );
      
      logger.debug(`Page ${currentPage} returned from endpoint: ${usedEndpoint}`);
      lastResponse = result; // Keep the last response structure
      
      // Add this page's results to our collection
      if (result.results && Array.isArray(result.results)) {
        const pageResultCount = result.results.length;
        allResults.push(...result.results);
        
        logger.info(`Page ${currentPage}: got ${pageResultCount} results, total so far: ${allResults.length}`);
        
        // Stop if we have enough results
        if (allResults.length >= limit) {
          logger.info(`Reached limit ${limit}, stopping aggregation at page ${currentPage}`);
          break;
        }
        
        // Stop if this page returned no results (no more pages available)
        if (pageResultCount === 0) {
          logger.info(`Page ${currentPage} returned no results, stopping aggregation`);
          break;
        }
      } else {
        logger.warn(`Page ${currentPage} returned no results array, stopping aggregation`);
        break;
      }
      
    } catch (error) {
      logger.error(`Failed to fetch page ${currentPage} during aggregation:`, error);
      // Don't break on error, might be temporary - let failover handle it
      break;
    }
  }
  
  // Truncate results to the requested limit
  const finalResults = allResults.slice(0, limit);
  const finalCount = finalResults.length;
  
  logger.info(`Aggregation completed: requested=${limit}, returned=${finalCount}, pages_fetched=${Math.min(currentPage || 1, config.search.maxPages)}`);
  
  // Return the response in the same format as the original API
  return {
    ...lastResponse,
    results: finalResults,
    number_of_results: finalCount,
    // Add aggregation metadata
    _aggregation: {
      requested: limit,
      returned: finalCount,
      pages_fetched: Math.min(currentPage || 1, config.search.maxPages)
    }
  };
}