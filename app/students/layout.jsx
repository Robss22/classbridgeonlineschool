// Folder: app/students/layout.jsx
import StudentSidebar from '@/components/students/StudentSidebar';
import StudentTopBar from '@/components/students/StudentTopBar';
import { StudentProvider } from '@/contexts/StudentContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function StudentLayout({ children }) {
  console.log("StudentLayout mounted");
  return (
    <AuthProvider>
      <StudentProvider>
        <div className="flex h-screen bg-gray-50">
          <StudentSidebar className="mt-24" />
          <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
            <StudentTopBar />
            <main className="flex-1 overflow-y-auto p-4 mt-32 lg:mt-0 lg:pt-6">{children}</main>
          </div>
        </div>
      </StudentProvider>
    </AuthProvider>
  );
}
