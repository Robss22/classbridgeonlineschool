'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacher } from '@/contexts/TeacherContext';
// import Link from "next/link";
// import { BookOpen, Users, Calendar, Megaphone, UploadCloud, MessageCircle, FolderKanban } from "lucide-react";
import FileDownload from '@/components/FileDownload';
import TeacherAssessmentForm from '@/components/TeacherAssessmentForm';

import { normalizeForInsert } from '../../utils/normalizeForInsert';
import type { TablesInsert } from '../../database.types';

// Reusable Dropdown menu for actions
function ActionsDropdown({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Actions ▼
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-md z-10 py-1"
          role="menu"
        >
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
          >
            Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-100"
            role="menuitem"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Custom Delete Confirmation Modal
function DeleteConfirmModal({ show, onClose, onConfirm, itemName }: { show: boolean; onClose: () => void; onConfirm: () => void; itemName: string }) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
        <p className="mb-6">
          Are you sure you want to delete &quot;<span className="font-semibold">{itemName}</span>&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Define the Assessment type for consistency
interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  due_date: string | null;
  file_url: string | null;
  creator_id: string;
  created_at: string;
  programs?: { name: string } | null;
  levels?: { name: string } | null;
  subjects?: { name: string } | null;
  creator?: { full_name: string | null; email: string | null; role: string | null } | null;
  paper_id: string | null;
}

// Define the props interface for AssessmentForm
interface AssessmentFormProps {
  assessmentItem?: Assessment | null;
  onClose: () => void;
  onSave: () => void;
  creatorId: string | undefined;
  userRole: string | undefined;
}

// Form for Adding/Editing an Assessment
function AssessmentForm({ assessmentItem, onClose, onSave, creatorId, userRole }: AssessmentFormProps) {
  // Safely use teacher context - for admin users, this will be empty
  let teacherAssignments: any[] = [];
  
  try {
    const teacherContext = useTeacher();
    teacherAssignments = teacherContext.assignments || [];
  } catch (error) {
    // If TeacherProvider is not available, use empty assignments
    teacherAssignments = [];
  }
  
  const [title, setTitle] = useState(assessmentItem?.title || '');
  const [description, setDescription] = useState(assessmentItem?.description || '');
  const [type, setType] = useState(assessmentItem?.type || 'assignment');
  const [programId, setProgramId] = useState(assessmentItem?.program_id || '');
  
  // Debug programId changes (only when it actually changes)
  useEffect(() => {
    if (programId) {
      console.log('🔍 [AssessmentForm] ProgramId changed:', programId);
    }
  }, [programId]);
  const [levelId, setLevelId] = useState(assessmentItem?.level_id || '');
  const [subjectId, setSubjectId] = useState(assessmentItem?.subject_id || '');
  const [dueDate, setDueDate] = useState(
    assessmentItem?.due_date ? new Date(assessmentItem.due_date).toISOString().slice(0, 16) : ''
  );
  const [fileUrl, setFileUrl] = useState(assessmentItem?.file_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileUploadProgress, setFileUploadProgress] = useState<number | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [allLevels, setAllLevels] = useState<any[]>([]);
  // const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [offeredSubjects, setOfferedSubjects] = useState<any[]>([]);
  const [availablePapers, setAvailablePapers] = useState<any[]>([]);

  const assessmentTypes = ['assignment', 'quiz', 'exam', 'activity'];

  // Fetch programs, levels, and subjects for dropdowns
  useEffect(() => {
    async function fetchFormDependencies() {
      try {
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('program_id, name');
        if (programsError) throw programsError;
        console.log('🔍 [AssessmentForm] Programs fetched:', programsData?.length, 'programs');
        // Remove duplicates based on program_id
        const uniquePrograms = programsData ? 
          programsData.filter((program, index, self) => 
            index === self.findIndex(p => p.program_id === program.program_id)
          ) : [];
        setAllPrograms(uniquePrograms);

        const { data: levelsData, error: levelsError } = await supabase
          .from('levels')
          .select('level_id, name, program_id');
        if (levelsError) throw levelsError;
        console.log('🔍 [AssessmentForm] Levels fetched:', levelsData?.length, 'levels');
        // Remove duplicates based on level_id
        const uniqueLevels = levelsData ? 
          levelsData.filter((level, index, self) => 
            index === self.findIndex(l => l.level_id === level.level_id)
          ) : [];
                setAllLevels(uniqueLevels);

        // const { data: subjectsData, error: subjectsError } = await supabase
        //   .from('subjects')
        //   .select('subject_id, name');
        // if (subjectsError) throw subjectsError;
        // Remove duplicates based on subject_id
        // const uniqueSubjects = subjectsData ?
        //   subjectsData.filter((subject, index, self) =>
        //     index === self.findIndex(s => s.subject_id === subject.subject_id)
        //   ) : [];
        // setAllSubjects(uniqueSubjects);
      } catch (err: any) {
        console.error('Error fetching form dependencies:', err);
        setError('Failed to load form options.');
      }
    }
    fetchFormDependencies();
  }, []);

  // Fetch offered subjects whenever levelId or programId changes
  useEffect(() => {
    async function fetchOfferedSubjects() {
      if (levelId && programId) {
        const { data: offerings, error: offeringsError } = await supabase
          .from('subject_offerings')
          .select('subject_id, subjects(name)')
          .eq('level_id', levelId)
          .eq('program_id', programId);
        if (offeringsError) {
          setError('Failed to load subjects for this level.');
          setOfferedSubjects([]);
        } else {
          setOfferedSubjects(offerings || []);
        }
      } else {
        setOfferedSubjects([]);
      }
    }
    fetchOfferedSubjects();
  }, [levelId, programId]);

  // Filter programs/levels/subjects based on teacher's assignments
  const teacherSubjectIds = teacherAssignments.map(assignment => assignment.subject_id);
  const teacherLevelIds = teacherAssignments.map(assignment => assignment.level_id);

  // Filter available options based on teacher's assignments
  const teacherPrograms = allPrograms; // For now, show all programs to teachers
  const availablePrograms = userRole === 'admin' ? allPrograms : teacherPrograms;
  const availableLevels = userRole === 'admin' ? allLevels : allLevels.filter(level => teacherLevelIds.includes(level.level_id));
  // const availableSubjects = userRole === 'admin' ? allSubjects : allSubjects.filter(subject => teacherSubjectIds.includes(subject.subject_id));
  
  // Filter levels by selected program for dropdown
  const dropdownLevels = availableLevels.filter(level => level.program_id === programId);
  
  // Filter subjects for dropdown - use offered subjects but filter by teacher assignments
  const dropdownSubjects = userRole === 'admin' 
    ? offeredSubjects.map(o => ({ id: o.subject_id, name: Array.isArray(o.subjects) ? o.subjects[0].name : o.subjects.name }))
    : offeredSubjects
        .filter(o => teacherSubjectIds.includes(o.subject_id))
        .map(o => ({ id: o.subject_id, name: Array.isArray(o.subjects) ? o.subjects[0].name : o.subjects.name }));
  
  // Debug logging (only when data changes)
  useEffect(() => {
    console.log('🔍 [AssessmentForm] Debug info:', {
      userRole,
      teacherProgramsLength: teacherPrograms.length,
      allProgramsCount: allPrograms.length,
      availableProgramsCount: availablePrograms.length,
      availablePrograms: availablePrograms.map(p => ({ id: p.program_id, name: p.name }))
    });
  }, [userRole, teacherPrograms, allPrograms, availablePrograms]);
  
  // Debug logging for levels (only when data changes)
  useEffect(() => {
    console.log('🔍 [AssessmentForm] Levels debug:', {
      programId,
      allLevelsCount: allLevels.length,
      availableLevelsCount: availableLevels.length,
      dropdownLevelsCount: dropdownLevels.length,
      dropdownLevels: dropdownLevels.map(l => ({ id: l.level_id, name: l.name, programId: l.program_id }))
    });
  }, [programId, allLevels, availableLevels, dropdownLevels]);

  // Fetch available papers when subjectId changes
  useEffect(() => {
    async function fetchPapers() {
      if (subjectId) {
        const { data, error } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_code, paper_name')
          .eq('subject_id', subjectId);
        if (!error && data) {
          setAvailablePapers(data);
        } else {
          setAvailablePapers([]);
        }
      } else {
        setAvailablePapers([]);
      }
    }
    fetchPapers();
  }, [subjectId]);

  // Add paper_id state
  const [paperId, setPaperId] = useState(assessmentItem?.paper_id || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim() || !type || !programId || !levelId || !subjectId) {
      setError('Please fill in all required fields (Title, Type, Program, Level, Subject).');
      setLoading(false);
      return;
    }

    const dataToSave = {
      title: title.trim(),
      description: description.trim() || null,
      type: type,
      program_id: programId,
      level_id: levelId,
      subject_id: subjectId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      file_url: fileUrl || null,
      creator_id: creatorId,
      paper_id: paperId || null,
    };
    
    console.log('🔍 [AssessmentForm] Saving assessment:', {
      ...dataToSave,
      fileUrl: fileUrl,
      hasFileUrl: !!fileUrl
    });
    
    // Warn user if no file was uploaded but they might have intended to
    if (!fileUrl && !assessmentItem?.file_url) {
      console.warn('⚠️ [AssessmentForm] No file URL - assessment will be saved without attachment');
    }

    try {
      const allowedFields: (keyof TablesInsert<'assessments'>)[] = [
        'title', 'description', 'type', 'program_id', 'level_id', 'subject_id', 'due_date', 'file_url', 'creator_id', 'paper_id', 'created_at', 'id'
      ];
      if (assessmentItem) {
        const { error: updateError } = await supabase
          .from('assessments')
          .update(normalizeForInsert<TablesInsert<'assessments'>>(dataToSave, allowedFields))
          .eq('id', assessmentItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('assessments')
          .insert([normalizeForInsert<TablesInsert<'assessments'>>(dataToSave, allowedFields)]);
        if (insertError) throw insertError;
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving assessment:', err);
      setError('Failed to save assessment: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploadError(null);
    setFileUploadProgress(0);
    // Only allow PDF and Word files
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setFileUploadError('Only PDF and Word files are allowed.');
      setFileUploadProgress(null);
      return;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `assessment_${Date.now()}.${fileExt}`;
      
      console.log('🔍 [AssessmentForm] Uploading file:', {
        fileName,
        fileSize: file.size,
        fileType: file.type
      });
      
      const { error } = await supabase.storage
        .from('assessments')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      // Get public URL
      const { data: publicData } = supabase.storage.from('assessments').getPublicUrl(fileName);
      console.log('🔍 [AssessmentForm] File uploaded successfully:', {
        fileName,
        publicUrl: publicData.publicUrl
      });
      setFileUrl(publicData.publicUrl);
      setFileUploadProgress(100);
    } catch (err: any) {
      console.error('🔍 [AssessmentForm] File upload error:', err);
      setFileUploadError(`Upload failed: ${err.message || 'Unknown error'}`);
      setFileUploadProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">
          {assessmentItem ? 'Edit Assessment' : 'Create New Assessment'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              {assessmentTypes.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          {/* Program and Level on the same row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={programId}
                onChange={(e) => { setProgramId(e.target.value); setLevelId(''); setSubjectId(''); }}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Select Program</option>
                {availablePrograms.map((p, index) => (
                  <option key={`${p.program_id}-${index}`} value={p.program_id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={levelId}
                onChange={(e) => { setLevelId(e.target.value); setSubjectId(''); }}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                disabled={!programId}
              >
                <option value="">Select Level</option>
                {dropdownLevels.map((l, index) => (
                  <option key={`${l.level_id}-${index}`} value={l.level_id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Subject and Due Date on the same row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setPaperId(''); }}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
                disabled={!levelId}
              >
                <option value="">Select Subject</option>
                {dropdownSubjects.map((s, index) => (
                  <option key={`${s.id}-${index}`} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
          {/* Paper selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paper (Optional)</label>
            <select
              value={paperId}
              onChange={e => setPaperId(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={!subjectId || availablePapers.length === 0}
            >
              <option value="">Select Paper</option>
              {availablePapers.map((p, index) => (
                <option key={`${p.paper_id}-${index}`} value={p.paper_id}>{p.paper_code} {p.paper_name ? `- ${p.paper_name}` : ''}</option>
              ))}
            </select>
          </div>
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (PDF or Word only)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            {fileUploadProgress !== null && (
              <div className="text-xs text-gray-500 mt-1">Upload progress: {fileUploadProgress}%</div>
            )}
            {fileUploadError && (
              <div className="text-xs text-red-500 mt-1">{fileUploadError}</div>
            )}
            {fileUrl && (
              <div className="text-xs text-green-600 mt-1">File uploaded. <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">View file</a></div>
            )}
            <div className="text-xs text-gray-400 mt-1">Allowed: PDF, DOC, DOCX</div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              disabled={!!loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={!!loading}
            >
              {loading ? 'Saving...' : (assessmentItem ? 'Save Changes' : 'Create Assessment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Assessments Page Component
// Custom hook to safely use TeacherContext
function useTeacherSafely() {
  try {
    return useTeacher();
  } catch (error) {
    // If TeacherProvider is not available, return default values
    return { 
      assignments: [], 
      subjects: [],
      levels: [],
      programs: [],
      loading: false, 
      error: null, 
      refreshAssignments: async () => {} 
    };
  }
}

export default function AssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { assignments: teacherAssignments } = useTeacherSafely();
  console.log('DEBUG user:', user, 'authLoading:', authLoading);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  // Always call hooks in the same order, never conditionally

  const assessmentTypes = ['assignment', 'quiz', 'exam', 'activity'];

  // Memoize teacherSubjectIds and teacherLevelIds to prevent unnecessary re-renders
  const teacherSubjectIds = useMemo(() => teacherAssignments.map(assignment => assignment.subject_id), [teacherAssignments]);
  const teacherLevelIds = useMemo(() => teacherAssignments.map(assignment => assignment.level_id), [teacherAssignments]);

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Debug: Log user and filter arrays
    console.log('🔍 [AssessmentsPage] user:', user);
    console.log('🔍 [AssessmentsPage] teacherAssignments:', teacherAssignments);
    console.log('🔍 [AssessmentsPage] teacherSubjectIds:', teacherSubjectIds);
    console.log('🔍 [AssessmentsPage] teacherLevelIds:', teacherLevelIds);
    try {
      // Fix: Changed 'from' to 'supabase.from' to correctly call the Supabase client method.
      let query = supabase
        .from('assessments')
        .select(`
          id, title, description, type, due_date, file_url, paper_id,
          program_id, level_id, subject_id, creator_id, created_at,
          programs(name),
          levels(name),
          subjects(name),
          creator:users(full_name, email, role)
        `);

      // Filter for teachers: only show their own assessments for their assigned subjects and levels
      if (user && (user.role === 'teacher' || user.role === 'class_tutor')) {
        if (teacherSubjectIds.length > 0 && teacherLevelIds.length > 0) {
          // Show only assessments created by this teacher for their assigned subjects and levels
          query = query
            .eq('creator_id', user.id)
            .in('subject_id', teacherSubjectIds)
            .in('level_id', teacherLevelIds);
        } else {
          // If teacher has no assigned subjects/levels, show all their assessments
          query = query.eq('creator_id', user.id);
        }
      }
      // For admins: show all assessments (no additional filtering needed)

      // Apply search and filter by type
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      console.log('🔍 [AssessmentsPage] Fetched assessments:', {
        count: data?.length || 0,
        assessments: data?.map(a => ({ 
          id: a.id, 
          title: a.title, 
          creator_id: a.creator_id, 
          creator_role: (a.creator as any)?.role,
          creator_name: (a.creator as any)?.full_name,
          program_id: a.program_id 
        }))
      });

      // Transform the fetched data to match the Assessment interface
      const transformedData: Assessment[] = (data as any[] || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        program_id: item.program_id,
        level_id: item.level_id,
        subject_id: item.subject_id,
        due_date: item.due_date,
        file_url: item.file_url,
        creator_id: item.creator_id,
        created_at: item.created_at,
        programs: item.programs ? item.programs : null,
        levels: item.levels ? item.levels : null,
        subjects: item.subjects ? item.subjects : null,
        creator: item.creator ? item.creator : null,
        paper_id: item.paper_id,
      }));

      setAssessments(transformedData);
    } catch (err: any) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, search, filterType, teacherSubjectIds, teacherLevelIds, teacherAssignments]);

  useEffect(() => {
    if (!authLoading) {
      fetchAssessments();
    }
  }, [fetchAssessments, authLoading]);

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    try {
      const { error } = await supabase.from('assessments').delete().eq('id', assessmentToDelete.id);
      if (error) throw error;
      fetchAssessments();
    } catch (err: any) {
      console.error('Error deleting assessment:', err);
      // Fix: Replaced alert() with console.error for better user experience in an iframe.
      // You might want to implement a toast notification or a small message box here.
      setError('Failed to delete assessment: ' + err.message);
    } finally {
      setShowDeleteConfirm(false);
      setAssessmentToDelete(null);
    }
  };

  // Collapsible state for each group - moved before any early returns
  const [showAdmins, setShowAdmins] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);

  if (authLoading) {
    return <div className="text-center py-8 text-gray-500">Loading user data...</div>;
  }

  // Determine if the current user can create/edit assessments
  const canCreateEdit = user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'class_tutor');

  // For teachers: show only their assessments in a simple list
  // For admins: group assessments by creator role
  const isTeacher = user && (user.role === 'teacher' || user.role === 'class_tutor');

  // Group assessments by creator role (only for admin view)
  const groupedAssessments = {
    admin: assessments.filter(a => {
      // Group admin-created assessments
      return (a.creator as any)?.role === 'admin' || (a.creator_id && user && user.role === 'admin' && a.creator_id === user.id);
    }),
    teacher: assessments.filter(a => {
      // Group teacher-created assessments
      return (a.creator as any)?.role === 'teacher' || (a.creator as any)?.role === 'class_tutor';
    }),
  };

  // Debug grouped assessments
  console.log('🔍 [AssessmentsPage] Grouped assessments:', {
    totalAssessments: assessments.length,
    adminAssessments: groupedAssessments.admin.length,
    teacherAssessments: groupedAssessments.teacher.length,
    assessments: assessments.map(a => ({
      id: a.id,
      title: a.title,
      creator_id: a.creator_id,
      creator_role: (a.creator as any)?.role,
      creator_name: (a.creator as any)?.full_name
    }))
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {isTeacher ? 'My Assessments' : 'Manage Assessments'}
      </h1>

      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search assessments by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md flex-grow min-w-[200px]"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md"
        >
          <option value="">All Types</option>
          {assessmentTypes.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {canCreateEdit && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold shadow-md transition duration-200 ease-in-out flex-shrink-0"
          >
            + {isTeacher ? 'Create Assessment' : 'Create New'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading assessments...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : assessments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {isTeacher ? 'No assessments found. Create your first assessment!' : 'No assessments found.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
          {isTeacher ? (
            // Teacher View: Simple list of their own assessments
            <div>
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900">My Assessments</h3>
                <p className="text-sm text-blue-700">Manage assessments for your assigned programs</p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Program</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {assessments.map(assessment => (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.programs?.name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.levels?.name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.subjects?.name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <FileDownload 
                          fileUrl={assessment.file_url} 
                          fileName={`${assessment.title}-assessment`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <ActionsDropdown
                          onEdit={() => setEditingAssessment(assessment)}
                          onDelete={() => {setAssessmentToDelete(assessment); setShowDeleteConfirm(true);}}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Admin View: Grouped by creator role
            <>
              {/* Admins Section */}
              <div className="border-b">
                <button
                  className="flex items-center gap-2 px-4 py-2 w-full text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100"
                  onClick={() => setShowAdmins(v => !v)}
                >
                  <span>{showAdmins ? '▼' : '▶'} Admins ({groupedAssessments.admin.length})</span>
                </button>
                {showAdmins && groupedAssessments.admin.length > 0 && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Program</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Creator</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {groupedAssessments.admin.map(assessment => (
                        <tr key={assessment.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.programs?.name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.levels?.name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.subjects?.name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.creator?.full_name || assessment.creator?.email || 'Unknown'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <FileDownload 
                              fileUrl={assessment.file_url} 
                              fileName={`${assessment.title}-assessment`}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <ActionsDropdown
                              onEdit={() => setEditingAssessment(assessment)}
                              onDelete={() => {setAssessmentToDelete(assessment); setShowDeleteConfirm(true);}}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Teachers Section */}
              <div className="border-b">
                <button
                  className="flex items-center gap-2 px-4 py-2 w-full text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100"
                  onClick={() => setShowTeachers(v => !v)}
                >
                  <span>{showTeachers ? '▼' : '▶'} Teachers ({groupedAssessments.teacher.length})</span>
                </button>
                {showTeachers && (
                  groupedAssessments.teacher.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Program</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Creator</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {groupedAssessments.teacher.map(assessment => (
                          <tr key={assessment.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.title}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.programs?.name || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.levels?.name || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.subjects?.name || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{assessment.creator?.full_name || assessment.creator?.email || 'Unknown'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              <FileDownload 
                                fileUrl={assessment.file_url} 
                                fileName={`${assessment.title}-assessment`}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              <ActionsDropdown
                                onEdit={() => setEditingAssessment(assessment)}
                                onDelete={() => {setAssessmentToDelete(assessment); setShowDeleteConfirm(true);}}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-3 text-gray-500">No teacher assessments found.</div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showCreateForm && (
        user?.role === 'teacher' || user?.role === 'class_tutor' ? (
          <TeacherAssessmentForm
            onClose={() => setShowCreateForm(false)}
            onSave={() => { setShowCreateForm(false); fetchAssessments(); }}
          />
        ) : (
          <AssessmentForm
            onClose={() => setShowCreateForm(false)}
            onSave={() => { setShowCreateForm(false); fetchAssessments(); }}
            creatorId={user?.id}
            userRole={user?.role}
          />
        )
      )}

      {editingAssessment && (
        user?.role === 'teacher' || user?.role === 'class_tutor' ? (
          <TeacherAssessmentForm
            assessmentItem={editingAssessment}
            onClose={() => setEditingAssessment(null)}
            onSave={() => { setEditingAssessment(null); fetchAssessments(); }}
          />
        ) : (
          <AssessmentForm
            assessmentItem={editingAssessment}
            onClose={() => setEditingAssessment(null)}
            onSave={() => { setEditingAssessment(null); fetchAssessments(); }}
            creatorId={user?.id}
            userRole={user?.role}
          />
        )
      )}

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAssessment}
        itemName={assessmentToDelete?.title || ''}
      />
    </div>
  );
}
