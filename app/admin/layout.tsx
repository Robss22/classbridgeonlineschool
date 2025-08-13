import { ReactNode } from 'react';
import Sidebar from './sidebar'; 
import AdminTopBar from './AdminTopBar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 admin-layout">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden lg:ml-0">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto p-6 pt-4">{children}</main>
      </div>
    </div>
  );
}
