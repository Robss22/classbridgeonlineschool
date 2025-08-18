'use client';

import Link from 'next/link';
import SessionManager from '@/components/SessionManager';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your educational platform and monitor all activities</p>
          </div>
          <Link href="/admin/applications">
            <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              + Add Assessment
            </button>
          </Link>
        </div>
      </div>

      {/* Session Management Test */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h2>
        <SessionManager 
          showDeviceInfo={true}
          allowForceLogout={true}
          className="mb-6"
        />
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Applications" 
          href="/admin/applications" 
          desc="Review and approve student applications"
        />
        <DashboardCard 
          title="Assessments" 
          href="/admin/assessments" 
          desc="Create and manage assessments"
        />
        <DashboardCard 
          title="Classes" 
          href="/admin/classes" 
          desc="Manage classes and schedules"
        />
        <DashboardCard 
          title="Live Classes" 
          href="/admin/live-classes" 
          desc="Schedule and manage live sessions"
        />
        <DashboardCard 
          title="Subjects" 
          href="/admin/subjects" 
          desc="Manage academic subjects"
        />
        <DashboardCard 
          title="Timetable" 
          href="/admin/timetable" 
          desc="Manage class timetables"
        />
        <DashboardCard 
          title="Users" 
          href="/admin/users" 
          desc="Manage teacher and admin accounts"
        />
        <DashboardCard 
          title="Programs" 
          href="/admin/programs" 
          desc="Manage educational programs"
        />
        <DashboardCard 
          title="Resources" 
          href="/admin/resources" 
          desc="Manage learning resources"
        />
      </div>
    </div>
  );
}

function DashboardCard({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <Link href={href} className="block bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100 hover:border-blue-400">
      <h2 className="text-xl font-semibold mb-2 text-blue-700">{title}</h2>
      <p className="text-gray-600 text-sm">{desc}</p>
    </Link>
  );
}
