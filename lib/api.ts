export interface ApiResponse<T = any> {
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

export function createApiError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  
  if (error?.status) {
    return new ApiError(error.message || 'API Error', error.status, error.code)
  }
  
  if (error?.message) {
    return new ApiError(error.message, 500)
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

export function createQueryParams(params: Record<string, any>): string {
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
