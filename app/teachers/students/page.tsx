"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import { Users, Search } from "lucide-react";


type StudentRow = {
  user_id: string | null;
  registration_number: string | null;
  users: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function TeacherStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<{ level_id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);


  // Define Assignment type for teacher_assignments query
  type Assignment = {
    level_id: string | null;
    levels: { name: string } | null;
  };

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("level_id, levels:level_id (name)")
        .eq("teacher_id", user.id);
      const uniqueClasses = Array.from(
        new Map(
          ((assignments as Assignment[]) || [])
            .filter(a => !!a.level_id && !!a.levels?.name)
            .map(a => [a.level_id as string, { level_id: a.level_id as string, name: a.levels!.name }])
        ).values()
      );
      setClasses(uniqueClasses as { level_id: string; name: string }[]);
      if (uniqueClasses.length && !selectedClass) setSelectedClass(uniqueClasses[0].level_id);
    }
    fetchClasses();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    async function fetchStudents() {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, registration_number, users: user_id (full_name, email, phone)")
        .eq("class", selectedClass)
        .eq("status", "active");
      setStudents((enrollments as any[]) || []);
      setLoading(false);
    }
    fetchStudents();
  }, [selectedClass]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your students.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-700" /> Students Viewer
      </h1>
      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium">Select Class:</label>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {classes.map(cls => (
            <option key={cls.level_id} value={cls.level_id}>{cls.name}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-50">
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">Registration No.</th>
              <th className="p-3 text-left font-semibold">Contact</th>
              <th className="p-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No students found.</td></tr>
            ) : (
              students.map((s, i) => (
                <tr key={s.user_id || i} className="hover:bg-blue-50 transition-colors">
                  <td className="p-3">{s.users?.full_name || '-'}</td>
                  <td className="p-3">{s.users?.email || '-'}</td>
                  <td className="p-3">{s.registration_number || '-'}</td>
                  <td className="p-3">{s.users?.phone || '-'}</td>
                  <td className="p-3">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors text-xs" title="View Profile (coming soon)" disabled>
                      <Search className="w-4 h-4" /> View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}