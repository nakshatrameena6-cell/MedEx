/**
 * MEDEx API Client SDK
 * Authoritative source: openapi.yaml (v1.1.0)
 */

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export class ApiError extends Error {
  status: number;
  errorType: string;
  details?: any;

  constructor(status: number, message: string, errorType: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorType = errorType;
    this.details = details;
  }
}

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {},
  mockFallbackHandler?: () => T
): Promise<T> {
  const { headers = {}, params } = options;

  // Build query string
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'ALL' && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Check if X-Mock: true header is present or if backend is offline
  const isMock = headers['X-Mock'] === 'true';
  if (isMock && mockFallbackHandler) {
    // Simulate realistic network latency (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockFallbackHandler();
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorJson.message || `HTTP Error ${response.status}`,
        errorJson.error || 'internal_error',
        errorJson.details
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (mockFallbackHandler) {
      console.warn(`[MEDEx Client] Live request failed, falling back to OpenAPI contract fixtures.`, err);
      return mockFallbackHandler();
    }
    throw err;
  }
}
