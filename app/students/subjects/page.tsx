'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';

interface Subject {
  subject_id: string;
  name: string;
  description?: string;
}

interface SubjectOffering {
  id: string;
  is_compulsory: boolean;
  term: string | null;
  year: string | null;
  subjects: Subject;
  levels: { level_id: string; name: string };
  programs: { program_id: string; name: string };
}

export default function MySubjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        {/* --- Subjects Content Below --- */}
        {/* ORIGINAL CONTENT START */}
  const { studentInfo } = useStudent();
  const [compulsory, setCompulsory] = useState<any[]>([]);
  const [optionals, setOptionals] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [enrolledOptionals, setEnrolledOptionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSelection, setShowSelection] = useState(true);
  // Start with all programs expanded (not collapsed)
  const [collapsedPrograms, setCollapsedPrograms] = useState<Set<string>>(new Set());
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let timeoutId;
    async function fetchSubjectsAndEnrollments() {
      setLoading(true);
      let errorMsg = '';
      try {
        // Fetch all programs for grouping
        const { data: programData, error: programError } = await supabase.from('programs').select('program_id, name');
        if (programError) throw programError;
        setPrograms(programData || []);
        setCollapsedPrograms(new Set());

        // Fetch all subject offerings for this student's level
        const { data: offerings, error: offeringsError } = await supabase
          .from('subject_offerings')
          .select('subject_id, is_compulsory, subjects(name), programs(program_id, name)')
          .eq('level_id', studentInfo.level_id);
        if (offeringsError) throw offeringsError;

        // Fetch all teacher assignments for these subject_ids
        const subjectIds = (offerings || []).map(o => o.subject_id);
        let teacherMap = {};
        if (subjectIds.length > 0) {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('teacher_assignments')
            .select('subject_id, teachers(teacher_id, user_id, users(full_name))')
            .in('subject_id', subjectIds);
          if (assignmentsError) throw assignmentsError;
          (assignments || []).forEach(a => {
            const teacher = Array.isArray(a.teachers) && a.teachers.length > 0 &&
              Array.isArray(a.teachers[0].users) && a.teachers[0].users.length > 0 &&
              a.teachers[0].users[0]?.full_name
              ? a.teachers[0].users[0].full_name
              : null;
            teacherMap[a.subject_id] = teacher;
          });
        }

        const compulsorySubjects = (offerings || []).filter(o => o.is_compulsory).map(o => ({
          id: o.subject_id,
          is_compulsory: o.is_compulsory,
          subjects: Array.isArray(o.subjects) ? o.subjects[0] : o.subjects,
          programs: Array.isArray(o.programs) ? o.programs[0] : o.programs,
          teacher: teacherMap[o.subject_id] || null
        }));
        const optionalSubjects = (offerings || []).filter(o => !o.is_compulsory).map(o => ({
          id: o.subject_id,
          is_compulsory: o.is_compulsory,
          subjects: Array.isArray(o.subjects) ? o.subjects[0] : o.subjects,
          programs: Array.isArray(o.programs) ? o.programs[0] : o.programs,
          teacher: teacherMap[o.subject_id] || null
        }));
        setCompulsory(compulsorySubjects);
        setOptionals(optionalSubjects);

        // 2. Fetch enrollments for this student
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('subject_offering_id, subject_offerings(is_compulsory, subjects(name), programs(program_id, name))')
          .eq('user_id', studentInfo.id)
          .eq('status', 'active');
        if (enrollmentsError) throw enrollmentsError;
        const enrolledOptionals = (enrollments || []).filter(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return so && !so.is_compulsory;
        }).map(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return {
            ...e,
            subject_offerings: {
              ...so,
              subjects: Array.isArray(so.subjects) ? so.subjects[0] : so.subjects,
              programs: Array.isArray(so.programs) ? so.programs[0] : so.programs
            }
          };
        });
        setEnrolledOptionals(enrolledOptionals);
        setShowSelection(enrolledOptionals.length < 3);
      } catch (err) {
        errorMsg = err?.message || JSON.stringify(err);
        setCompulsory([]);
        setOptionals([]);
        setEnrolledOptionals([]);
        setShowSelection(true);
        setErrorMsg('Failed to load subjects: ' + errorMsg);
      } finally {
        setLoading(false);
      }
    }
    timeoutId = setTimeout(() => {
      setLoading(false);
      setErrorMsg('Request timed out. Please check your network or Supabase configuration.');
    }, 20000);
    if (studentInfo.level_id && studentInfo.id) fetchSubjectsAndEnrollments();
    return () => clearTimeout(timeoutId);
  }, [studentInfo.level_id, studentInfo.id]);

  function toggleOptional(id: string) {
    setSelected(sel =>
      sel.includes(id)
        ? sel.filter(x => x !== id)
        : sel.length < 3
          ? [...sel, id]
          : sel
    );
  }

  async function handleSubmit() {
    setSaving(true);
    const currentYear = new Date().getFullYear().toString();
    const rows = selected.map(subject_offering_id => ({
      user_id: studentInfo.id,
      registration_number: studentInfo.registration_number,
      curriculum: studentInfo.program, // or studentInfo.curriculum if available
      class: studentInfo.class,
      academic_year: currentYear,
      enrollment_date: new Date().toISOString(),
      status: 'active',
      progress: 0,
      subject_offering_id
    }));
    console.log('[DEBUG] Insert rows:', rows);
    const { error } = await supabase.from('enrollments').insert(rows);
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setShowSelection(false);
      setSelected([]);
      // Refetch enrollments to update the UI
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_offering_id, subject_offerings(is_compulsory, subjects(name))')
        .eq('user_id', studentInfo.id)
        .eq('status', 'active');
      const enrolledOptionals = enrollments.filter(e => {
        const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
        return so && !so.is_compulsory;
      }).map(e => {
        const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
        return {
          ...e,
          subject_offerings: {
            ...so,
            subjects: Array.isArray(so.subjects) ? so.subjects[0] : so.subjects
          }
        };
      });
      setEnrolledOptionals(enrolledOptionals);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-700" /> My Subjects
      </h1>

      {/* Compulsory - Grouped by Program */}
      <h2 className="text-lg font-semibold mb-2">Compulsory Subjects</h2>
      {programs.map(program => {
        const groupSubjects = compulsory.filter(subj => subj.programs?.program_id === program.program_id);
        if (groupSubjects.length === 0) return null;
        const isCollapsed = collapsedPrograms.has(program.program_id);
        return (
          <div key={program.program_id} className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-100">
            <h3
              className="text-md font-bold mb-2 text-green-700 border-b pb-2 cursor-pointer flex justify-between items-center"
              onClick={() => setCollapsedPrograms(prev => {
                const newSet = new Set(prev);
                if (newSet.has(program.program_id)) newSet.delete(program.program_id);
                else newSet.add(program.program_id);
                return newSet;
              })}
            >
              {program.name} Compulsory Subjects
              <span className="text-gray-500 text-lg">{isCollapsed ? '▲' : '▼'}</span>
            </h3>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {groupSubjects.map(o => (
                  <div key={o.id} className="bg-green-50 border border-green-200 rounded-lg p-4 shadow hover:shadow-md transition">
                    <h4 className="font-bold text-green-800 mb-2">{o.subjects.name}</h4>
                    <p className="text-gray-700 text-sm">{o.teacher ? `Teacher: ${o.teacher}` : 'No teacher assigned'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Optional - Grouped by Program */}
      <h2 className="text-lg font-semibold mb-2">Optional Subjects <span className="text-xs text-gray-500">(Choose 3)</span></h2>
      {showSelection ? (
        <div>
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
            <strong>Note:</strong> Once you save your optional subjects, you <span className="font-semibold">cannot change them</span>. Please choose carefully.
          </div>
          {programs.map(program => {
            const groupSubjects = optionals.filter(subj => subj.programs?.program_id === program.program_id);
            if (groupSubjects.length === 0) return null;
            const isCollapsed = collapsedPrograms.has(program.program_id);
            return (
              <div key={program.program_id} className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-100">
                <h3
                  className="text-md font-bold mb-2 text-blue-700 border-b pb-2 cursor-pointer flex justify-between items-center"
                  onClick={() => setCollapsedPrograms(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(program.program_id)) newSet.delete(program.program_id);
                    else newSet.add(program.program_id);
                    return newSet;
                  })}
                >
                  {program.name} Optional Subjects
                  <span className="text-gray-500 text-lg">{isCollapsed ? '▲' : '▼'}</span>
                </h3>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {groupSubjects.map(o => (
                      <div key={o.id} className={`bg-blue-50 border rounded-lg p-4 shadow hover:shadow-md transition border-blue-200 flex flex-col justify-between h-full ${selected.includes(o.id) ? 'ring-2 ring-blue-400' : ''} ${selected.length === 3 && !selected.includes(o.id) ? 'opacity-50' : ''}`}>
                        <div>
                          <h4 className="font-bold text-blue-800 mb-2">{o.subjects.name}</h4>
                          <p className="text-gray-700 text-sm mb-4">{o.teacher ? `Teacher: ${o.teacher}` : 'No teacher assigned'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleOptional(o.id)}
                          className={`rounded border px-3 py-1 text-xs font-semibold transition w-full mt-auto
                            ${selected.includes(o.id)
                              ? 'bg-blue-100 border-blue-400 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600'}
                            ${selected.length === 3 && !selected.includes(o.id) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          disabled={selected.length === 3 && !selected.includes(o.id)}
                        >
                          {selected.includes(o.id) ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={selected.length !== 3 || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : 'Save Optional Subjects'}
          </button>
        </div>
      ) : (
        <div>
          {programs.map(program => {
            const groupSubjects = enrolledOptionals.filter(e => e.subject_offerings.programs?.program_id === program.program_id);
            if (groupSubjects.length === 0) return null;
            const isCollapsed = collapsedPrograms.has(program.program_id);
            return (
              <div key={program.program_id} className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-100">
                <h3
                  className="text-md font-bold mb-2 text-blue-700 border-b pb-2 cursor-pointer flex justify-between items-center"
                  onClick={() => setCollapsedPrograms(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(program.program_id)) newSet.delete(program.program_id);
                    else newSet.add(program.program_id);
                    return newSet;
                  })}
                >
                  {program.name} Optional Subjects
                  <span className="text-gray-500 text-lg">{isCollapsed ? '▲' : '▼'}</span>
                </h3>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {groupSubjects.map(e => (
                      <div key={e.subject_offering_id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow hover:shadow-md transition">
                        <h4 className="font-bold text-blue-800 mb-2">{e.subject_offerings.subjects.name}</h4>
                        <p className="text-gray-700 text-sm">{e.subject_offerings.teacher ? `Teacher: ${e.subject_offerings.teacher}` : 'No teacher assigned'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {success && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded text-green-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Optional subjects saved successfully!
        </div>
      )}
    </div>
  );
}
