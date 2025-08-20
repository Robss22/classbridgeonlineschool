'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Calendar, Home, FileText, MessageCircle, Settings, ClipboardList, LogOut, X, Video } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const links = [
  { name: 'Dashboard', href: '/students/dashboard', icon: Home },
  { name: 'My Subjects', href: '/students/subjects', icon: ClipboardList },
  { name: 'Live Classes', href: '/students/live-classes', icon: Video },
  { name: 'Resources', href: '/students/resources', icon: BookOpen },
  { name: 'Timetable', href: '/students/timetable', icon: Calendar },
  { name: 'Assignments', href: '/students/assignments', icon: FileText },
  { name: 'Messages', href: '/students/messages', icon: MessageCircle },
  { name: 'Profile / Settings', href: '/students/profile', icon: Settings },
];

export default function StudentSidebar({ className = "", isMobileMenuOpen, onMobileMenuToggle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [internalMobileMenuOpen, setIsInternalMobileMenuOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMobileMenuOpen;

  // Close mobile menu when route changes (only if using internal state)
  useEffect(() => {
    if (!onMobileMenuToggle) {
      setIsInternalMobileMenuOpen(false);
    }
  }, [pathname, onMobileMenuToggle]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('aside')) {
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
      {/* Mobile Menu Overlay - always rendered but positioned absolutely */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
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
                <h2 className="text-2xl font-bold text-gray-800">Student Portal</h2>
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
              {links.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => {
                    if (onMobileMenuToggle) {
                      onMobileMenuToggle();
                    } else {
                      setIsInternalMobileMenuOpen(false);
                    }
                  }}
                  className={`px-3 py-3 rounded font-medium transition-colors flex items-center gap-3
                    ${pathname === href 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {name}
                </Link>
              ))}
            </nav>

            {/* Mobile Logout Section - Fixed at Bottom */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <button
                className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Logout"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch {
                  } finally {
                    router.replace('/login');
                  }
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
      <aside className={`hidden lg:flex w-64 bg-white shadow-md flex-col min-h-screen sticky top-0 ${className}`}>
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-800">Student Portal</div>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {links.map(({ name, href, icon: Icon }) => (
            <Link
              key={name}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors duration-150
                ${pathname === href
                  ? 'bg-blue-900 text-white font-bold shadow'
                  : 'bg-blue-700 text-white hover:bg-blue-800 hover:text-white'}
              `}
              style={{ minHeight: '44px', color: '#fff' }}
            >
              <Icon className="h-5 w-5" />
              <span>{name}</span>
            </Link>
          ))}
        </nav>
        
        {/* Logout Section - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            className="flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } catch {
              } finally {
                router.replace('/login');
              }
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
