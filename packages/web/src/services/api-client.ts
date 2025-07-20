/**
 * Base API client for making HTTP requests.
 *
 * This client provides a wrapper around the native Fetch API with:
 * - Automatic JSON serialization/deserialization
 * - Consistent error handling and response format
 * - Cookie-based authentication support (credentials: 'include')
 * - Configurable base URL and default headers
 * - TypeScript generics for type-safe responses
 *
 * @module api-client
 */

/**
 * Configuration options for ApiClient initialization.
 */
interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

/**
 * Standardized API response format.
 *
 * @template T - The expected data type for successful responses
 */
interface ApiResponse<T = unknown> {
  /** Response data on success */
  data?: T;
  /** Error message on failure */
  error?: string;
  /** Success/failure indicator */
  success: boolean;
}

/**
 * HTTP client for making API requests with built-in error handling.
 *
 * @class ApiClient
 */
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private credentials: RequestCredentials;

  /**
   * Creates a new ApiClient instance.
   *
   * @param {ApiClientConfig} config - Configuration options
   * @param {string} config.baseURL - Base URL for all requests (default: 'http://localhost:3000')
   * @param {Record<string, string>} config.headers - Additional default headers
   * @param {RequestCredentials} config.credentials - Credentials mode (default: 'include')
   *
   * @example
   * ```typescript
   * const client = new ApiClient({
   *   baseURL: 'https://api.example.com',
   *   headers: { 'X-API-Key': 'secret' }
   * });
   * ```
   */
  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.credentials = config.credentials || 'include';
  }

  /**
   * Make a GET request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path (relative to baseURL)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @example
   * ```typescript
   * const response = await client.get<User>('/api/users/123');
   * if (response.success) {
   *   console.log('User:', response.data);
   * } else {
   *   console.error('Error:', response.error);
   * }
   * ```
   */
  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Make a POST request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path (relative to baseURL)
   * @param {unknown} data - Request body data (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @example
   * ```typescript
   * const response = await client.post<User>('/api/users', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a PUT request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path (relative to baseURL)
   * @param {unknown} data - Request body data (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @example
   * ```typescript
   * const response = await client.put<User>('/api/users/123', {
   *   name: 'Jane Doe'
   * });
   * ```
   */
  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a DELETE request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path (relative to baseURL)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @example
   * ```typescript
   * const response = await client.delete('/api/users/123');
   * if (response.success) {
   *   console.log('User deleted successfully');
   * }
   * ```
   */
  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Make a PATCH request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path (relative to baseURL)
   * @param {unknown} data - Request body data (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @example
   * ```typescript
   * const response = await client.patch<User>('/api/users/123', {
   *   email: 'newemail@example.com'
   * });
   * ```
   */
  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Base request method that handles the actual HTTP request.
   *
   * @template T - Expected response data type
   * @param {string} endpoint - API endpoint path
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<ApiResponse<T>>} Standardized API response
   *
   * @private
   *
   * Features:
   * - Automatic JSON parsing for JSON responses
   * - Falls back to text for non-JSON responses
   * - Consistent error handling for network and HTTP errors
   * - Merges default headers with request-specific headers
   * - Always includes credentials for cookie-based auth
   */
  private async request<T = unknown>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        credentials: this.credentials,
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data: unknown;
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Type guard to check if data is an object with error properties
        if (typeof data === 'object' && data !== null) {
          const errorObj = data as Record<string, unknown>;
          if (typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else if (typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          }
        }
        
        return {
          success: false,
          error: errorMessage,
          data: undefined,
        };
      }

      return {
        success: true,
        data: data as T,
        error: undefined,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
        data: undefined,
      };
    }
  }

  /**
   * Update or add a default header.
   *
   * @param {string} key - Header name
   * @param {string} value - Header value
   *
   * @example
   * ```typescript
   * client.setHeader('Authorization', 'Bearer token123');
   * ```
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove a default header.
   *
   * @param {string} key - Header name to remove
   *
   * @example
   * ```typescript
   * client.removeHeader('Authorization');
   * ```
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Update the base URL for all requests.
   *
   * @param {string} url - New base URL
   *
   * @example
   * ```typescript
   * client.setBaseURL('https://api.production.com');
   * ```
   */
  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

/**
 * Default ApiClient instance configured for local development.
 * Uses http://localhost:3000 as base URL and includes credentials.
 *
 * @example
 * ```typescript
 * import { apiClient } from './api-client';
 *
 * const response = await apiClient.get('/api/auth/user');
 * ```
 */
export const apiClient = new ApiClient();

/**
 * Export the ApiClient class for creating custom instances.
 *
 * @example
 * ```typescript
 * import ApiClient from './api-client';
 *
 * const customClient = new ApiClient({
 *   baseURL: 'https://api.example.com',
 *   headers: { 'X-Custom-Header': 'value' }
 * });
 * ```
 */
export default ApiClient;