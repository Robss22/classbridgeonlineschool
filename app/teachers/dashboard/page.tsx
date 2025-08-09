'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from '@/contexts/AuthContext';
import { useTeacher } from '@/contexts/TeacherContext';
import Link from "next/link";
import { BookOpen, Users, Calendar, Megaphone, UploadCloud, MessageCircle, FolderKanban } from "lucide-react";

// Define interfaces for data fetched from Supabase
// ...existing code...

interface Message {
  message_id: string;
  title: string;
  body: string;
  created_at: string;
  recipient_type: string;
  // Add other message properties as needed
}

interface Lesson {
  subject: string | undefined;
  class: string | undefined;
}

// Helper component for skeleton loading cards
function SkeletonCard({ height = 24 }: { height?: number }) {
  return <div className={`bg-gray-200 rounded w-full mb-2`} style={{ height }} />;
}

// Skeleton loader for the entire dashboard
function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-pulse">
      <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <SkeletonCard height={28} />
          <SkeletonCard height={18} />
          <SkeletonCard height={18} />
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <SkeletonCard height={36} />
          <SkeletonCard height={36} />
          <SkeletonCard height={36} />
        </div>
      </div>
      {[1, 2, 3].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-5 mb-6">
          <SkeletonCard height={22} />
          <SkeletonCard height={18} />
          <SkeletonCard height={18} />
        </div>
      ))}
    </div>
  );
}

// Helper function to get today's date in ISO format (not directly used in current fetch, but useful)
// ...existing code...

// Reusable component for dashboard navigation cards
function DashboardCard({ title, href, desc }: { title: string; href: string; desc: string }) {
  return (
    <Link href={href} className="block bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100 hover:border-blue-400">
      <h2 className="text-xl font-semibold mb-2 text-blue-700">{title}</h2>
      <p className="text-gray-600 text-sm">{desc}</p>
    </Link>
  );
}

// TeacherDashboardPage component
export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { subjects, levels, programs, loading: teacherLoading } = useTeacher();
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Use a hydrated state to ensure client-side rendering for auth-dependent logic
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Debug logs for auth status
  useEffect(() => {
    if (!hydrated) return;
    console.log('DEBUG [TeacherDashboardPage] Auth user:', user, 'Auth loading:', authLoading);
  }, [user, authLoading, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    
    if (authLoading || teacherLoading) {
      setLoading(true);
      return;
    }
    
    if (!user) {
      setLoading(false);
      setTodayLessons([]);
      setAnnouncements([]);
      return;
    }

    async function fetchDashboardData() {
      try {
        // Fetch announcements
        const { data: annData, error: annError } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_type", "teacher")
          .order("created_at", { ascending: false })
          .limit(3);

        if (annError) {
          setError("Supabase Error fetching announcements: " + annError.message);
          return;
        }

        // Create lessons from teacher assignments
        const lessonsForToday: Lesson[] = subjects.map(subject => ({
          subject,
          class: levels.join(", "),
        }));

        setTodayLessons(lessonsForToday);
        setAnnouncements(
          Array.isArray(annData)
            ? annData.map(a => ({
                message_id: a.message_id ?? a.id ?? '',
                title: a.body ? a.body.slice(0, 30) + '...' : 'Announcement',
                body: a.body ?? '',
                created_at: a.created_at ?? '',
                recipient_type: a.recipient_type ?? '',
              }))
            : []
        );

      } catch (err: any) {
        setError("Error fetching dashboard data: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user, authLoading, teacherLoading, hydrated, subjects, levels, programs]);

  // Early returns moved to the end to maintain consistent hook order
  if (!hydrated) {
    return null;
  }
  
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your dashboard.</div>;
  }

  if (loading || teacherLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center text-red-600">
        <div className="font-bold mb-2">Error loading dashboard:</div>
        <div>{error}</div>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { setError(""); setLoading(true); }}>
          Retry
        </button>
      </div>
    );
  }



  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FolderKanban className="w-6 h-6 text-blue-700" /> Teacher Dashboard
      </h1>
      {/* Welcome Card */}
      <div className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-lg font-semibold mb-1">
            Welcome, {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Teacher'}!
          </div>
          <div className="text-gray-600 text-sm">Assigned Programs: <span className="font-medium">{programs.length ? programs.join(", ") : "None assigned"}</span></div>
          <div className="text-gray-600 text-sm">Assigned Subjects: <span className="font-medium">{subjects.length ? subjects.join(", ") : "None assigned"}</span></div>
          <div className="text-gray-600 text-sm">Assigned Levels: <span className="font-medium">{levels.length ? levels.join(", ") : "None assigned"}</span></div>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Link href="/assessments">
            <button className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-800 transition-colors">
              + Add Assessment
            </button>
          </Link>
          <Link href="/teachers/resources" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"><UploadCloud className="w-5 h-5" /> Upload Resource</Link>
          <Link href="/teachers/classes" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-900 transition-colors"><Users className="w-5 h-5" /> View Classes</Link>
          <Link href="/teachers/messages" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-900 transition-colors"><MessageCircle className="w-5 h-5" /> Send Message</Link>
        </div>
      </div>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        <DashboardCard title="Assessments" href="/assessments" desc="Create and manage assessments for your classes and programs." />
        <DashboardCard title="Resources" href="/teachers/resources" desc="Upload and manage teaching resources." />
        <DashboardCard title="Classes" href="/teachers/classes" desc="View and manage your assigned classes." />
        <DashboardCard title="Messages" href="/teachers/messages" desc="Send and receive messages and announcements." />
      </div>
      {/* Today's Classes/Lessons */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex items-center mb-2"><Calendar className="w-5 h-5 mr-2 text-blue-600" /><span className="font-semibold">Today&apos;s Classes/Lessons</span></div>
        {todayLessons.length === 0 ? <div className="text-gray-500">No classes scheduled for today.</div> : (
          <ul className="list-disc ml-6 text-gray-700">
            {todayLessons.map((l, i) => (
              <li key={i}>{l.subject} ({l.class})</li>
            ))}
          </ul>
        )}
      </div>
      {/* Recent Student Submissions (Placeholder) */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex items-center mb-2"><BookOpen className="w-5 h-5 mr-2 text-green-600" /><span className="font-semibold">Recent Student Submissions</span></div>
        <div className="text-gray-600 text-sm">No recent submissions.</div>
      </div>
      {/* Announcements/Notifications */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex items-center mb-2"><Megaphone className="w-5 h-5 mr-2 text-orange-600" /><span className="font-semibold">Announcements</span></div>
        {announcements.length === 0 ? <div className="text-gray-500">No announcements at this time.</div> : (
          <ul className="list-disc ml-6 text-gray-700">
            {announcements.map((a) => (
              <li key={a.message_id}><span className="font-medium">{a.title}</span>: {a.body}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
