export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.status && typeof err.status === 'number') {
      return new ApiError(
        typeof err.message === 'string' ? err.message : 'API Error',
        err.status,
        typeof err.code === 'string' ? err.code : undefined
      );
    }
    
    if (err.message && typeof err.message === 'string') {
      return new ApiError(err.message, 500);
    }
  }
  
  return new ApiError('An unexpected error occurred', 500)
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  
  if (message !== undefined) {
    response.message = message
  }
  
  return response
}

export function createErrorResponse(error: string | Error): ApiResponse {
  const message = typeof error === 'string' ? error : error.message
  return {
    success: false,
    error: message,
  }
}

export function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    return response.json().then((errorData) => {
      throw new ApiError(
        errorData?.error || `HTTP ${response.status}`,
        response.status
      )
    })
  }
  
  return response.json()
}

export function createQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
