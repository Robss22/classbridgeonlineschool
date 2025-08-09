'use client';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen, FileText, UploadCloud, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';

const statusStyles = {
  Pending: 'bg-yellow-200 text-yellow-900',
  Submitted: 'bg-green-200 text-green-900',
  Overdue: 'bg-red-200 text-red-900',
};

// ...existing code...

type Submission = {
  submission_url: string | null;
  submitted_at: string | null;
  status: string | null;
};

type Assignment = {
  id: string | null;
  title: string | null;
  description: string | null;
  due_date: string | null;
  program_id: string | null;
  level_id: string | null;
  subject_id: string | null;
  paper_id: string | null;
  file_url: string | null;
  type: string | null;
  created_at: string | null;
  creator_id: string | null;
  submissions?: Submission[];
};

interface SubjectsMap {
  [key: string]: { subject_id: string; name: string };
}

interface PaperCodesMap {
  [key: string]: string;
}

type UploadingId = string | null;

const tabs = ['All', 'Pending', 'Submitted', 'Overdue'];

function getStatus(assignment: Assignment): 'Submitted' | 'Overdue' | 'Pending' {
  if (assignment.submissions && assignment.submissions.length > 0) return 'Submitted';
  if (!assignment.due_date) return 'Pending';
  const due = new Date(assignment.due_date);
  const now = new Date();
  if (now > due) return 'Overdue';
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
          .order('due_date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });

        // Process and validate the data
        const validAssignments = (assessmentsData || [])
          .filter((data: any): data is Assignment => data && typeof data.id === 'string' && typeof data.title === 'string' && typeof data.created_at === 'string')
          .map(assignment => ({
            ...assignment,
            submissions: Array.isArray(assignment.submissions) ? assignment.submissions : [],
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
      } catch (err) {
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
      // Upload to Supabase Storage (bucket: 'submissions')
      const filePath = `${studentInfo.registration_number || 'student'}/${assignment.id}/${file.name}`;
      const { error } = await supabase.storage.from('submissions').upload(filePath, file, { upsert: true });
      if (error) throw error;
      // Save to submissions table
      const { data: publicUrlData } = supabase.storage.from('submissions').getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      // Insert submission with proper timestamps
      await supabase.from('submissions').insert([{
        assessment_id: assignment.id,
        student_id: studentInfo.id,
        submission_url: publicUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      }]);
      
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
        .in('subject_id', subjectIds);

      if (updated) {
        const validAssignments = (updated || [])
          .filter((data: any): data is Assignment => data && typeof data.id === 'string' && typeof data.title === 'string' && typeof data.created_at === 'string')
          .map(assignment => ({
            ...assignment,
            submissions: Array.isArray(assignment.submissions) ? assignment.submissions : [],
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
                    {/* Download attached paper */}
                    {assignment.file_url && (
                      <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors">
                        <FileText className="w-4 h-4" /> Download Paper
                      </a>
                    )}
                    {/* File upload button and preview */}
                    {status === 'Pending' && (
                      <>
                        <input
                          type="file"
                          ref={el => {
                            if (assignment.id) fileInputRefs.current[assignment.id] = el || undefined;
                          }}
                          className="hidden"
                          onChange={e => handleFileChange(e, assignment)}
                        />
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-800 transition-colors"
                          onClick={() => {
                            if (assignment.id) fileInputRefs.current[assignment.id]?.click();
                          }}
                          disabled={uploadingId === assignment.id}
                        >
                          <UploadCloud className="w-4 h-4" />
                          {uploadingId === assignment.id ? 'Uploading...' : 'Upload'}
                        </button>
                      </>
                    )}
                    {/* Submission preview */}
                    {assignment.submissions?.[0]?.submission_url && (
                      <a
                        href={assignment.submissions?.[0]?.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-200 text-purple-900 font-semibold hover:bg-purple-300 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> View Submission
                      </a>
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