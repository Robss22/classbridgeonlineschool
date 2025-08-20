export interface AppError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  timestamp: Date;
  userId: string | null;
  path: string | null;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Application Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        userId: error.userId,
        path: error.path,
      });
    }

    // In production, you could send to external logging service
    // this.sendToLoggingService(error);
  }

  createError(
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
    userId: string | null = null,
    path: string | null = null
  ): AppError {
    const error: AppError = {
      code,
      message,
      timestamp: new Date(),
      details,
      userId,
      path
    };
    return error;
  }

  handleSupabaseError(error: unknown, operation: string, userId?: string): AppError {
    const appError = this.createError(
      'SUPABASE_ERROR',
      `Database operation failed: ${operation}`,
      {
        originalError: error,
        operation,
      },
      userId
    );

    this.logError(appError);
    return appError;
  }

  handleAuthError(error: unknown, operation: string, userId?: string): AppError {
    const appError = this.createError(
      'AUTH_ERROR',
      `Authentication failed: ${operation}`,
      {
        originalError: error,
        operation,
      },
      userId
    );

    this.logError(appError);
    return appError;
  }

  handleValidationError(field: string, message: string, userId?: string): AppError {
    const appError = this.createError(
      'VALIDATION_ERROR',
      `Validation failed for field: ${field}`,
      { field, message },
      userId
    );

    this.logError(appError);
    return appError;
  }

  handleFileUploadError(error: unknown, fileName: string, userId?: string): AppError {
    const appError = this.createError(
      'FILE_UPLOAD_ERROR',
      `File upload failed: ${fileName}`,
      {
        originalError: error,
        fileName,
      },
      userId
    );

    this.logError(appError);
    return appError;
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();
