/**
 * Validator utilities
 * Contains functions for validating API responses
 */
import { Logger } from './logger';

const logger = new Logger('Validator');

/**
 * Interface for search result validation options
 */
export interface ResultValidationOptions {
  // Custom validation function
  customValidator?: (result: any) => boolean;
  // Whether to check for empty results array
  checkEmptyResults?: boolean;
  // Whether to check for error flag
  checkErrorFlag?: boolean;
  // Additional fields to check for emptiness
  additionalEmptyChecks?: string[];
}

/**
 * Default validation options
 */
const DEFAULT_VALIDATION_OPTIONS: ResultValidationOptions = {
  checkEmptyResults: true,
  checkErrorFlag: true,
  additionalEmptyChecks: ['answers', 'corrections', 'infoboxes', 'suggestions']
};

/**
 * Checks if a search result is empty or invalid
 * @param result The result to check
 * @param options Validation options
 * @returns True if the result is considered empty/invalid
 */
export function isEmptySearchResult(
  result: any, 
  options: ResultValidationOptions = DEFAULT_VALIDATION_OPTIONS
): boolean {
  // Merge options with defaults
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  
  // Null check
  if (!result) {
    logger.debug('Result is null or undefined');
    return true;
  }
  
  // Custom validator if provided
  if (opts.customValidator && opts.customValidator(result) === false) {
    logger.debug('Custom validator returned false');
    return true;
  }
  
  // Check for error flag
  if (opts.checkErrorFlag && (result.error || result.empty === true)) {
    logger.debug('Error flag is present');
    return true;
  }
  
  // 检查所有关键字段是否都为空 (results, answers, corrections, infoboxes, suggestions)
  // 只有当所有字段都为空或不存在时，才认为结果是空的
  const allFieldsEmpty = 
    (!result.results || result.results.length === 0) &&
    (!result.answers || result.answers.length === 0) &&
    (!result.corrections || result.corrections.length === 0) &&
    (!result.infoboxes || result.infoboxes.length === 0) &&
    (!result.suggestions || result.suggestions.length === 0);
  
  if (allFieldsEmpty) {
    logger.debug('All key fields are empty or missing');
    return true;
  }
  
  // 检查其他额外指定的字段
  if (opts.additionalEmptyChecks) {
    for (const field of opts.additionalEmptyChecks) {
      // 跳过已经在上面检查过的字段
      if (['results', 'answers', 'corrections', 'infoboxes', 'suggestions'].includes(field)) {
        continue;
      }
      
      const value = result[field];
      if (Array.isArray(value) && value.length === 0) {
        logger.debug(`Additional field ${field} is an empty array`);
        // 这里不直接返回true，因为我们只关心所有关键字段都为空的情况
      }
    }
  }
  
  return false;
}
