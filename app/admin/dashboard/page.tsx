'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  const router = useRouter();
  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/assessments">
            <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              + Add Assessment
            </button>
          </Link>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { title: "Applications", href: "/admin/applications", desc: "Review and approve student applications." },
          { title: "Assignments", href: "/admin/assignments", desc: "Manage and review assignments for all classes and programs." },
          { title: "Assessments", href: "/assessments", desc: "Create and manage assessments for all programs and classes." },
          { title: "Classes", href: "/admin/classes", desc: "Manage classes and their program assignments." },
          { title: "Live Classes", href: "/admin/live-classes", desc: "Schedule and manage live class sessions and attendance." },
          { title: "Messages", href: "/admin/messages", desc: "Send and review messages and announcements." },
          { title: "Programs", href: "/admin/programs", desc: "View and edit academic programs." },
          { title: "Resources", href: "/admin/resources", desc: "Manage learning resources, upload files, and assign to classes/programs." },
          { title: "Subjects", href: "/admin/subjects", desc: "Manage subjects for each program/class." },
          { title: "Timetables", href: "/admin/timetable", desc: "Create and manage class schedules, teacher assignments, and student enrollments." },
          { title: "Users", href: "/admin/users", desc: "Manage teacher and admin accounts and assignments." },
        ].sort((a, b) => a.title.localeCompare(b.title)).map(card => (
          <DashboardCard key={card.title} title={card.title} href={card.href} desc={card.desc} />
        ))}
      </div>
    </div>
  );
}

function DashboardCard({ title, href, desc }) {
  return (
    <Link href={href} className="block bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100 hover:border-blue-400">
      <h2 className="text-xl font-semibold mb-2 text-blue-700">{title}</h2>
      <p className="text-gray-600 text-sm">{desc}</p>
    </Link>
  );
}
