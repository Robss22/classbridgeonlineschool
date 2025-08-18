'use client';

import { ReactNode, useState, useCallback } from 'react';
import Sidebar from './sidebar'; 
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { TeacherProvider } from '@/contexts/TeacherContext';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import AutoLogout from '@/components/AutoLogout';
import { useSessionManagement } from '@/hooks/useSessionManagement';

const links = [
  { name: 'Dashboard Home', href: '/admin/dashboard' },
  { name: 'Assessments', href: '/admin/assessments' },
  { name: 'Applications', href: '/admin/applications' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Live Classes', href: '/admin/live-classes' },
  { name: 'Subjects', href: '/admin/subjects' },
  { name: 'Timetable', href: '/admin/timetable' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Programs', href: '/admin/programs' },
  { name: 'Resources', href: '/admin/resources' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize session management for single-device login
  useSessionManagement({
    checkInterval: 5, // Check every 5 minutes
    autoLogout: true,
    redirectOnInvalid: '/login'
  });

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <TeacherProvider>
      <AdminAuthGuard>
        <AutoLogout 
          timeoutMinutes={150} // 2 hours 30 minutes
          warningMinutes={5}   // Show warning 5 minutes before
        />
        <div className="flex min-h-screen bg-gray-100 admin-layout">
      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Content */}
        <div className={`absolute top-0 left-0 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

                         {/* Mobile Navigation */}
             <nav className="flex-1 flex flex-col gap-2">
               {links.map((link) => (
                 <Link
                   key={link.href}
                   href={link.href}
                   onClick={() => setIsMobileMenuOpen(false)}
                   className={`px-3 py-3 rounded font-medium transition-colors
                     ${pathname === link.href 
                       ? 'bg-blue-700 text-white' 
                       : 'bg-blue-600 text-white hover:bg-blue-700'
                     }
                   `}
                 >
                   {link.name}
                 </Link>
               ))}
             </nav>

            {/* Mobile Logout Section */}
            <div className="border-t border-gray-200 pt-4">
              <button
                className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Logout"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
              <div className="mt-3 text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} ClassBridge</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - only visible on large screens */}
      <div className="hidden lg:block">
        <Sidebar onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      </div>
      <main className="flex-1 flex flex-col lg:ml-0">
        <header className="h-16 bg-white shadow flex items-center px-4 sm:px-8 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="font-semibold text-lg">
              Admin Panel
            </div>
          </div>
          {/* Placeholder for notifications, profile, logout */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
        </header>
        <section className="flex-1 p-6">{children}</section>
      </main>
      </div>
        </AdminAuthGuard>
    </TeacherProvider>
  );
}
