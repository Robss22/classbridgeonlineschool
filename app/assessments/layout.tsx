'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherProvider } from '@/contexts/TeacherContext';
import Sidebar from '../admin/sidebar';
import AdminTopBar from '../admin/AdminTopBar';
import TeacherTopBar from './TeacherTopBar';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Teacher navigation items for the teacher layout
const teacherNavItems = [
  { name: 'Dashboard', href: '/teachers/dashboard' },
  { name: 'My Classes', href: '/teachers/classes' },
  { name: 'My Subjects', href: '/teachers/subjects' },
  { name: 'Resources', href: '/teachers/resources' },
  { name: 'Assessments', href: '/assessments' },
  { name: 'Messages', href: '/teachers/messages' },
  { name: 'Students', href: '/teachers/students' },
  { name: 'Profile', href: '/teachers/profile' },
];

export default function AssessmentsLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // If user is a teacher, use the teacher layout with top bar
  if (user?.role === 'teacher' || user?.role === 'class_tutor') {
    return (
      <TeacherProvider>
        <div className="flex min-h-screen bg-gray-50">
          <aside className="w-64 bg-white shadow-lg p-6 flex flex-col gap-4 relative">
            <div className="text-2xl font-bold mb-8">Teacher Portal</div>
            <nav className="flex flex-col gap-2">
              {teacherNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`px-3 py-2 rounded font-medium transition-colors ${
                    item.href === '/assessments' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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
          <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
            <TeacherTopBar />
            <main className="flex-1 overflow-y-auto p-6 pt-4">{children}</main>
          </div>
        </div>
      </TeacherProvider>
    );
  }

  // For admin and other roles, use the admin layout with top bar
  return (
    <TeacherProvider>
      <div className="flex min-h-screen bg-gray-100 admin-layout">
        <Sidebar />
        <div className="flex flex-col flex-1 min-h-screen overflow-hidden lg:ml-0">
          <AdminTopBar />
          <main className="flex-1 overflow-y-auto p-6 pt-4">{children}</main>
        </div>
      </div>
    </TeacherProvider>
  );
}
