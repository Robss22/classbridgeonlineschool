import { createSuccessResponse, createErrorResponse, createApiError, ApiError } from '../api'

describe('API Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.error).toBeUndefined()
    })

    it('should create a success response with data and message', () => {
      const data = { id: 1, name: 'Test' }
      const message = 'Success message'
      const response = createSuccessResponse(data, message)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.message).toBe(message)
    })
  })

  describe('createErrorResponse', () => {
    it('should create an error response from string', () => {
      const errorMessage = 'Something went wrong'
      const response = createErrorResponse(errorMessage)
      
      expect(response.success).toBe(false)
      expect(response.error).toBe(errorMessage)
      expect(response.data).toBeUndefined()
    })

    it('should create an error response from Error object', () => {
      const error = new Error('Something went wrong')
      const response = createErrorResponse(error)
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('Something went wrong')
      expect(response.data).toBeUndefined()
    })
  })

  describe('createApiError', () => {
    it('should create ApiError from existing ApiError', () => {
      const originalError = new ApiError('Original error', 400)
      const newError = createApiError(originalError)
      
      expect(newError).toBe(originalError)
      expect(newError.message).toBe('Original error')
      expect(newError.status).toBe(400)
    })

    it('should create ApiError from error with status', () => {
      const error = { status: 404, message: 'Not found' }
      const apiError = createApiError(error)
      
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.message).toBe('Not found')
      expect(apiError.status).toBe(404)
    })

    it('should create ApiError from error with message', () => {
      const error = { message: 'Something went wrong' }
      const apiError = createApiError(error)
      
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.message).toBe('Something went wrong')
      expect(apiError.status).toBe(500)
    })

    it('should create default ApiError for unknown error', () => {
      const apiError = createApiError({})
      
      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.message).toBe('An unexpected error occurred')
      expect(apiError.status).toBe(500)
    })
  })
})
