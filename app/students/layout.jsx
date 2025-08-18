'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { StudentProvider } from '@/contexts/StudentContext';
import StudentAuthGuard from '@/components/students/StudentAuthGuard';
import AutoLogout from '@/components/AutoLogout';

export default function StudentsLayout({ children }) {
  return (
    <AuthProvider>
      <StudentProvider>
        <StudentAuthGuard>
          <AutoLogout 
            timeoutMinutes={150} // 2 hours 30 minutes
            warningMinutes={5}   // Show warning 5 minutes before
          />
          {children}
        </StudentAuthGuard>
      </StudentProvider>
    </AuthProvider>
  );
}
