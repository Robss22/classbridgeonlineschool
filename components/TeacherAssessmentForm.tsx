'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import TeacherAccessControl from './TeacherAccessControl';

interface TeacherAssessmentFormProps {
  onClose: () => void;
  assessmentItem?: any;
  onSave: () => void;
}

export default function TeacherAssessmentForm({ onClose, assessmentItem, onSave }: TeacherAssessmentFormProps) {
  const { user } = useAuth();
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
  const [availablePapers, setAvailablePapers] = useState<any[]>([]);
  const [paperId, setPaperId] = useState(assessmentItem?.paper_id || '');

  const assessmentTypes = ['assignment', 'quiz', 'exam', 'activity'];

  // Fetch papers when subject changes
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      creator_id: user?.id,
      paper_id: paperId || null,
    };

    try {
      if (assessmentItem?.id) {
        // Update existing assessment
        const { error: updateError } = await supabase
          .from('assessments')
          .update(dataToSave)
          .eq('id', assessmentItem.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new assessment
        const { error: insertError } = await supabase
          .from('assessments')
          .insert([dataToSave]);
        
        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving assessment:', err);
      setError(err.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadProgress(0);
    setFileUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `assessments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assessments')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setFileUploadProgress(percent);
          },
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assessments')
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      setFileUploadProgress(null);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setFileUploadError(`Upload failed: ${err.message || 'Unknown error'}`);
      setFileUploadProgress(null);
    }
  };

  return (
    <TeacherAccessControl>
      {({ teacherAssignments, availablePrograms, availableLevels, availableSubjects, isLoading, error: accessError }) => {
        if (isLoading) {
          return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-center">Loading...</div>
              </div>
            </div>
          );
        }

        if (accessError) {
          return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-red-600">{accessError}</div>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button>
              </div>
            </div>
          );
        }

        if (teacherAssignments.length === 0) {
          return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                <h3 className="text-lg font-semibold mb-4">No Assignments</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any subject or level assignments yet. Please contact an administrator to get assigned to subjects and levels.
                </p>
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
              </div>
            </div>
          );
        }

        // Filter levels by selected program
        const filteredLevels = availableLevels.filter(level => level.program_id === programId);
        
        // Filter subjects by selected level
        const filteredSubjects = availableSubjects.filter(subject => 
          teacherAssignments.some(assignment => 
            assignment.subject_id === subject.subject_id && 
            assignment.level_id === levelId
          )
        );

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

                {/* Program and Level Selection */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select
                      value={programId}
                      onChange={(e) => { 
                        setProgramId(e.target.value); 
                        setLevelId(''); 
                        setSubjectId(''); 
                      }}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    >
                      <option value="">Select Program</option>
                      {availablePrograms.map((program) => (
                        <option key={program.program_id} value={program.program_id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={levelId}
                      onChange={(e) => { 
                        setLevelId(e.target.value); 
                        setSubjectId(''); 
                      }}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                      disabled={!programId}
                    >
                      <option value="">Select Level</option>
                      {filteredLevels.map((level) => (
                        <option key={level.level_id} value={level.level_id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject and Due Date Selection */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => { 
                        setSubjectId(e.target.value); 
                        setPaperId(''); 
                      }}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                      disabled={!levelId}
                    >
                      <option value="">Select Subject</option>
                      {filteredSubjects.map((subject) => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.name}
                        </option>
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
                    {availablePapers.map((p) => (
                      <option key={p.paper_id} value={p.paper_id}>
                        {p.paper_code} {p.paper_name ? `- ${p.paper_name}` : ''}
                      </option>
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
                    <div className="text-xs text-green-600 mt-1">File uploaded successfully</div>
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
      }}
    </TeacherAccessControl>
  );
} 