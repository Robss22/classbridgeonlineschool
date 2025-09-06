"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import { Users, Search, BookOpen } from "lucide-react";

type StudentRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
  subject_name: string | null;
  level_name: string | null;
};

type TeacherAssignment = {
  level_id: string;
  subject_id: string;
  levels: { name: string } | null;
  subjects: { name: string } | null;
};

export default function TeacherStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredAssignments, setFilteredAssignments] = useState<TeacherAssignment[]>([]);

  // Fetch teacher assignments
  useEffect(() => {
    async function fetchAssignments() {
      if (!user) return;
      

      
      // First, get the teacher_id for this user
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();

      if (teacherError) {
        return;
      }

      if (!teacherData) {
        return;
      }

      // Now get the teacher's assignments
      const { data: assignments, error } = await supabase
        .from("teacher_assignments")
        .select(`
          level_id,
          subject_id,
          levels!level_id (name),
          subjects!subject_id (name)
        `)
        .eq("teacher_id", teacherData.teacher_id);

      if (error) {
        return;
      }

      const validAssignments = (assignments as TeacherAssignment[] || [])
        .filter(a => a.level_id && a.subject_id && a.levels?.name && a.subjects?.name);
      

      setAssignments(validAssignments);
      
      // Set default selections
      if (validAssignments.length > 0) {
        const firstAssignment = validAssignments[0];
        if (firstAssignment?.level_id && firstAssignment?.subject_id) {
          setSelectedLevel(firstAssignment.level_id);
          setSelectedSubject(firstAssignment.subject_id);
        }
      }
    }
    
    fetchAssignments();
  }, [user]);

  // Filter assignments when level changes
  useEffect(() => {
    if (selectedLevel) {
      const filtered = assignments.filter(a => a.level_id === selectedLevel);
      setFilteredAssignments(filtered);
      if (filtered.length > 0) {
        const firstFiltered = filtered[0];
        if (firstFiltered?.subject_id) {
          setSelectedSubject(firstFiltered.subject_id);
        }
      }
    }
  }, [selectedLevel, assignments]);

  // Fetch students for selected level and subject
  useEffect(() => {
    if (!selectedLevel || !selectedSubject) return;
    
    setLoading(true);
    async function fetchStudents() {
      try {


        // Get students enrolled in this level and subject
        const { data: enrollments, error } = await supabase
          .from("enrollments")
          .select(`
            user_id,
            level_id,
            subject_id,
            users!user_id (
              full_name,
              email,
              phone
            )
          `)
          .eq("level_id", selectedLevel)
          .eq("subject_id", selectedSubject)
          .eq("status", "active");

        if (error) {
          setStudents([]);
          setLoading(false);
          return;
        }



        // Get level and subject names for the selected level and subject
        const { data: levelData } = await supabase
          .from("levels")
          .select("name")
          .eq("level_id", selectedLevel)
          .single();

        const { data: subjectData } = await supabase
          .from("subjects")
          .select("name")
          .eq("subject_id", selectedSubject)
          .single();

        // Transform the data to match StudentRow interface
        const studentRows: StudentRow[] = (enrollments || [])
          .filter(enrollment => enrollment.user_id && enrollment.users)
          .map(enrollment => ({
            user_id: enrollment.user_id,
            full_name: enrollment.users?.full_name || 'N/A',
            email: enrollment.users?.email || 'N/A',
            phone: enrollment.users?.phone || 'N/A',
            registration_number: enrollment.user_id?.substring(0, 8) || 'N/A',
            subject_name: subjectData?.name || 'N/A',
            level_name: levelData?.name || 'N/A'
          }));


        setStudents(studentRows);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStudents();
  }, [selectedLevel, selectedSubject, user?.id]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your students.</div>;
  }

  // Get unique levels for dropdown
  const uniqueLevels = Array.from(new Map(assignments.map(a => [a.level_id, a.levels?.name])).entries())
    .map(([id, name]) => ({ id, name }))
    .filter(level => level.name);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-700" /> Students Viewer
      </h1>
      
      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>User ID: {user.id}</p>
        <p>User Email: {user.email}</p>
        <p>Assignments Count: {assignments.length}</p>
        <p>Selected Level: {selectedLevel}</p>
        <p>Selected Subject: {selectedSubject}</p>
        <p>Students Count: {students.length}</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Level:</label>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            >
              <option value="">Select Level</option>
              {uniqueLevels.map(level => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Subject:</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              disabled={!selectedLevel}
            >
              <option value="">Select Subject</option>
              {filteredAssignments.map(assignment => (
                <option key={assignment.subject_id} value={assignment.subject_id}>
                  {assignment.subjects?.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedLevel && selectedSubject && (
          <div className="mt-3 text-sm text-gray-600">
            <BookOpen className="inline w-4 h-4 mr-1" />
            Showing students for: {filteredAssignments.find(a => a.subject_id === selectedSubject)?.subjects?.name} - {uniqueLevels.find(l => l.id === selectedLevel)?.name}
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
        <table className="min-w-full text-sm sm:text-base">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Name</th>
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Email</th>
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Registration No.</th>
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Contact</th>
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Level</th>
              <th className="px-3 sm:px-4 py-3 text-left font-semibold whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    Loading students...
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-gray-300" />
                    <p className="font-medium">No students found</p>
                    <p className="text-sm">No students are currently enrolled in the selected level and subject.</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, i) => (
                <tr key={student.user_id || i} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                  <td className="p-3 font-medium">{student.full_name}</td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3 font-mono text-sm">{student.registration_number}</td>
                  <td className="p-3">{student.phone}</td>
                  <td className="p-3 text-sm text-gray-600">{student.level_name}</td>
                  <td className="p-3">
                    <button 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors text-xs" 
                      title="View Profile (coming soon)" 
                      disabled
                    >
                      <Search className="w-4 h-4" /> View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {students.length} student{students.length !== 1 ? 's' : ''} for the selected criteria
        </div>
      )}
    </div>
  );
}