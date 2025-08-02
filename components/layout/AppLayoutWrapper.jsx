"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from './ClientLayout';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AppLayoutWrapper({ children }) {
  const pathname = usePathname();
  // Remove header/footer for all dashboard areas
  const isDashboardArea =
    pathname.startsWith('/students') ||
    pathname.startsWith('/teachers') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/assessments');
  if (isDashboardArea) {
    return <AuthProvider>{children}</AuthProvider>;
  }
  return (
    <>
      <AuthProvider>
        <ClientLayout>
          <main className="flex-grow pt-24 bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
            {children}
          </main>
        </ClientLayout>
      </AuthProvider>
      {/* Modern Footer (unchanged) */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white py-12">
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
          <div className="mt-12 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} CLASSBRIDGE Online School. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
} 