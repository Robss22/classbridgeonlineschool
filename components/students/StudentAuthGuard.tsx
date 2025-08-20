'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // StudentAuthGuard render

  useEffect(() => {
    // StudentAuthGuard useEffect
    if (!loading) {
      if (!user) {
        // Redirecting to /login
        router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  // Optionally show a loading spinner while checking auth
  if (loading || !user) {
    // Showing spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Rendering children
  return children;
}
