import { getUserFriendlyErrorMessage, getAuthErrorMessage } from './errorHandler';

// Test cases for error handling utility
describe('Error Handler Utility', () => {
  describe('getUserFriendlyErrorMessage', () => {
    it('should handle infinite recursion error', () => {
      const error = 'infinite recursion detected in policy for relation "users"';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("We're having trouble loading user data right now. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug");
    });

    it('should handle "Failed to fetch user profile" error', () => {
      const error = 'Failed to fetch user profile: timeout';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("We're having trouble loading user data right now. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug");
    });

    it('should handle timeout errors', () => {
      const error = 'Request timeout after 30 seconds';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("The request is taking longer than expected. Please check your internet connection and try again.");
    });

    it('should handle network errors', () => {
      const error = 'Network error: connection failed';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("Network connection issue detected. Please check your internet connection and try again.");
    });

    it('should handle database connection errors', () => {
      const error = 'Database connection failed';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("We're experiencing technical difficulties. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug");
    });

    it('should handle null/undefined errors', () => {
      const result = getUserFriendlyErrorMessage(null);
      expect(result).toBe("An unexpected error occurred. Please try again later.");
    });

    it('should handle unknown errors with default message', () => {
      const error = 'Some unknown technical error';
      const result = getUserFriendlyErrorMessage(error);
      expect(result).toBe("We're experiencing technical difficulties. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug");
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should handle invalid login credentials', () => {
      const error = 'Invalid login credentials';
      const result = getAuthErrorMessage(error);
      expect(result).toBe("Invalid email or password. Please check your credentials and try again.");
    });

    it('should handle email not confirmed', () => {
      const error = 'Email not confirmed';
      const result = getAuthErrorMessage(error);
      expect(result).toBe("Please check your email and confirm your account before logging in.");
    });

    it('should handle too many requests', () => {
      const error = 'Too many requests';
      const result = getAuthErrorMessage(error);
      expect(result).toBe("Too many login attempts. Please wait a few minutes before trying again.");
    });

    it('should handle user not found', () => {
      const error = 'User not found';
      const result = getAuthErrorMessage(error);
      expect(result).toBe("Account not found. Please check your email address or contact support.");
    });

    it('should fall back to general error handling for unknown auth errors', () => {
      const error = 'Some unknown auth error';
      const result = getAuthErrorMessage(error);
      expect(result).toBe("We're experiencing technical difficulties. Please try again later. If the problem persists, contact us at info@classbridge.ac.ug");
    });
  });
});
