'use client';

import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudentProvider } from '@/contexts/StudentContext';
import StudentAuthGuard from '@/components/students/StudentAuthGuard';
import AutoLogout from '@/components/AutoLogout';
import StudentSidebar from '@/components/students/StudentSidebar';
import StudentTopBar from '@/components/students/StudentTopBar';

export default function StudentsLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <AuthProvider>
      <StudentProvider>
        <StudentAuthGuard>
          <AutoLogout 
            timeoutMinutes={150} // 2 hours 30 minutes
            warningMinutes={5}   // Show warning 5 minutes before
          />
          <div className="flex min-h-screen">
            <StudentSidebar 
              isMobileMenuOpen={isMobileMenuOpen} 
              onMobileMenuClose={() => setIsMobileMenuOpen(false)} 
            />
            <div className="flex-1 lg:ml-64 flex flex-col">
              <StudentTopBar 
                isMobileMenuOpen={isMobileMenuOpen} 
                onMobileMenuToggle={handleMobileMenuToggle} 
              />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </StudentAuthGuard>
      </StudentProvider>
    </AuthProvider>
  );
}
