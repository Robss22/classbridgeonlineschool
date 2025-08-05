'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TeacherProvider } from '@/contexts/TeacherContext';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/teachers/dashboard' },
  { name: 'My Classes', href: '/teachers/classes' },
  { name: 'My Subjects', href: '/teachers/subjects' },
  { name: 'Resources', href: '/teachers/resources' },
  { name: 'My Assessments', href: '/assessments' },
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
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('aside')) {
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
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

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
              <h2 className="text-2xl font-bold text-gray-800">Teacher Portal</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`px-3 py-3 rounded font-medium transition-colors
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

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white shadow-lg p-6 flex flex-col gap-4 relative">
        <div className="text-2xl font-bold mb-8">Teacher Portal</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`px-3 py-2 rounded font-medium transition-colors
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
        <div className="sticky bottom-0 left-0 w-full bg-white pt-4 pb-2 border-t border-gray-200 flex flex-col items-center mt-auto">
          <button
            className="flex items-center gap-2 w-11/12 justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
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
        <header className="h-16 bg-white shadow flex items-center px-8 justify-between">
          <div className="font-semibold text-lg">
            Welcome, {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher'}
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

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TeacherProvider>
        <TeachersLayoutContent>{children}</TeachersLayoutContent>
      </TeacherProvider>
    </AuthProvider>
  );
} 