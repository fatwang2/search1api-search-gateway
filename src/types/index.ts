/**
 * Common type definitions
 */

// Request options type
export interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
