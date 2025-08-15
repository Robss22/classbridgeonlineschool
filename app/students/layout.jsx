// Folder: app/students/layout.jsx
import StudentSidebar from '@/components/students/StudentSidebar';
import StudentTopBar from '@/components/students/StudentTopBar';
import { StudentProvider } from '@/contexts/StudentContext';

export default function StudentLayout({ children }) {
  console.log("StudentLayout mounted");
  return (
    <StudentProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar hidden on small screens; hamburger lives inside the component */}
        <div className="hidden lg:block">
          <StudentSidebar className="pt-24" />
        </div>
        <div className="flex flex-col flex-1 min-h-screen overflow-hidden lg:ml-0">
          <div className="relative">
            {/* Inline hamburger for students inside header area for visibility */}
            <div className="absolute left-4 top-4 z-40 lg:hidden">
              {/* This slot is intentionally left for the sidebar's button; keeping consistency */}
            </div>
            <StudentTopBar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 pt-4">{children}</main>
        </div>
      </div>
    </StudentProvider>
  );
}
