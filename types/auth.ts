export interface User {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated?: boolean;
  changePassword: (params: { currentPassword: string; newPassword: string }) => Promise<ChangePasswordResult>;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
  warning?: string;
}
