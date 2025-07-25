"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Users, BookOpen, FolderKanban, BadgeInfo } from "lucide-react";

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
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchClasses() {
      // 1. Get all class_ids and subject_ids assigned to this teacher
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id, subject_id")
        .eq("teacher_id", user.id);
      const classIds = [...new Set(assignments?.map(a => a.class_id).filter(Boolean))];
      const subjectIds = [...new Set(assignments?.map(a => a.subject_id).filter(Boolean))];
      // 2. Fetch all classes in one query
      const { data: classList } = await supabase
        .from("classes")
        .select("class_id, name, program_id")
        .in("class_id", classIds.length ? classIds : [""]);
      // 3. Fetch all programs in one query
      const programIds = [...new Set(classList?.map(c => c.program_id).filter(Boolean))];
      const { data: programList } = await supabase
        .from("programs")
        .select("program_id, name")
        .in("program_id", programIds.length ? programIds : [""]);
      // 4. Fetch all subjects in one query
      const { data: subjectList } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .in("subject_id", subjectIds.length ? subjectIds : [""]);
      // 5. Fetch all enrollments for these classes in one query
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class")
        .in("class", classIds.length ? classIds : [""]);
      // 6. Build class cards
      const classData = classList.map(cls => {
        const program = programList.find(p => p.program_id === cls.program_id)?.name || "-";
        const subjects = assignments
          .filter(a => a.class_id === cls.class_id)
          .map(a => subjectList.find(s => s.subject_id === a.subject_id)?.name)
          .filter(Boolean);
        const studentCount = enrollments.filter(e => e.class === cls.class_id).length;
        return {
          class_id: cls.class_id,
          name: cls.name,
          program,
          subjects,
          studentCount,
        };
      });
      setClasses(classData);
      setLoading(false);
    }
    fetchClasses();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FolderKanban className="w-6 h-6 text-blue-700" /> My Classes
      </h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No classes assigned yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.class_id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col gap-3 border">
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
                  href={{ pathname: "/teachers/students", query: { class: cls.class_id } }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-900 transition-colors"
                  title="View Students"
                >
                  <Users className="w-4 h-4" /> Students
                </Link>
                <Link
                  href={{ pathname: "/teachers/resources", query: { class: cls.class_id } }}
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