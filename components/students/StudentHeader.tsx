'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import NotificationsBell from '@/components/NotificationsBell';

export default function StudentHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const displayName = user?.full_name || 
                     `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 
                     'Student';

  return (
    <header className="bg-white shadow border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/students/dashboard" className="text-xl font-bold text-blue-800">
            Student Portal
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/students/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/students/timetable" className="text-gray-600 hover:text-blue-600 transition-colors">
              Timetable
            </Link>
            <Link href="/students/resources" className="text-gray-600 hover:text-blue-600 transition-colors">
              Resources
            </Link>
            <Link href="/students/assignments" className="text-gray-600 hover:text-blue-600 transition-colors">
              Assignments
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationsBell />
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-blue-700">{displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
