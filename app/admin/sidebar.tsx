'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Sidebar({ onMobileMenuToggle, isMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalMobileMenuOpen, setIsInternalMobileMenuOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMobileMenuOpen;

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

  // Close mobile menu when route changes (only if using internal state)
  useEffect(() => {
    if (!onMobileMenuToggle) {
      setIsInternalMobileMenuOpen(false);
    }
  }, [pathname, onMobileMenuToggle]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (mobileMenuOpen && target && !target.closest('aside')) {
        if (onMobileMenuToggle) {
          onMobileMenuToggle();
        } else {
          setIsInternalMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen, onMobileMenuToggle]);

  return (
    <>
      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (onMobileMenuToggle) {
              onMobileMenuToggle();
            } else {
              setIsInternalMobileMenuOpen(false);
            }
          }}
        />
        
        {/* Mobile Menu Content */}
        <div className={`absolute top-0 left-0 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Mobile Menu Header - Fixed */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
                <button
                  onClick={() => {
                    if (onMobileMenuToggle) {
                      onMobileMenuToggle();
                    } else {
                      setIsInternalMobileMenuOpen(false);
                    }
                  }}
                  className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Navigation - Scrollable */}
            <nav className="flex-1 overflow-y-auto p-6 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-3 rounded font-medium transition-colors
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
      <aside className="hidden lg:flex w-64 bg-gray-800 text-white flex-col min-h-screen">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-1.5 rounded text-sm transition-all duration-200
                ${pathname === link.href ? 'bg-gray-600' : 'hover:bg-gray-700'}
              `}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Logout Section - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <button
            className="flex items-center gap-2 w-full justify-center px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Logout"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="leading-none">Logout</span>
          </button>
          <div className="mt-2 text-[11px] text-gray-400 text-center">&copy; {new Date().getFullYear()} ClassBridge</div>
        </div>
      </aside>
    </>
  );
}
