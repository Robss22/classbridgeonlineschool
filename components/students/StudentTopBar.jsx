'use client';
import { useStudent } from '@/contexts/StudentContext';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import StudentNotifications from './StudentNotifications';

export default function StudentTopBar({ isMobileMenuOpen, onMobileMenuToggle }) {
  const { studentInfo, loadingStudent } = useStudent();

  if (loadingStudent) {
    return (
      <header className="bg-white shadow border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-center px-4 py-3">
          <div className="animate-pulse text-gray-500">Loading student information...</div>
        </div>
      </header>
    );
  }

  const displayName = studentInfo.name && 
                      studentInfo.name.trim() && 
                      studentInfo.name.trim() !== 'Student' 
     ? studentInfo.name.trim() 
     : 'Student';

  const { program, class: className, registration_number, email, photoUrl } = studentInfo;

  return (
    <header className="bg-white shadow border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex flex-row items-center px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 mr-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex flex-col flex-1 text-left gap-y-1">
          <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">
            Welcome, <span className="text-green-800 font-extrabold">{displayName}</span> 👋
          </h1>
          <div className="flex flex-row flex-wrap gap-x-8 gap-y-1 items-center text-xs sm:text-sm">
            <div className="text-gray-600 whitespace-nowrap">
              You are enrolled in: <span className="font-semibold text-blue-700">{program || '-'}</span> – <span className="font-semibold text-green-700">{className || '-'}</span>
            </div>
            <div className="font-semibold whitespace-nowrap">
              Reg. No: <span className="font-normal">{registration_number || '-'}</span>
            </div>
            <div className="font-semibold whitespace-nowrap">
              Email: <span className="font-normal">{email || '-'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          <StudentNotifications />
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
