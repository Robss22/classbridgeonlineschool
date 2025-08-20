'use client';
import React, { useEffect, useState, useRef } from 'react';
import type { Database } from '@/lib/supabase.types';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen, FileText, UploadCloud, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';

const statusStyles = {
  Pending: 'bg-yellow-200 text-yellow-900',
  Submitted: 'bg-green-200 text-green-900',
  Missed: 'bg-red-200 text-red-900',
};

interface Submission {
  submission_url: string | null;
  submitted_at: string | null;
  status: string | null;
}

// Use imported Database type from database.types.ts
type Assignment = Omit<Database['public']['Tables']['assessments']['Row'], 'created_at'> & { created_at: string | null; submissions?: Submission[] };

interface SubjectsMap {
  [key: string]: { subject_id: string; name: string };
}

interface PaperCodesMap {
  [key: string]: string;
}

type UploadingId = string | null;

const tabs = ['All', 'Pending', 'Submitted', 'Missed'];

function getStatus(assignment: Assignment): 'Submitted' | 'Missed' | 'Pending' {
  if (assignment.submissions && assignment.submissions.length > 0) return 'Submitted';
  if (!assignment.due_date) return 'Pending';
  const due = new Date(assignment.due_date);
  const now = new Date();
  if (now > due) return 'Missed';
  return 'Pending';
}

