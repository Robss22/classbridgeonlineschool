'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import TeacherAccessControl from './TeacherAccessControl';

import { normalizeForInsert } from '../utils/normalizeForInsert';
import type { TablesInsert } from '../database.types';

interface TeacherResourceFormProps {
  onClose: () => void;
  resource?: any;
  onSuccess?: () => void;
}

export default function TeacherResourceForm({ onClose, resource, onSuccess }: TeacherResourceFormProps) {
  const { user } = useAuth();
  // const [hydrated, setHydrated] = useState(false); // removed unused
  const [selectedProgram, setSelectedProgram] = useState(resource?.program_id || '');
  const [selectedLevel, setSelectedLevel] = useState(resource?.level_id || '');
  const [selectedSubject, setSelectedSubject] = useState(resource?.subject_id || '');
  const [selectedPaper, setSelectedPaper] = useState(resource?.paper_id || '');
  const [title, setTitle] = useState(resource?.title || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [url, setUrl] = useState(resource?.url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [resourceType, setResourceType] = useState(resource?.type || 'pdf');
  const [papersForDropdown, setPapersForDropdown] = useState<{ paper_id: string; paper_code: string; paper_name: string }[]>([]);

  const resourceTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'video', label: 'Video' },
    { value: 'link', label: 'Link' },
  ];

  useEffect(() => { 
  // setHydrated(true); // removed unused
  }, []);

  useEffect(() => {
    if (resource?.url) setFileUrl('');
  }, [resource]);

  // Fetch papers when subject changes
  useEffect(() => {
    async function fetchPapers() {
      if (selectedSubject) {
        const { data, error } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_code, paper_name')
          .eq('subject_id', selectedSubject);
        if (!error && data) {
          setPapersForDropdown(data);
        } else {
          setPapersForDropdown([]);
        }
      } else {
        setPapersForDropdown([]);
      }
    }
    fetchPapers();
  }, [selectedSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let resourceUrl = url || fileUrl || resource?.url;
    if (!resourceUrl) {
      setError('Please provide a file or a URL.');
      setLoading(false);
      return;
    }

    if (!selectedProgram || !selectedLevel || !selectedSubject) {
      setError('Please select Program, Level, and Subject.');
      setLoading(false);
      return;
    }

    try {
      const dataToSave = {
        title: title.trim() || 'Untitled Resource',
        description: description.trim() || null,
        url: resourceUrl,
        type: resourceType,
        program_id: selectedProgram,
        level_id: selectedLevel,
        subject_id: selectedSubject,
        paper_id: selectedPaper || null,
        uploaded_by: user?.id ?? null,
        created_at: new Date().toISOString(),
      };

      const allowedFields: (keyof TablesInsert<'resources'>)[] = [
        'title', 'description', 'url', 'program_id', 'level_id', 'uploaded_by', 'created_at', 'resource_id'
      ];
      if (resource?.resource_id) {
        // Update existing resource
        const { error: updateError } = await supabase
          .from('resources')
          .update(normalizeForInsert<TablesInsert<'resources'>>(dataToSave, allowedFields))
          .eq('resource_id', resource.resource_id);
        if (updateError) throw updateError;
      } else {
        // Create new resource
        const { error: insertError } = await supabase
          .from('resources')
          .insert([normalizeForInsert<TablesInsert<'resources'>>(dataToSave, allowedFields)]);
        if (insertError) throw insertError;
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving resource:', err);
      setError(err.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (uploadedUrl: string) => {
    setFileUrl(uploadedUrl);
    setUrl('');
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
                  You don&apos;t have any subject or level assignments yet. Please contact an administrator to get assigned to subjects and levels.
                </p>
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
              </div>
            </div>
          );
        }

        // Filter levels by selected program
        const filteredLevels = availableLevels.filter(level => level.program_id === selectedProgram);
        
        // Filter subjects by selected level
        const filteredSubjects = availableSubjects.filter(subject => 
          teacherAssignments.some(assignment => 
            assignment.subject_id === subject.subject_id && 
            assignment.level_id === selectedLevel
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
                {resource ? 'Edit Resource' : 'Add New Resource'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    {resourceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Program and Level Selection */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => { 
                        setSelectedProgram(e.target.value); 
                        setSelectedLevel(''); 
                        setSelectedSubject(''); 
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
                      value={selectedLevel}
                      onChange={(e) => { 
                        setSelectedLevel(e.target.value); 
                        setSelectedSubject(''); 
                      }}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                      disabled={!selectedProgram}
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

                {/* Subject and Paper Selection */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => { 
                        setSelectedSubject(e.target.value); 
                        setSelectedPaper(''); 
                      }}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                      disabled={!selectedLevel}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paper (Optional)</label>
                    <select
                      value={selectedPaper}
                      onChange={(e) => setSelectedPaper(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      disabled={!selectedSubject || papersForDropdown.length === 0}
                    >
                      <option value="">Select Paper</option>
                      {papersForDropdown.map((paper) => (
                        <option key={paper.paper_id} value={paper.paper_id}>
                          {paper.paper_code} {paper.paper_name ? `- ${paper.paper_name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Upload or URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {resourceType === 'link' ? 'URL' : 'Upload File'}
                  </label>
                  {resourceType === 'link' ? (
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  ) : (
                    <FileUpload 
                      bucket="resources"
                      folder={selectedProgram ? `program_${selectedProgram}` : ''}
                      onUpload={handleFileUpload}
                      label="Upload File"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png"
                    />
                  )}
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
                    {loading ? 'Saving...' : (resource ? 'Update Resource' : 'Create Resource')}
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