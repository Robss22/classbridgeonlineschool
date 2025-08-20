export interface User {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated?: boolean;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  warning?: string;
}
