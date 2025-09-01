/**
 * Error handling utility for user-friendly error messages
 */

export interface ErrorMapping {
  technicalError: string | RegExp;
  userFriendlyMessage: string;
}

// Define error mappings for common technical errors
const ERROR_MAPPINGS: ErrorMapping[] = [
  {
    technicalError: /infinite recursion detected in policy for relation "users"/i,
    userFriendlyMessage: "We're having trouble loading user data right now. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug"
  },
  {
    technicalError: /Failed to fetch user profile/i,
    userFriendlyMessage: "We're having trouble loading user data right now. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug"
  },
  {
    technicalError: /timeout/i,
    userFriendlyMessage: "The request is taking longer than expected. Please check your internet connection and try again."
  },
  {
    technicalError: /network error/i,
    userFriendlyMessage: "Network connection issue detected. Please check your internet connection and try again."
  },
  {
    technicalError: /database connection failed/i,
    userFriendlyMessage: "We're experiencing technical difficulties. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug"
  },
  {
    technicalError: /Invalid login credentials/i,
    userFriendlyMessage: "Invalid email or password. Please check your credentials and try again."
  },
  {
    technicalError: /Email not confirmed/i,
    userFriendlyMessage: "Please check your email and confirm your account before logging in."
  },
  {
    technicalError: /Too many requests/i,
    userFriendlyMessage: "Too many login attempts. Please wait a few minutes before trying again."
  },
  {
    technicalError: /User not found/i,
    userFriendlyMessage: "Account not found. Please check your email address or contact support."
  }
];

/**
 * Converts technical error messages to user-friendly messages
 * @param error - The error object or string
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) {
    return "An unexpected error occurred. Please try again later.";
  }

  // Convert error to string
  let errorMessage = '';
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error.message) {
    errorMessage = error.message;
  } else {
    errorMessage = String(error);
  }

  // Check if error message matches any known technical errors
  for (const mapping of ERROR_MAPPINGS) {
    if (typeof mapping.technicalError === 'string') {
      if (errorMessage.toLowerCase().includes(mapping.technicalError.toLowerCase())) {
        return mapping.userFriendlyMessage;
      }
    } else if (mapping.technicalError instanceof RegExp) {
      if (mapping.technicalError.test(errorMessage)) {
        return mapping.userFriendlyMessage;
      }
    }
  }

  // Default fallback for unknown errors
  return "We're experiencing technical difficulties. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug";
}

/**
 * Logs technical errors for debugging while showing user-friendly messages
 * @param error - The technical error
 * @param context - Context where the error occurred
 */
export function logTechnicalError(error: any, context: string = 'Unknown'): void {
  console.error(`[${context}] Technical Error:`, error);
}

/**
 * Handles authentication errors specifically
 * @param error - The authentication error
 * @returns User-friendly authentication error message
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) {
    return "Authentication failed. Please try again.";
  }

  // Handle specific auth errors
  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  
  // Check for specific auth error patterns
  if (errorMessage.includes('Invalid login credentials')) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    return "Please check your email and confirm your account before logging in.";
  }
  
  if (errorMessage.includes('Too many requests')) {
    return "Too many login attempts. Please wait a few minutes before trying again.";
  }
  
  if (errorMessage.includes('User not found')) {
    return "Account not found. Please check your email address or contact support.";
  }

  // Use general error mapping for other cases
  return getUserFriendlyErrorMessage(error);
}
