'use client';

import React from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TeacherProvider } from '@/contexts/TeacherContext';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
        <aside className="w-64 bg-white shadow-lg p-6 flex flex-col gap-4 relative">
          <div className="text-2xl font-bold mb-8">Teacher Portal</div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="px-3 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
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
        <main className="flex-1 flex flex-col">
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