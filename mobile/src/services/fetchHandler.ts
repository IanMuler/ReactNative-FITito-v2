/**
 * Centralized fetch handler for API requests
 * Encapsulates common HTTP logic and provides error logging
 * Includes offline detection to prevent fetch attempts when network is unavailable
 */

import NetInfo from '@react-native-community/netinfo';

// Use environment variable for API URL, fallback to local development URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.50:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

interface ErrorDetails {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  url: string;
  timestamp: string;
  requestBody?: any;
  responseBody?: any;
}

/**
 * Logs detailed error information for failed API requests
 */
const logError = (errorDetails: ErrorDetails): void => {
  console.error('🚨 API Request Failed:', {
    timestamp: errorDetails.timestamp,
    method: errorDetails.method,
    endpoint: errorDetails.endpoint,
    fullUrl: errorDetails.url,
    status: `${errorDetails.status} ${errorDetails.statusText}`,
    requestBody: errorDetails.requestBody || 'None',
    responseBody: errorDetails.responseBody || 'No response body',
  });

  // Log specific error details based on status code
  if (errorDetails.status >= 400 && errorDetails.status < 500) {
    console.error('❌ Client Error Details:', {
      type: 'Client Error (4xx)',
      description: 'The request was invalid or unauthorized',
      commonCauses: [
        '400: Bad Request - Invalid data format',
        '401: Unauthorized - Missing authentication',
        '403: Forbidden - Access denied',
        '404: Not Found - Endpoint or resource not found',
        '409: Conflict - Resource already exists',
        '422: Validation Error - Invalid field values'
      ]
    });
  } else if (errorDetails.status >= 500) {
    console.error('💥 Server Error Details:', {
      type: 'Server Error (5xx)',
      description: 'The server encountered an error',
      commonCauses: [
        '500: Internal Server Error - Server bug or database issue',
        '502: Bad Gateway - Server unavailable',
        '503: Service Unavailable - Server overloaded'
      ]
    });
  }
};

/**
 * Logs request initiation for debugging
 */
const logRequestStart = (method: string, url: string, body?: any): void => {
  console.log('🚀 API Request Started:', {
    timestamp: new Date().toISOString(),
    method,
    url,
    hasBody: !!body,
    bodyPreview: body ? JSON.stringify(body).substring(0, 200) + (JSON.stringify(body).length > 200 ? '...' : '') : 'None'
  });
};

/**
 * Logs successful request completion
 */
const logRequestSuccess = (method: string, url: string, status: number, responseSize?: number): void => {
  console.log('✅ API Request Success:', {
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    responseSize: responseSize || 'Unknown'
  });
};

/**
 * Builds query parameters string from object
 */
const buildQueryParams = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams(params);
  return searchParams.toString();
};

/**
 * Makes HTTP requests with centralized error handling and logging
 * Checks network connectivity before attempting fetch
 */
const makeRequest = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    body,
    headers = {},
    params
  } = options;

  // Check network connectivity before attempting fetch
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    console.log('📴 [Offline] Network unavailable, skipping fetch:', {
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });
    throw new Error('OFFLINE_MODE');
  }

  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = buildQueryParams(params);
    url += `?${queryString}`;
  }

  // Default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Merge headers
  const finalHeaders = { ...defaultHeaders, ...headers };

  // Request configuration
  const requestConfig: RequestInit = {
    method,
    headers: finalHeaders,
  };

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT')) {
    requestConfig.body = JSON.stringify(body);
  }

  // Log request start
  // logRequestStart(method, url, body);

  try {
    const response = await fetch(url, requestConfig);

    // Check if request was successful
    if (!response.ok) {
      // Try to get error response body
      let responseBody;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }

      // Log detailed error information
      const errorDetails: ErrorDetails = {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        url,
        timestamp: new Date().toISOString(),
        requestBody: body,
        responseBody,
      };

      logError(errorDetails);

      // Throw error with meaningful message
      const errorMessage = responseBody?.message || 
                          `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Parse JSON response
    const result: ApiResponse<T> = await response.json();
    
    // Log successful request
    // const responseSize = JSON.stringify(result).length;
    // logRequestSuccess(method, url, response.status, responseSize);
    
    // Return the data from the response
    return result.data;

  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof Error && error.message.includes('HTTP')) {
      throw error;
    }

    // Log network/connectivity errors with more details
    console.error('🚨 Network/Connectivity Error:', {
      endpoint,
      method,
      url,
      error: error,
      timestamp: new Date().toISOString(),
      errorType: error instanceof TypeError ? 'Network/Fetch Error' : 'Unknown Error',
      possibleCauses: [
        'Server is down or unreachable',
        'Network connectivity issues',
        'CORS configuration problems',
        'Request timeout',
        'DNS resolution failure'
      ]
    });

    // Provide more specific error messages based on error type
    let errorMessage = 'Network request failed';
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to reach server. Check your internet connection and server status.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network error occurred. Please check your connection.';
      }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Centralized fetch handler with convenience methods
 */
export const fetchHandler = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
    return makeRequest<T>(endpoint, { method: 'GET', params });
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> => {
    return makeRequest<T>(endpoint, { method: 'POST', body, headers });
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> => {
    return makeRequest<T>(endpoint, { method: 'PUT', body, headers });
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, paramsOrHeaders?: Record<string, string>): Promise<T> => {
    // Support both params (query parameters) and headers for DELETE requests
    return makeRequest<T>(endpoint, { method: 'DELETE', params: paramsOrHeaders });
  },

  /**
   * Custom request for advanced use cases
   */
  request: <T>(endpoint: string, options: FetchOptions): Promise<T> => {
    return makeRequest<T>(endpoint, options);
  },
};

export default fetchHandler;