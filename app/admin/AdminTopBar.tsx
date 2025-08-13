'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import MobileNav from './MobileNav';

export default function AdminTopBar() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-center px-4 py-3">
          <div className="animate-pulse text-gray-500">Loading admin information...</div>
        </div>
      </header>
    );
  }

  const displayName = user.full_name || 
                     `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                     'Administrator';

  return (
    <header className="bg-white shadow border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-row items-center px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col flex-1 text-left gap-y-1">
          <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">
            Welcome, <span className="text-blue-800 font-extrabold">{displayName}</span> 👋
          </h1>
          <div className="flex flex-row flex-wrap gap-x-8 gap-y-1 items-center text-xs sm:text-sm">
            <div className="text-gray-600 whitespace-nowrap">
              Role: <span className="font-semibold text-blue-700">Administrator</span>
            </div>
            <div className="font-semibold whitespace-nowrap">
              Email: <span className="font-normal">{user.email || '-'}</span>
            </div>
            <div className="text-gray-600 whitespace-nowrap">
              Access Level: <span className="font-semibold text-green-700">Full Access</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          {/* Mobile Navigation */}
          <MobileNav />
          
          {/* Notifications placeholder */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
          </div>
          
          {/* Profile section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
