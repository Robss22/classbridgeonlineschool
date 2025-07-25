'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Calendar, User, Home, FileText, MessageCircle, Settings, ClipboardList, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const links = [
  { name: 'Dashboard', href: '/students/dashboard', icon: Home },
  { name: 'My Subjects', href: '/students/subjects', icon: ClipboardList },
  { name: 'Resources', href: '/students/resources', icon: BookOpen },
  { name: 'Timetable', href: '/students/timetable', icon: Calendar },
  { name: 'Assignments', href: '/students/assignments', icon: FileText }, // Optional, can be hidden if not implemented
  { name: 'Messages', href: '/students/messages', icon: MessageCircle },
  { name: 'Profile / Settings', href: '/students/profile', icon: Settings },
];

export default function StudentSidebar({ className = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className={`w-64 bg-white shadow-md p-4 flex flex-col min-h-screen relative ${className}`}>
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
  );
}
