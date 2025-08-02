"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import { Users, Search } from "lucide-react";

// Type definition for assignments with joined levels
interface Assignment {
  level_id: string;
  levels: { name: string }[];
}

export default function TeacherStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchClasses() {
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("level_id, levels:level_id (name)")
        .eq("teacher_id", user.id);
      const uniqueClasses = Array.from(
        new Map(
          (assignments as Assignment[] || [])
            .filter(a => a.level_id && a.levels?.[0]?.name)
            .map(a => [a.level_id, { level_id: a.level_id, name: a.levels[0].name }])
        ).values()
      );
      setClasses(uniqueClasses);
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
      setStudents(enrollments || []);
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