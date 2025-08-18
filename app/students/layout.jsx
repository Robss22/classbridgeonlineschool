'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { StudentProvider } from '@/contexts/StudentContext';
import StudentAuthGuard from '@/components/students/StudentAuthGuard';
import AutoLogout from '@/components/AutoLogout';
import StudentHeader from '@/components/students/StudentHeader';

export default function StudentsLayout({ children }) {
  return (
    <AuthProvider>
      <StudentProvider>
        <StudentAuthGuard>
          <AutoLogout 
            timeoutMinutes={150} // 2 hours 30 minutes
            warningMinutes={5}   // Show warning 5 minutes before
          />
          <StudentHeader />
          {children}
        </StudentAuthGuard>
      </StudentProvider>
    </AuthProvider>
  );
}
