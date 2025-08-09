export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string | undefined;
  path?: string | undefined;
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
    details?: any,
    userId?: string,
    path?: string
  ): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
      userId,
      path,
    };
  }

  handleSupabaseError(error: any, operation: string, userId?: string): AppError {
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

  handleAuthError(error: any, operation: string, userId?: string): AppError {
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

  handleFileUploadError(error: any, fileName: string, userId?: string): AppError {
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
