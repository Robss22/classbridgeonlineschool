'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: 'Dashboard Home', href: '/admin/dashboard' },
    { name: 'Assessments', href: '/assessments' },
    { name: 'Applications', href: '/admin/applications' },
    { name: 'Classes', href: '/admin/classes' },
    { name: 'Live Classes', href: '/admin/live-classes' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Timetable', href: '/admin/timetable' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Programs', href: '/admin/programs' },
    { name: 'Resources', href: '/admin/resources' },
  ];

  return (
    <>
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
