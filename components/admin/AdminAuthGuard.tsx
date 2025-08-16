'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log('[AdminAuthGuard] render', { user, pathname });

  useEffect(() => {
    console.log('[AdminAuthGuard] useEffect', { loading, user, pathname });
    if (!loading) {
      if (!user) {
        console.log('[AdminAuthGuard] Redirecting to /login - no user');
        router.push('/login');
      } else if (user.role !== 'admin') {
        console.log('[AdminAuthGuard] Redirecting to /login - not admin, role:', user.role);
        router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  // Show loading spinner while checking auth
  if (loading || !user) {
    console.log('[AdminAuthGuard] Showing spinner', { loading, user, pathname });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    console.log('[AdminAuthGuard] Access denied - not admin, role:', user.role);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Access Denied</div>
                     <div className="text-gray-600 mb-4">You don&apos;t have permission to access this area.</div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('[AdminAuthGuard] Rendering children - admin access granted');
  return children;
}
