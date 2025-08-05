'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentAuthGuard({ children }) {
  const { user, isAuthenticated, loadingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log('[StudentAuthGuard] render', { user, isAuthenticated, loadingAuth, pathname });

  useEffect(() => {
    console.log('[StudentAuthGuard] useEffect', { loadingAuth, isAuthenticated, user, pathname });
    if (!loadingAuth) {
      if (!isAuthenticated) {
        console.log('[StudentAuthGuard] Redirecting to /login');
        router.push('/login');

    }
  }, [isAuthenticated, user, loadingAuth, router, pathname]);

  // Optionally show a loading spinner while checking auth
  if (loadingAuth || !isAuthenticated) {
    console.log('[StudentAuthGuard] Showing spinner', { loadingAuth, isAuthenticated, user, pathname });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('[StudentAuthGuard] Rendering children');
  return children;
}
