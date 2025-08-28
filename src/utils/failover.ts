/**
 * Advanced failover utility
 * Supports both page-level and endpoint-level failover strategies
 */
import { Logger } from './logger';
import { isEmptySearchResult, ResultValidationOptions } from './validator';

const logger = new Logger('FailoverUtil');

/**
 * Executes a request with page-level failover
 * Tries different page numbers before giving up on an endpoint
 * @param endpoint The endpoint URL to try
 * @param requestFn Function that executes the actual request
 * @param maxPageRetries Maximum number of page retries
 * @param validationOptions Options for validating the result
 * @returns The result of the successful request and the page number used
 * @throws Error if all page retries failed
 */
async function executeWithPageFailover<T>(
  endpoint: string,
  requestFn: (endpoint: string, pageNo: number) => Promise<T>,
  maxPageRetries: number = 2,
  validationOptions?: ResultValidationOptions
): Promise<{ result: T; usedPage: number }> {
  let lastError: any;
  
  // Try with different page numbers
  for (let pageNo = 1; pageNo <= maxPageRetries; pageNo++) {
    try {
      logger.info(`Attempting request to ${endpoint} with pageno=${pageNo}`);
      const result = await requestFn(endpoint, pageNo);
      
      // Check if the result is empty using the validator
      if (isEmptySearchResult(result, validationOptions)) {
        logger.info(`Empty result from ${endpoint} with pageno=${pageNo}, trying next page`);
        lastError = new Error(`Empty result with pageno=${pageNo}`);
        continue;
      }
      
      logger.info(`Request to ${endpoint} with pageno=${pageNo} succeeded`);
      return { result, usedPage: pageNo };
    } catch (error) {
      logger.warn(`Request to ${endpoint} with pageno=${pageNo} failed`, error);
      lastError = error;
    }
  }
  
  // If we get here, all page retries failed
  throw lastError || new Error(`All page retries failed for ${endpoint}`);
}

/**
 * Executes a request with both page-level and endpoint-level failover
 * @param endpoints List of endpoint URLs to try in order
 * @param requestFn Function that executes the actual request
 * @param maxPageRetries Maximum number of page retries per endpoint
 * @returns The result of the first successful request
 * @throws Error if all endpoints and page retries fail
 */
export async function executeWithFailover<T>(
  endpoints: string[],
  requestFn: (endpoint: string, pageNo: number) => Promise<T>,
  maxPageRetries: number = 2,
  validationOptions?: ResultValidationOptions
): Promise<{ result: T; usedEndpoint: string; usedPage: number }> {
  // Track errors for detailed reporting if all endpoints fail
  const errors: Record<string, any> = {};
  
  // Try each endpoint in sequence
  for (const endpoint of endpoints) {
    try {
      // 使用页码级故障转移函数处理当前端点
      const { result, usedPage } = await executeWithPageFailover(
        endpoint,
        requestFn,
        maxPageRetries,
        validationOptions
      );
      
      // 如果找到有效结果，返回它
      logger.info(`Request to ${endpoint} with pageno=${usedPage} succeeded`);
      return { 
        result, 
        usedEndpoint: endpoint,
        usedPage
      };
    } catch (error) {
      // 记录错误并继续尝试下一个端点
      logger.warn(`All requests to ${endpoint} failed`, error);
      errors[endpoint] = error;
    }
  }
  
  // If we get here, all endpoints failed
  const errorMessage = `All endpoints failed: ${Object.keys(errors).join(', ')}`;
  logger.error(errorMessage);
  
  // Throw a consolidated error
  throw new Error(errorMessage);
}
