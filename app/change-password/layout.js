import { AuthProvider } from '../../contexts/AuthContext';

// This layout disables all wrappers except AuthProvider for the change password page
export default function ChangePasswordLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
} 