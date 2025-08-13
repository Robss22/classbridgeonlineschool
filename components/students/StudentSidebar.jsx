'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Calendar, User, Home, FileText, MessageCircle, Settings, ClipboardList, LogOut, Menu, X, Video } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const links = [
  { name: 'Dashboard', href: '/students/dashboard', icon: Home },
  { name: 'My Subjects', href: '/students/subjects', icon: ClipboardList },
  { name: 'Live Classes', href: '/students/live-classes', icon: Video },
  { name: 'Resources', href: '/students/resources', icon: BookOpen },
  { name: 'Timetable', href: '/students/timetable', icon: Calendar },
  { name: 'Assignments', href: '/students/assignments', icon: FileText }, // Optional, can be hidden if not implemented
  { name: 'Messages', href: '/students/messages', icon: MessageCircle },
  { name: 'Profile / Settings', href: '/students/profile', icon: Settings },
];

export default function StudentSidebar({ className = "" }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="bg-blue-700 text-white p-3 rounded-lg shadow-lg hover:bg-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          <div className="p-4 h-full flex flex-col">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Menu</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 space-y-2">
              {links.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors duration-150
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

            {/* Mobile Logout Section */}
            <div className="border-t border-gray-200 pt-4">
              <button
                className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch (err) {
                    console.error('Logout error:', err);
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

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-64 bg-white shadow-md p-4 flex-col min-h-screen sticky top-0 ${className}`}>
        {/* Removed logo and CLASSBRIDGE word */}
        <nav className="flex-1 space-y-2">
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
        <div className="sticky bottom-0 left-0 w-full bg-white pt-4 pb-2 border-t border-gray-200 flex flex-col items-center">
          <button
            className="flex items-center gap-2 w-11/12 justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } catch (err) {
                console.error('Logout error:', err);
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
