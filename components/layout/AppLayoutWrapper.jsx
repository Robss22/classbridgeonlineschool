"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from './ClientLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '../LoadingScreen';

function AppContent({ children }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  
  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Remove header/footer for all dashboard areas
  const isDashboardArea =
    pathname.startsWith('/students') ||
    pathname.startsWith('/teachers') ||
    pathname.startsWith('/admin');
    
  if (isDashboardArea) {
    return <>{children}</>;
  }
  
  return (
    <div className="layout-wrapper">
      <ClientLayout>
        <main className="flex-1 pt-20 pb-16 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
          {children}
        </main>
      </ClientLayout>
      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white py-16 relative z-10 mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">CLASSBRIDGE</h3>
              <p className="text-gray-300 max-w-xs">
                Empowering students with quality education in programming, academics, and life skills.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Programs</h4>
              <ul>
                <li><Link href="/our-programs/cambridge" className="hover:underline">Cambridge</Link></li>
                <li><Link href="/our-programs/uneb" className="hover:underline">UNEB</Link></li>
                <li><Link href="/our-programs/tech-skills" className="hover:underline">Tech Skills</Link></li>
                <li><Link href="/our-programs/coaching" className="hover:underline">Coaching</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul>
                <li><Link href="/apply" className="hover:underline">Apply</Link></li>
                <li><Link href="/calendar" className="hover:underline">Calendar</Link></li>
                <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
                <li><Link href="/login" className="hover:underline">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <address className="not-italic text-gray-300 space-y-2">
                <p>Kira Municipality</p>
                <p>Wakiso, Uganda</p>
                <p>Email: <a href="mailto:info@classbridge.com" className="hover:underline">info@classbridge.ac.ug</a></p>
                <p>Phone: +256 747 808 222</p>
              </address>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} CLASSBRIDGE Online School. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppLayoutWrapper({ children }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
} 