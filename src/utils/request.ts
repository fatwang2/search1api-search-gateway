/**
 * Request utilities
 */
import { RequestOptions } from '../types';
import { config } from '../config';

/**
 * Forwards a request to the specified endpoint
 * @param url The target URL
 * @param method HTTP method
 * @param body Request body
 * @param options Additional request options
 * @returns Response data
 */
export async function forwardRequest(
  url: string,
  method: string,
  body?: any,
  options: RequestOptions = {}
) {
  const timeout = options.timeout || config.defaultTimeout;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Construct URL with query parameters if provided
  let targetUrl = url;
  if (options.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    targetUrl = `${url}?${queryParams.toString()}`;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // GET and HEAD requests cannot have a body
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };
    
    // Only add body for non-GET/HEAD requests
    if (method !== 'GET' && method !== 'HEAD' && body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(targetUrl, requestOptions);
    
    clearTimeout(timeoutId);
    
    // Return the response data
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred during request');
  }
}
