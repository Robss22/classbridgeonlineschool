"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Users, BookOpen, FolderKanban, BadgeInfo } from "lucide-react";

// SkeletonCard component for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3 border animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  // Fix: Removed duplicate 'user' declaration.
  // The first declaration 'const { user } = useAuth();' was redundant.
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  // Fix: Declare 'classes' state variable and its setter 'setClasses'
  const [classes, setClasses] = useState<{ level_id: string; name: string; program: string; subjects: string[]; studentCount: number }[]>([]);

  useEffect(() => {
    // Ensure user is loaded and not null before fetching data
    if (authLoading || !user) {
      setLoading(false); // If auth is still loading or user is null, set loading to false
      return;
    }

    setLoading(true);
    async function fetchClasses() {
      try {
        // 1. First, get the teacher_id from the teachers table
        const { data: teacherRecord, error: teacherRecordError } = await supabase
          .from('teachers')
          .select('teacher_id')
          .eq('user_id', user?.id ?? '')
          .single();

        if (teacherRecordError) {
          console.error('Error fetching teacher record:', teacherRecordError);
          setClasses([]);
          setLoading(false);
          return;
        }

        // 2. Get all level_ids and subject_ids assigned to this teacher using teacher_id
        const { data: assignments, error: assignmentsError } = await supabase
          .from("teacher_assignments")
          .select("level_id, subject_id")
          .eq("teacher_id", teacherRecord.teacher_id);

        if (assignmentsError) throw assignmentsError;

        const levelIds = [...new Set((assignments || []).map(a => a.level_id).filter(Boolean))] as string[];
        const subjectIds = [...new Set((assignments || []).map(a => a.subject_id).filter(Boolean))] as string[];

        // 3. Fetch all levels in one query
        const { data: levelList, error: levelListError } = await supabase
          .from("levels")
          .select("level_id, name, program_id")
          .in("level_id", levelIds.length ? levelIds : ([''] as string[])); // Handle empty array case for .in()

        if (levelListError) throw levelListError;

        // 4. Fetch all programs in one query
        const programIds = [...new Set((levelList || []).map(l => l.program_id).filter(Boolean))] as string[];
        const { data: programList, error: programListError } = await supabase
          .from("programs")
          .select("program_id, name")
          .in("program_id", programIds.length ? programIds : ([''] as string[])); // Handle empty array case

        if (programListError) throw programListError;

        // 5. Fetch all subjects in one query
        const { data: subjectList, error: subjectListError } = await supabase
          .from("subjects")
          .select("subject_id, name")
          .in("subject_id", subjectIds.length ? subjectIds : ([''] as string[])); // Handle empty array case

        if (subjectListError) throw subjectListError;

        // 6. Fetch all enrollments for these levels in one query
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("level_id")
          .in("level_id", levelIds.length ? levelIds : ([''] as string[])); // Handle empty array case

        if (enrollmentsError) throw enrollmentsError;

        // 7. Build level cards
        const levelData = (levelList || []).map(level => {
          const program = programList.find(p => p.program_id === level.program_id)?.name || "-";
          const subjects = assignments
            .filter(a => a.level_id === level.level_id)
            .map(a => subjectList.find(s => s.subject_id === a.subject_id)?.name)
            .filter((name): name is string => typeof name === 'string'); // Ensure only strings
          const studentCount = enrollments.filter(e => e.level_id === level.level_id).length;
          return {
            level_id: level.level_id,
            name: level.name,
            program,
            subjects,
            studentCount,
          };
        });
        setClasses(levelData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error fetching levels:", errorMessage || error);
        // Optionally, set an error state to display to the user
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, [user, authLoading]); // Add authLoading to dependency array to re-run when auth state changes

  // Fix: Conditional rendering moved outside the main return statement's JSX block
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading authentication...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your classes.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FolderKanban className="w-6 h-6 text-blue-700" /> My Levels
      </h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No levels assigned yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.level_id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col gap-3 border">
              <div className="flex items-center gap-2 mb-2">
                <BadgeInfo className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold">{cls.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Program:</span> {cls.program || "-"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-green-600" />
                <span>{cls.studentCount} students</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="font-medium text-sm">Subjects:</span>
                {cls.subjects.length === 0 ? (
                  <span className="text-gray-400 text-xs">None</span>
                ) : (
                  cls.subjects.map((s, i) => (
                    <span key={i} className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                      {s}
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={{ pathname: "/teachers/students", query: { level: cls.level_id } }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-900 transition-colors"
                  title="View Students"
                >
                  <Users className="w-4 h-4" /> Students
                </Link>
                <Link
                  href={{ pathname: "/teachers/resources", query: { level: cls.level_id } }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
                  title="Manage Resources"
                >
                  <BookOpen className="w-4 h-4" /> Resources
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
