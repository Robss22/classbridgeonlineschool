"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { BookOpen, Users, FilePlus2, ClipboardList } from "lucide-react";

export default function TeacherSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchAssignments() {
      // First, get the teacher_id from the teachers table
      const { data: teacherRecord, error: teacherRecordError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single();

      if (teacherRecordError) {
        console.error('Error fetching teacher record:', teacherRecordError);
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Fetch teacher_assignments joined with subjects and levels using teacher_id
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select(`assignment_id, subject_id, level_id, subjects:subject_id (name), levels:level_id (name)`)
        .eq("teacher_id", teacherRecord.teacher_id);
      setAssignments(data || []);
      setLoading(false);
    }
    fetchAssignments();
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your subjects.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-700" /> My Subjects
      </h1>
      {loading ? (
        <div className="p-6 text-center">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No subjects assigned yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-blue-50">
                <th className="p-3 text-left font-semibold">Subject</th>
                <th className="p-3 text-left font-semibold">Level</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.assignment_id} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-700" />
                    <span className="font-medium">{a.subjects?.name || '-'}</span>
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-700" />
                    <span>{a.levels?.name || '-'}</span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Link
                      href={{ pathname: "/teachers/resources", query: { subject: a.subject_id } }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
                      title="Add Resource"
                    >
                      <FilePlus2 className="w-4 h-4" /> Add Resource
                    </Link>
                    <Link
                      href={{ pathname: "/teachers/assignments", query: { subject: a.subject_id } }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-900 transition-colors"
                      title="View Assignments"
                    >
                      <ClipboardList className="w-4 h-4" /> Assignments
                    </Link>
                    <Link
                      href={{ pathname: "/teachers/students", query: { subject: a.subject_id, level: a.level_id } }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-900 transition-colors"
                      title="View Students"
                    >
                      <Users className="w-4 h-4" /> Students
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 