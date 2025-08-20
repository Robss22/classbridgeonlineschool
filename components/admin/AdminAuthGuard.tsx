'use client';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Memoize the redirect function to prevent infinite loops
  const redirectToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        redirectToLogin();
      } else if (user.role !== 'admin') {
        redirectToLogin();
      }
    }
  }, [user, loading, redirectToLogin]);

  // Show loading spinner while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Access Denied</div>
          <div className="text-gray-600 mb-4">You don&apos;t have permission to access this area.</div>
          <button
            onClick={redirectToLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
}
