'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Users, Plus, Trash2 } from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';

interface TimetableEntry {
  timetable_id: string;
  level_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_name: string;
  meeting_platform: string;
  meeting_link: string;
  is_active: boolean;
  academic_year: string;
  levels?: { name: string };
  subjects?: { name: string };
  teachers?: { teacher_id: string; users?: { first_name: string; last_name: string } };
}

interface StudentTimetable {
  id: string;
  student_id: string;
  timetable_id: string;
  enrollment_date: string;
  status: string;
  users?: { first_name: string; last_name: string; email: string };
  timetables?: TimetableEntry;
}

export default function AdminTimetablePage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [studentTimetables, setStudentTimetables] = useState<StudentTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [levels, setLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    level_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 'Monday',
    start_time: '',
    end_time: '',
    room_name: '',
    meeting_platform: 'Zoom',
    meeting_link: '',
    academic_year: new Date().getFullYear().toString(),
    is_active: true
  });

  const [assignFormData, setAssignFormData] = useState({
    student_id: '',
    timetable_id: '',
    status: 'active'
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch timetables
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select(`
          *,
          levels:level_id (name),
          subjects:subject_id (name),
          teachers:teacher_id (teacher_id, users:user_id (first_name, last_name))
        `)
        .order('day_of_week, start_time');

      if (timetableError) throw timetableError;

      // Fetch reference data required by the UI
      const [levelsRes, subjectsRes, teachersRes, studentsRes] = await Promise.all([
        supabase.from('levels').select('level_id, name'),
        supabase.from('subjects').select('subject_id, name'),
        supabase.from('teachers').select('teacher_id, users:user_id (first_name, last_name)'),
        supabase.from('users').select('id, first_name, last_name, email').eq('role', 'student')
      ]);

      // NOTE: The current schema does not include a 'student_timetables' table.
      const studentData: any[] = [];

      // Normalize timetable rows to the TimetableEntry interface
      const normalizedTimetables: TimetableEntry[] = (timetableData || []).map((row: any) => ({
        timetable_id: row.timetable_id ?? '',
        level_id: row.level_id ?? '',
        subject_id: row.subject_id ?? '',
        teacher_id: row.teacher_id ?? '',
        day_of_week: row.day_of_week ?? '',
        start_time: row.start_time ?? '',
        end_time: row.end_time ?? '',
        room_name: row.room_name ?? '',
        meeting_platform: row.meeting_platform ?? 'Zoom',
        meeting_link: row.meeting_link ?? '',
        is_active: typeof row.is_active === 'boolean' ? row.is_active : true,
        academic_year: row.academic_year ?? new Date().getFullYear().toString(),
        levels: row.levels ?? undefined,
        subjects: row.subjects ?? undefined,
        teachers: row.teachers ?? undefined,
      }));

      setTimetables(normalizedTimetables);
      setStudentTimetables(studentData || []);
      setLevels(levelsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setStudents(studentsRes.data || []);

    } catch (error) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_admin_timetable', 'admin');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create timetable');
      }

      setShowCreateForm(false);
      setFormData({
        level_id: '',
        subject_id: '',
        teacher_id: '',
        day_of_week: 'Monday',
        start_time: '',
        end_time: '',
        room_name: '',
        meeting_platform: 'Zoom',
        meeting_link: '',
        academic_year: new Date().getFullYear().toString(),
        is_active: true
      });
      
      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/student-timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignFormData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to assign student');
      }

      setShowAssignForm(false);
      setAssignFormData({
        student_id: '',
        timetable_id: '',
        status: 'active'
      });
      
      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async (timetableId: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/timetables?id=${timetableId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete timetable');
      }

      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this student assignment?')) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/student-timetables?id=${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to remove assignment');
      }

      fetchData(); // Refresh data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading timetable management...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timetable Management</h1>
          <p className="text-gray-600">Create and manage class schedules, teacher assignments, and student enrollments</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Timetable
          </button>
          <button
            onClick={() => setShowAssignForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Assign Student
          </button>
        </div>

        {/* Timetables Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Class Timetables
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">Day</th>
                  <th className="p-3 text-left font-semibold">Time</th>
                  <th className="p-3 text-left font-semibold">Subject</th>
                  <th className="p-3 text-left font-semibold">Level</th>
                  <th className="p-3 text-left font-semibold">Teacher</th>
                  <th className="p-3 text-left font-semibold">Room</th>
                  <th className="p-3 text-left font-semibold">Platform</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map((timetable) => (
                  <tr key={timetable.timetable_id} className="border-b">
                    <td className="p-3">{timetable.day_of_week}</td>
                    <td className="p-3">{timetable.start_time} - {timetable.end_time}</td>
                    <td className="p-3">{timetable.subjects?.name}</td>
                    <td className="p-3">{timetable.levels?.name}</td>
                    <td className="p-3">
                      {timetable.teachers?.users?.first_name} {timetable.teachers?.users?.last_name}
                    </td>
                    <td className="p-3">{timetable.room_name || '-'}</td>
                    <td className="p-3">{timetable.meeting_platform}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        timetable.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {timetable.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteTimetable(timetable.timetable_id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Assignments Section (hidden when no data available) */}
        {studentTimetables.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Assignments
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold">Student</th>
                  <th className="p-3 text-left font-semibold">Class</th>
                  <th className="p-3 text-left font-semibold">Enrollment Date</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentTimetables.map((assignment) => (
                  <tr key={assignment.id} className="border-b">
                    <td className="p-3">
                      {assignment.users?.first_name} {assignment.users?.last_name}
                      <br />
                      <span className="text-sm text-gray-500">{assignment.users?.email}</span>
                    </td>
                    <td className="p-3">
                      {assignment.timetables?.subjects?.name} - {assignment.timetables?.levels?.name}
                      <br />
                      <span className="text-sm text-gray-500">
                        {assignment.timetables?.day_of_week} {assignment.timetables?.start_time}
                      </span>
                    </td>
                    <td className="p-3">{assignment.enrollment_date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Create Timetable Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Timetable</h3>
              <form onSubmit={handleCreateTimetable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <select
                    value={formData.level_id}
                    onChange={(e) => setFormData({...formData, level_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Level</option>
                    {levels.map((level: any) => (
                      <option key={level.level_id} value={level.level_id}>{level.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject: any) => (
                      <option key={subject.subject_id} value={subject.subject_id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teacher</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher: any) => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.users?.first_name} {teacher.users?.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Day</label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Room Name</label>
                  <input
                    type="text"
                    value={formData.room_name}
                    onChange={(e) => setFormData({...formData, room_name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meeting Platform</label>
                    <select
                      value={formData.meeting_platform}
                      onChange={(e) => setFormData({...formData, meeting_platform: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Teams">Teams</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Meeting Link</label>
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Timetable
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Student Modal */}
        {showAssignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign Student to Timetable</h3>
              <form onSubmit={handleAssignStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Student</label>
                  <select
                    value={assignFormData.student_id}
                    onChange={(e) => setAssignFormData({...assignFormData, student_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student: any) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Timetable</label>
                  <select
                    value={assignFormData.timetable_id}
                    onChange={(e) => setAssignFormData({...assignFormData, timetable_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Timetable</option>
                    {timetables.map((timetable) => (
                      <option key={timetable.timetable_id} value={timetable.timetable_id}>
                        {timetable.subjects?.name} - {timetable.levels?.name} ({timetable.day_of_week} {timetable.start_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={assignFormData.status}
                    onChange={(e) => setAssignFormData({...assignFormData, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Assign Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
