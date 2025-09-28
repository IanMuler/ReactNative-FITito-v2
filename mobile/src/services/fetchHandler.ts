/**
 * Centralized fetch handler for API requests
 * Encapsulates common HTTP logic and provides error logging
 */

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

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
    
    // Return the data from the response
    return result.data;

  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Log unexpected errors
    console.error('🚨 Unexpected API Error:', {
      endpoint,
      method,
      url,
      error: error,
      timestamp: new Date().toISOString(),
    });

    // Throw generic error for unexpected failures
    throw new Error('Network request failed');
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
  delete: <T>(endpoint: string, headers?: Record<string, string>): Promise<T> => {
    return makeRequest<T>(endpoint, { method: 'DELETE', headers });
  },

  /**
   * Custom request for advanced use cases
   */
  request: <T>(endpoint: string, options: FetchOptions): Promise<T> => {
    return makeRequest<T>(endpoint, options);
  },
};

export default fetchHandler;