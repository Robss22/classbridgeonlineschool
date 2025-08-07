"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    console.log('DEBUG [Logout] Logout button clicked');
    const { error } = await import('@/lib/supabaseClient').then(m => m.supabase.auth.signOut());
    console.log('DEBUG [Logout] signOut finished, error:', error);
    if (!error) {
      console.log('DEBUG [Logout] router.push(/login) called');
      router.push('/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="fixed top-0 z-50 w-full flex justify-center items-center bg-transparent py-4">
      <nav className="flex items-center w-full max-w-6xl px-6 py-2">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/home" className="flex items-center space-x-3 group">
            <Image
              src="/images/classbridge_logo.png"
              alt="Classbridge Logo"
              width={120}
              height={40}
              className="object-contain w-auto h-auto"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-grow justify-center">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/home"
                className={`font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${pathname === '/home' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                `}
              >
                Home
              </Link>
            </li>
            <li className="relative group">
              <button
                className={`font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-1
                  ${pathname.startsWith('/our-programs') ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                `}
              >
                Our Programs
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Desktop Dropdown */}
              <ul className="absolute left-0 mt-3 w-56 bg-[#18122B]/95 border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-300 invisible transform scale-95 group-hover:scale-100 z-50">
                <li>
                  <Link href="/our-programs/cambridge" className="block px-6 py-3 text-white hover:bg-[#A084E8] hover:text-white rounded-t-2xl transition-all duration-200">Cambridge</Link>
                </li>
                <li>
                  <Link href="/our-programs/uneb" className="block px-6 py-3 text-white hover:bg-[#A084E8] hover:text-white transition-all duration-200">UNEB</Link>
                </li>
                <li>
                  <Link href="/our-programs/tech-skills" className="block px-6 py-3 text-white hover:bg-[#A084E8] hover:text-white transition-all duration-200">Tech Skills</Link>
                </li>
                <li>
                  <Link href="/our-programs/coaching" className="block px-6 py-3 text-white hover:bg-[#A084E8] hover:text-white rounded-b-2xl transition-all duration-200">Coaching</Link>
                </li>
              </ul>
            </li>
            {!user && (
              <li>
                <Link
                  href="/apply"
                  className={`font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-400
                    ${pathname === '/apply' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                  `}
                >
                  Apply
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/calendar"
                className={`font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${pathname === '/calendar' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                `}
              >
                Calendar
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className={`font-semibold px-5 py-2 rounded-lg transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${pathname === '/contact' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                `}
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Desktop Auth/Donate Buttons */}
        <div className="hidden lg:flex items-center gap-3 ml-6">
          {!user ? (
            <Link href="/login" className="px-7 py-2 rounded-full border-2 border-[#A084E8] text-white font-bold bg-transparent hover:bg-[#A084E8]/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A084E8]">
              Login
            </Link>
          ) : (
            <button onClick={handleLogout} className="px-7 py-2 rounded-full border-2 border-[#A084E8] text-white font-bold bg-transparent hover:bg-[#A084E8]/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A084E8]">
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden ml-auto">
          <button
            onClick={toggleMobileMenu}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A084E8]"
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Content */}
        <div className={`absolute top-0 right-0 w-80 h-full bg-[#18122B]/95 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white text-xl font-bold">Menu</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation */}
            <ul className="space-y-4">
              <li>
                <Link
                  href="/home"
                  className={`block font-semibold px-4 py-3 rounded-lg transition-all duration-200 text-base
                    ${pathname === '/home' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                  `}
                >
                  Home
                </Link>
              </li>
              
              {/* Mobile Programs Dropdown */}
              <li>
                <button
                  onClick={toggleDropdown}
                  className={`w-full text-left font-semibold px-4 py-3 rounded-lg transition-all duration-200 text-base flex items-center justify-between
                    ${pathname.startsWith('/our-programs') ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                  `}
                >
                  Our Programs
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <ul className={`mt-2 ml-4 space-y-2 transition-all duration-300 ${isDropdownOpen ? 'opacity-100 max-h-48' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <li>
                    <Link href="/our-programs/cambridge" className="block px-4 py-2 text-white hover:text-[#A084E8] transition-all duration-200">Cambridge</Link>
                  </li>
                  <li>
                    <Link href="/our-programs/uneb" className="block px-4 py-2 text-white hover:text-[#A084E8] transition-all duration-200">UNEB</Link>
                  </li>
                  <li>
                    <Link href="/our-programs/tech-skills" className="block px-4 py-2 text-white hover:text-[#A084E8] transition-all duration-200">Tech Skills</Link>
                  </li>
                  <li>
                    <Link href="/our-programs/coaching" className="block px-4 py-2 text-white hover:text-[#A084E8] transition-all duration-200">Coaching</Link>
                  </li>
                </ul>
              </li>

              {!user && (
                <li>
                  <Link
                    href="/apply"
                    className={`block font-semibold px-4 py-3 rounded-lg transition-all duration-200 text-base
                      ${pathname === '/apply' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                    `}
                  >
                    Apply
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/calendar"
                  className={`block font-semibold px-4 py-3 rounded-lg transition-all duration-200 text-base
                    ${pathname === '/calendar' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                  `}
                >
                  Calendar
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className={`block font-semibold px-4 py-3 rounded-lg transition-all duration-200 text-base
                    ${pathname === '/contact' ? 'bg-[#A084E8] text-white shadow-md' : 'text-white hover:text-[#A084E8] hover:bg-white/10'}
                  `}
                >
                  Contact Us
                </Link>
              </li>
            </ul>

            {/* Mobile Auth Button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              {!user ? (
                <Link 
                  href="/login" 
                  className="block w-full text-center px-7 py-3 rounded-full border-2 border-[#A084E8] text-white font-bold bg-transparent hover:bg-[#A084E8]/10 transition-all duration-200"
                >
                  Login
                </Link>
              ) : (
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-center px-7 py-3 rounded-full border-2 border-[#A084E8] text-white font-bold bg-transparent hover:bg-[#A084E8]/10 transition-all duration-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 