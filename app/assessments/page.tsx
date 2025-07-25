'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link";
import { BookOpen, Users, Calendar, Megaphone, UploadCloud, MessageCircle, FolderKanban } from "lucide-react";

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
  creator?: { full_name: string | null; email: string | null } | null;
  paper_id: string | null;
}

// Define the props interface for AssessmentForm
interface AssessmentFormProps {
  assessmentItem?: Assessment | null;
  onClose: () => void;
  onSave: () => void;
  creatorId: string | undefined;
  userRole: string | undefined;
  teacherPrograms: string[];
}

// Form for Adding/Editing an Assessment
function AssessmentForm({ assessmentItem, onClose, onSave, creatorId, userRole, teacherPrograms }: AssessmentFormProps) {
  const [title, setTitle] = useState(assessmentItem?.title || '');
  const [description, setDescription] = useState(assessmentItem?.description || '');
  const [type, setType] = useState(assessmentItem?.type || 'assignment');
  const [programId, setProgramId] = useState(assessmentItem?.program_id || '');
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
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
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
        setAllPrograms(programsData || []);

        const { data: levelsData, error: levelsError } = await supabase
          .from('levels')
          .select('level_id, name, program_id');
        if (levelsError) throw levelsError;
        setAllLevels(levelsData || []);

        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('subject_id, name');
        if (subjectsError) throw subjectsError;
        setAllSubjects(subjectsData || []);
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
  const availablePrograms = userRole === 'admin' ? allPrograms : allPrograms.filter(p => teacherPrograms.includes(p.program_id));
  const availableLevels = userRole === 'admin' 
    ? allLevels.filter(l => l.program_id === programId) 
    : allLevels.filter(l => l.program_id === programId && teacherPrograms.includes(l.program_id));
  // Only show subjects offered for the selected level
  const availableSubjects = offeredSubjects.map(o => ({ id: o.subject_id, name: Array.isArray(o.subjects) ? o.subjects[0].name : o.subjects.name }));

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

    try {
      if (assessmentItem) {
        const { error: updateError } = await supabase
          .from('assessments')
          .update(dataToSave)
          .eq('id', assessmentItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('assessments')
          .insert([dataToSave]);
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
      const { data, error } = await supabase.storage
        .from('assessments')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      // Get public URL
      const { data: publicData } = supabase.storage.from('assessments').getPublicUrl(fileName);
      setFileUrl(publicData.publicUrl);
      setFileUploadProgress(100);
    } catch (err: any) {
      setFileUploadError(err.message || 'Upload failed');
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
                {availablePrograms.map(p => (
                  <option key={p.program_id} value={p.program_id}>{p.name}</option>
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
                {availableLevels.map(l => (
                  <option key={l.level_id} value={l.level_id}>{l.name}</option>
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
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
              {availablePapers.map(p => (
                <option key={p.paper_id} value={p.paper_id}>{p.paper_code} {p.paper_name ? `- ${p.paper_name}` : ''}</option>
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
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={loading}
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
export default function AssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
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
  const [teacherAssignedPrograms, setTeacherAssignedPrograms] = useState<string[]>([]);

  const assessmentTypes = ['assignment', 'quiz', 'exam', 'activity'];

  // Fetch teacher's assigned programs on component mount if user is a teacher
  useEffect(() => {
    async function fetchTeacherAssignments() {
      if (user && user.role === 'teacher') {
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('program_id')
            .eq('user_id', user.id);
          
          if (error) throw error;
          setTeacherAssignedPrograms(data.map(t => t.program_id));
        } catch (err: any) {
          console.error('Error fetching teacher assignments:', err);
          setError('Failed to load teacher assignments.');
        }
      }
    }
    if (!authLoading) {
      fetchTeacherAssignments();
    }
  }, [user, authLoading]);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('assessments')
        .select(`
          id, title, description, type, due_date, file_url, paper_id,
          program_id, level_id, subject_id, creator_id, created_at,
          programs(name),
          levels(name),
          subjects(name),
          creator:users(full_name, email)
        `);

      // Filter for teachers: only show assessments for their assigned programs
      if (user && user.role === 'teacher' && teacherAssignedPrograms.length > 0) {
        query = query.in('program_id', teacherAssignedPrograms);
      } else if (user && user.role === 'teacher' && teacherAssignedPrograms.length === 0) {
        // If teacher has no assigned programs, show nothing
        setAssessments([]);
        setLoading(false);
        return;
      }

      // Apply search and filter by type
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

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
  }, [user, teacherAssignedPrograms, search, filterType]);

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
      alert('Failed to delete assessment: ' + err.message);
    } finally {
      setShowDeleteConfirm(false);
      setAssessmentToDelete(null);
    }
  };

  if (authLoading) {
    return <div className="text-center py-8 text-gray-500">Loading user data...</div>;
  }

  // Determine if the current user can create/edit assessments
  const canCreateEdit = user && (user.role === 'admin' || user.role === 'teacher');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Assessments</h1>

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
            + Create New
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading assessments...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : assessments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No assessments found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {assessment.creator?.full_name || assessment.creator?.email || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {canCreateEdit && (user.role === 'admin' || assessment.creator_id === user.id) && (
                      <ActionsDropdown
                        onEdit={() => setEditingAssessment(assessment)}
                        onDelete={() => {setAssessmentToDelete(assessment); setShowDeleteConfirm(true);}}
                      />
                    )}
                    {assessment.file_url && (
                      <a 
                        href={assessment.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline ml-2 text-xs"
                      >
                        View File
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateForm && (
        <AssessmentForm
          onClose={() => setShowCreateForm(false)}
          onSave={() => { setShowCreateForm(false); fetchAssessments(); }}
          creatorId={user?.id}
          userRole={user?.role}
          teacherPrograms={teacherAssignedPrograms}
        />
      )}

      {editingAssessment && (
        <AssessmentForm
          assessmentItem={editingAssessment}
          onClose={() => setEditingAssessment(null)}
          onSave={() => { setEditingAssessment(null); fetchAssessments(); }}
          creatorId={user?.id}
          userRole={user?.role}
          teacherPrograms={teacherAssignedPrograms}
        />
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