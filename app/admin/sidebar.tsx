'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && event.target && !(event.target as Element).closest('aside')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const links = [
    { name: 'Dashboard Home', href: '/admin/dashboard' },
    { name: 'Assessments', href: '/assessments' },
    { name: 'Applications', href: '/admin/applications' },
    { name: 'Classes', href: '/admin/classes' },
    { name: 'Live Classes', href: '/admin/live-classes' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Timetables', href: '/admin/timetable' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Programs', href: '/admin/programs' },
    { name: 'Resources', href: '/admin/resources' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="bg-gray-800 text-white p-3 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
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
        <div className={`absolute top-0 left-0 w-80 h-full bg-gray-800 shadow-2xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 space-y-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded transition-all duration-200
                    ${pathname === link.href ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Logout Section */}
            <div className="border-t border-gray-700 pt-4">
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
      <aside className="hidden lg:block w-64 bg-gray-800 text-white p-6 min-h-screen">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded transition-all duration-200
                ${pathname === link.href ? 'bg-gray-600' : 'hover:bg-gray-700'}
              `}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="sticky bottom-0 left-0 w-full bg-gray-800 pt-4 pb-2 border-t border-gray-700 flex flex-col items-center">
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
    </>
  );
}