export default function AssignmentsPage() {
  const { studentInfo, loadingStudent } = useStudent();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tab, setTab] = useState<typeof tabs[number]>('All');
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<UploadingId>(null);
  const [uploadError, setUploadError] = useState('');
  const [subjectsMap, setSubjectsMap] = useState<SubjectsMap>({});
  const [paperCodesMap, setPaperCodesMap] = useState<PaperCodesMap>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | undefined }>({});

  // Hoisted validator so it's available across effects/handlers
  const isValidAssignment = (data: Record<string, unknown>): data is Assignment => {
    return data && typeof data.id === 'string' && typeof data.title === 'string';
  };

  useEffect(() => {
    // Wait for student info to load and be valid before fetching assignments
    if (loadingStudent || !studentInfo.id || !studentInfo.program_id || !studentInfo.level_id) {
      setLoading(true);
      return;
    }
    async function fetchAssessments() {
      setLoading(true);
      try {
        // 1. Fetch compulsory subject IDs for student's program/level
        const { data: compulsory, error: compulsoryError } = await supabase
          .from('subject_offerings')
          .select('subject_id')
          .eq('program_id', studentInfo.program_id)
          .eq('level_id', studentInfo.level_id)
          .eq('is_compulsory', true);
        if (compulsoryError) throw compulsoryError;
        const compulsorySubjectIds = (compulsory || []).map(s => s.subject_id);

        // 2. Fetch optional subject IDs the student is enrolled in
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('subject_offering_id, subject_offerings(subject_id, is_compulsory)')
          .eq('user_id', studentInfo.id)
          .eq('status', 'active');
        if (enrollmentsError) throw enrollmentsError;
        const optionalSubjectIds = (enrollments || [])
          .filter(e => {
            const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
            return so && !so.is_compulsory;
          })
          .map(e => {
            const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
            return so?.subject_id;
          })
          .filter(Boolean);

        // 3. Combine subject IDs
        const allSubjectIds = Array.from(new Set([...compulsorySubjectIds, ...optionalSubjectIds]));
        if (allSubjectIds.length === 0) {
          setAssignments([]);
          setSubjectsMap({});
          setPaperCodesMap({});
          setLoading(false);
          return;
        }

        // 4. Fetch assessments for these subjects with all relevant fields
        const { data: assessmentsData } = await supabase
          .from('assessments')
          .select(`
            *,
            submissions(
              submission_url,
              submitted_at,
              status
            )
          `)
          .eq('program_id', studentInfo.program_id)
          .eq('level_id', studentInfo.level_id)
          .in('subject_id', allSubjectIds)
          .eq('submissions.student_id', studentInfo.id)
          .order('due_date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });

        // Process and validate the data
        const validAssignments: Assignment[] = (assessmentsData || [])
          .filter(isValidAssignment)
          .map((assignment) => ({
            ...(assignment as Assignment),
            created_at: (assignment as Record<string, unknown>).created_at as string | null,
            submissions: Array.isArray((assignment as Record<string, unknown>).submissions)
              ? ((assignment as Record<string, unknown>).submissions as Submission[])
              : [],
          }));

        setAssignments(validAssignments);        // 5. Fetch subject details for mapping
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('subject_id, name');
        if (subjectsData) {
          const map: SubjectsMap = {};
          subjectsData.forEach(s => { map[s.subject_id] = s; });
          setSubjectsMap(map);
        }

        // 6. Fetch paper codes for mapping
        const { data: papersData } = await supabase
          .from('subject_papers')
          .select('paper_id, subject_id, paper_code');
        if (papersData) {
          const map: PaperCodesMap = {};
          papersData.forEach(p => { map[`${p.subject_id}_${p.paper_id}`] = p.paper_code; });
          setPaperCodesMap(map);
        }
      } catch {
        setAssignments([]);
        setSubjectsMap({});
        setPaperCodesMap({});
      }
      setLoading(false);
    }
    fetchAssessments();
  }, [studentInfo.program_id, studentInfo.level_id, studentInfo.id, loadingStudent]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, assignment: Assignment) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(assignment.id);
    setUploadError('');
    try {
      // Use secure API route to upload and save
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const form = new FormData();
      form.append('assessmentId', assignment.id);
      form.append('file', file);
      form.append('action', 'upload');
      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Upload failed');
      }
      const uploaded = await res.json();

      // Prompt confirmation
      const confirmText = `Confirm submission of: ${uploaded.fileName || 'file'}?`;
      const confirmed = window.confirm(confirmText);
      if (!confirmed) {
        const cancelFd = new FormData();
        cancelFd.append('action', 'cancel');
        cancelFd.append('filePath', uploaded.filePath);
        await fetch('/api/student/submissions', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: cancelFd });
        return;
      }

      // Persist DB row after confirmation
      const confirmFd = new FormData();
      confirmFd.append('action', 'confirm');
      confirmFd.append('assessmentId', assignment.id);
      confirmFd.append('filePath', uploaded.filePath);
      const confirmRes = await fetch('/api/student/submissions', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: confirmFd });
      if (!confirmRes.ok) {
        const j = await confirmRes.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to confirm submission');
      }
      
      // Fetch subject IDs again to refresh assignments
      const { data: compulsory } = await supabase
        .from('subject_offerings')
        .select('subject_id')
        .eq('program_id', studentInfo.program_id)
        .eq('level_id', studentInfo.level_id)
        .eq('is_compulsory', true);
      
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_offering_id, subject_offerings(subject_id, is_compulsory)')
        .eq('user_id', studentInfo.id)
        .eq('status', 'active');

      const compulsorySubjectIds = (compulsory || []).map(s => s.subject_id);
      const optionalSubjectIds = (enrollments || [])
        .filter(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return so && !so.is_compulsory;
        })
        .map(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return so?.subject_id;
        })
        .filter(Boolean);

      const subjectIds = Array.from(new Set([...compulsorySubjectIds, ...optionalSubjectIds]));
      
      // Refresh assignments
      const { data: updated } = await supabase
        .from('assessments')
        .select(`
          *,
          submissions(
            submission_url,
            submitted_at,
            status
          )
        `)
        .eq('program_id', studentInfo.program_id)
        .eq('level_id', studentInfo.level_id)
        .in('subject_id', subjectIds)
        .eq('submissions.student_id', studentInfo.id);

      if (updated) {
        const validAssignments = updated
          .filter(isValidAssignment)
          .map(assignment => ({
            ...assignment,
            submissions: Array.isArray(assignment.submissions) ? assignment.submissions : []
          }));
        setAssignments(validAssignments);
      }
    } catch (err) {
      const error = err as Error & { error_description?: string };
      setUploadError('Upload failed: ' + (error.message || error.error_description || 'Unknown error'));
    } finally {
      setUploadingId(null);
    }
  };

  const openSubmission = async (submissionPath?: string | null) => {
    if (!submissionPath) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/student/submissions?path=${encodeURIComponent(submissionPath)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (j?.signedUrl) {
        window.open(j.signedUrl, '_blank');
      }
    } catch {}
  };

  const filtered = assignments.filter(a => {
    const status = getStatus(a);
    return tab === 'All' || status === tab;
  });

  if (loadingStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-700" /> Assignments</h1>
          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <button
                key={t}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${tab === t ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                disabled
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-6 text-center">Loading student information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-700" /> Assignments</h1>
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-colors ${tab === t ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
            >
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No assignments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(assignment => {
              const status = getStatus(assignment);
              const due = assignment.due_date ? new Date(assignment.due_date) : null;
              const now = new Date();
              const timeLeft = due && due > now ? Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const subject = assignment.subject_id ? subjectsMap[assignment.subject_id] : null;
              // Try to get paper code if paper_id exists
              const paperCode = assignment.paper_id ? paperCodesMap[`${assignment.subject_id}_${assignment.paper_id}`] : undefined;
              return (
                <div key={assignment.id} className="rounded-2xl border shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6 text-blue-700" />
                    <span className="text-lg font-semibold">{assignment.title}</span>
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    Subject: <span className="font-medium">{subject?.name || '-'}</span>
                    {paperCode && <span className="ml-2 text-xs text-gray-400">({paperCode})</span>}
                  </div>
                  <div className="text-gray-600 text-sm mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Due: {due ? `${due.toLocaleDateString()} ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No due date'}
                  </div>
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded ${statusStyles[status]} text-xs font-bold`}>{status}</span>
                    {status === 'Pending' && timeLeft <= 2 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-700 font-semibold"><AlertTriangle className="w-4 h-4" /> {timeLeft === 0 ? 'Due today!' : `Due in ${timeLeft} day${timeLeft > 1 ? 's' : ''}`}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    {/* Download attached paper (allowed only while Pending) */}
                    {assignment.file_url && (
                      getStatus(assignment) === 'Pending' ? (
                        <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors">
                          <FileText className="w-4 h-4" /> Download Paper
                        </a>
                      ) : (
                        <button disabled className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-500 font-semibold cursor-not-allowed">
                          <FileText className="w-4 h-4" /> Download Paper
                        </button>
                      )
                    )}
                    {/* File upload button and preview (allowed only while Pending) */}
                    {status === 'Pending' && (
                      <>
                        <input
                          type="file"
                          ref={el => {
                            if (assignment.id) fileInputRefs.current[assignment.id] = el || undefined;
                          }}
                          className="hidden"
                          onChange={e => handleFileChange(e, assignment)}
                           accept=".pdf,image/*"
                        />
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-800 transition-colors"
                          onClick={() => {
                            if (assignment.id) fileInputRefs.current[assignment.id]?.click();
                          }}
                          disabled={uploadingId === assignment.id}
                        >
                          <UploadCloud className="w-4 h-4" />
                           {uploadingId === assignment.id ? 'Uploading...' : 'Upload Answer Sheet'}
                        </button>
                      </>
                    )}
                    {/* Submission preview */}
                    {assignment.submissions?.[0]?.submission_url && (
                      <button
                        onClick={() => openSubmission(assignment.submissions?.[0]?.submission_url)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-200 text-purple-900 font-semibold hover:bg-purple-300 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> View Submission
                      </button>
                    )}
                    {status === 'Submitted' && !assignment.submissions?.[0]?.submission_url && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-200 text-green-900 font-semibold">
                        <CheckCircle className="w-4 h-4" /> Submitted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {uploadError && <div className="mb-4 text-red-600 font-semibold">{uploadError}</div>}
      </div>
    </div>
  );
}