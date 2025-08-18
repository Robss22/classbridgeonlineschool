'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TeacherProvider } from '@/contexts/TeacherContext';
import TeacherAuthGuard from '@/components/TeacherAccessControl';
import AutoLogout from '@/components/AutoLogout';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/teachers/dashboard' },
  { name: 'My Classes', href: '/teachers/classes' },
  { name: 'My Subjects', href: '/teachers/subjects' },
  { name: 'My Timetable', href: '/teachers/timetable' },
  { name: 'Live Classes', href: '/teachers/live-classes' },
  { name: 'Resources', href: '/teachers/resources' },
  { name: 'My Assessments', href: '/teachers/assessments' },
  { name: 'Messages', href: '/teachers/messages' },
  { name: 'Students', href: '/teachers/students' },
  { name: 'Profile', href: '/teachers/profile' },
];

function TeachersLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (isMobileMenuOpen && target && !target.closest('aside')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button moved into header for visibility - removed fixed button */}

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Content */}
        <div className={`absolute top-0 left-0 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Mobile Menu Header - Fixed */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Teacher Portal</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto p-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-3 rounded font-medium transition-colors
                    ${pathname === item.href 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Logout Section - Fixed at Bottom */}
            <div className="p-6 border-t border-gray-200 bg-white">
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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white shadow-lg flex-col min-h-screen">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-2xl font-bold">Teacher Portal</div>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`block px-3 py-2 rounded font-medium transition-colors
                ${pathname === item.href 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Logout Section - Fixed at Bottom */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <button
            className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
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
      </aside>

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
              Welcome, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher'}
            </div>
          </div>
          {/* Placeholder for notifications, profile, logout */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <section className="flex-1 p-8">{children}</section>
      </main>
    </div>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TeacherProvider>
        <TeacherAuthGuard>
          {() => (
            <>
              <AutoLogout 
                timeoutMinutes={150} // 2 hours 30 minutes
                warningMinutes={5}   // Show warning 5 minutes before
              />
              <TeachersLayoutContent>
                {children}
              </TeachersLayoutContent>
            </>
          )}
        </TeacherAuthGuard>
      </TeacherProvider>
    </AuthProvider>
  );
} 