"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const handleLogout = async () => {
    console.log('DEBUG [Logout] Logout button clicked');
    const { error } = await import('@/lib/supabaseClient').then(m => m.supabase.auth.signOut());
    console.log('DEBUG [Logout] signOut finished, error:', error);
    if (!error) {
      console.log('DEBUG [Logout] router.push(/login) called');
      router.push('/login');
    }
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
              className="object-contain h-auto"
              priority
            />
          </Link>
        </div>
        <div className="flex-grow" />
        {/* Navigation */}
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
            {/* Dropdown */}
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
          { !user && (
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
        {/* Auth/Donate Buttons */}
        <div className="flex items-center gap-3 ml-6">
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
      </nav>
    </header>
  );
} 