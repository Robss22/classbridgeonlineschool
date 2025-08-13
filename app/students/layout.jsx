// Folder: app/students/layout.jsx
import StudentSidebar from '@/components/students/StudentSidebar';
import StudentTopBar from '@/components/students/StudentTopBar';
import { StudentProvider } from '@/contexts/StudentContext';

export default function StudentLayout({ children }) {
  console.log("StudentLayout mounted");
  return (
    <StudentProvider>
      <div className="flex h-screen bg-gray-50">
        <StudentSidebar className="pt-24" />
        <div className="flex flex-col flex-1 min-h-screen overflow-hidden lg:ml-0">
          <StudentTopBar />
          <main className="flex-1 overflow-y-auto p-4 pt-4">{children}</main>
        </div>
      </div>
    </StudentProvider>
  );
}
