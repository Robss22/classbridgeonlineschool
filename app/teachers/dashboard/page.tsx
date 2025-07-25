'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from '@/contexts/AuthContext'; // Assuming this path is correct for your project setup
import Link from "next/link";
import { BookOpen, Users, Calendar, Megaphone, UploadCloud, MessageCircle, FolderKanban } from "lucide-react";

// Define interfaces for data fetched from Supabase
interface TeacherAssignmentRaw {
  subject_id: string;
  class_id: string;
  // Supabase returns these as arrays when using `alias (column_name)` syntax
  subjects: { name: string }[] | null;
  classes: { name: string }[] | null;
}

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
function getTodayISO() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

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
  const { user, loading: authLoading } = useAuth(); // Get user and authLoading from AuthContext
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true); // Local loading state for this component's data fetch
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
    // Always call the hook, logic inside
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      setSubjects([]);
      setClasses([]);
      setTodayLessons([]);
      setAnnouncements([]);
      console.log('TeacherDashboard: No authenticated user, stopping loading and clearing data.');
      return;
    }
    setLoading(true);
    async function fetchAllDashboardData() {
      try {
        // Fetch teacher_assignments with joins
        const { data: assignments, error: assignmentsError } = await supabase
          .from("teacher_assignments")
          .select(`
            subject_id,
            class_id,
            subjects:subject_id (name),
            classes:class_id (name)
          `)
          .eq("teacher_id", user.id);

        // Fetch announcements in parallel
        const { data: annData, error: annError } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_type", "teacher")
          .order("created_at", { ascending: false })
          .limit(3);

        if (assignmentsError) {
          setError("Supabase Error fetching teacher assignments: " + assignmentsError.message);
          return;
        }
        if (annError) {
          setError("Supabase Error fetching announcements: " + annError.message);
          return;
        }

        // Process assignments data to extract unique subjects and classes
        const uniqueSubjects: Set<string> = new Set();
        const uniqueClasses: Set<string> = new Set();
        const lessonsForToday: Lesson[] = [];

        (assignments || []).forEach((assignment: TeacherAssignmentRaw) => {
          const subjectName = Array.isArray(assignment.subjects) && assignment.subjects.length > 0
            ? assignment.subjects[0]?.name
            : undefined;
          const className = Array.isArray(assignment.classes) && assignment.classes.length > 0
            ? assignment.classes[0]?.name
            : undefined;

          if (subjectName) {
            uniqueSubjects.add(subjectName);
          }
          if (className) {
            uniqueClasses.add(className);
          }
          lessonsForToday.push({
            subject: subjectName,
            class: className,
          });
        });

        setSubjects(Array.from(uniqueSubjects));
        setClasses(Array.from(uniqueClasses));
        setTodayLessons(lessonsForToday);
        setAnnouncements(Array.isArray(annData) ? annData : []);

      } catch (err: any) {
        setError("Error fetching dashboard data: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    fetchAllDashboardData();
  }, [user, authLoading, hydrated]);

  if (!hydrated) return null;

  if (loading) {
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

  // If auth is complete but no user (e.g., not logged in), show a message
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center text-gray-500">
        Please log in to view the teacher dashboard.
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
          <div className="text-lg font-semibold mb-1">Welcome, Teacher!</div>
          <div className="text-gray-600 text-sm">Subjects: <span className="font-medium">{subjects.length ? subjects.join(", ") : "-"}</span></div>
          <div className="text-gray-600 text-sm">Classes: <span className="font-medium">{classes.length ? classes.join(", ") : "-"}</span></div>
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
        <Link href="/assessments">
          <DashboardCard title="Assessments" href="/assessments" desc="Create and manage assessments for your classes and programs." />
        </Link>
        <Link href="/teachers/resources">
          <DashboardCard title="Resources" href="/teachers/resources" desc="Upload and manage teaching resources." />
        </Link>
        <Link href="/teachers/classes">
          <DashboardCard title="Classes" href="/teachers/classes" desc="View and manage your assigned classes." />
        </Link>
        <Link href="/teachers/messages">
          <DashboardCard title="Messages" href="/teachers/messages" desc="Send and receive messages and announcements." />
        </Link>
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
