/**
 * Response utilities
 */
import { Context } from 'hono';
import { ApiResponse } from '../types';

/**
 * Creates a success response
 * @param data Response data
 * @param statusCode HTTP status code
 * @returns API response object
 */
export function createSuccessResponse<T>(data: T, statusCode = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

/**
 * Creates an error response
 * @param error Error message
 * @param statusCode HTTP status code
 * @returns API response object
 */
export function createErrorResponse(error: string, statusCode = 500): ApiResponse {
  return {
    success: false,
    error,
    statusCode,
  };
}

/**
 * Sends a JSON response with appropriate status code
 * @param c Hono context
 * @param response API response object
 * @returns Hono response
 */
export function sendResponse(c: Context, response: ApiResponse) {
  return c.json(response, response.statusCode || 200);
}
