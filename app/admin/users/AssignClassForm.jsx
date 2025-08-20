'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AssignClassForm({ teacher, onSuccess, onCancel }) {
  
  // Form state
  const [formData, setFormData] = useState({
    programId: teacher?.program_id || '',
    levelId: '',
    subjectOfferingId: '',
    paperId: '',
    academicYear: ''
  });

  // Data state
  const [programs, setPrograms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjectOfferings, setSubjectOfferings] = useState([]);
  const [papers, setPapers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isClassTutor, setIsClassTutor] = useState(false);
  
  // Loading states for each dropdown
  const [loadingStates, setLoadingStates] = useState({
    programs: false,
    levels: false,
    subjects: false,
    papers: false
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Helper function to update loading states
  const setLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  // Helper function to clear dependent fields
  const clearDependentFields = useCallback((field) => {
    const updates = {};
    
    switch (field) {
      case 'programId':
        updates.levelId = '';
        updates.subjectOfferingId = '';
        updates.paperId = '';
        break;
      case 'levelId':
        updates.subjectOfferingId = '';
        updates.paperId = '';
        break;
      case 'subjectOfferingId':
        updates.paperId = '';
        break;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear dependent data
    if (field === 'programId') {
      setLevels([]);
      setSubjectOfferings([]);
      setPapers([]);
    } else if (field === 'levelId') {
      setSubjectOfferings([]);
      setPapers([]);
    } else if (field === 'subjectOfferingId') {
      setPapers([]);
    }
  }, []);

  // Fetch programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingState('programs', true);
        setErrorMsg('');
        
        const { data, error } = await supabase
          .from('programs')
          .select('program_id, name')
          .order('name');
        
        if (error) throw error;
        
        setPrograms(data || []);
      } catch (error) {
        console.error('❌ [AssignClassForm] Error fetching programs:', error);
        setErrorMsg('Failed to load programs. Please try again.');
      } finally {
        setLoadingState('programs', false);
      }
    };

    fetchPrograms();
  }, [setLoadingState]);

  // Fetch levels when program changes
  useEffect(() => {
    const fetchLevels = async () => {
      if (!formData.programId) {
        setLevels([]);
        return;
      }

      try {
        setLoadingState('levels', true);
        setErrorMsg('');
        
        const { data, error } = await supabase
          .from('levels')
          .select('level_id, name')
          .eq('program_id', formData.programId)
          .order('name');
        
        if (error) throw error;
        
        setLevels(data || []);
      } catch (error) {
        console.error('❌ [AssignClassForm] Error fetching levels:', error);
        setErrorMsg('Failed to load levels. Please try again.');
        setLevels([]);
      } finally {
        setLoadingState('levels', false);
      }
    };

    fetchLevels();
  }, [formData.programId, setLoadingState]);

  // Fetch subject offerings when level changes
  useEffect(() => {
    const fetchSubjectOfferings = async () => {
      if (!formData.programId || !formData.levelId) {
        setSubjectOfferings([]);
        return;
      }

      try {
        setLoadingState('subjects', true);
        setErrorMsg('');
        
        const { data, error } = await supabase
          .from('subject_offerings')
          .select(`
            id, 
            subject_id, 
            is_compulsory,
            subjects(name)
          `)
          .eq('program_id', formData.programId)
          .eq('level_id', formData.levelId)
          .order('subjects(name)');
        
        if (error) throw error;
        
        setSubjectOfferings(data || []);
      } catch (error) {
        console.error('❌ [AssignClassForm] Error fetching subject offerings:', error);
        setErrorMsg('Failed to load subjects. Please try again.');
        setSubjectOfferings([]);
      } finally {
        setLoadingState('subjects', false);
      }
    };

    fetchSubjectOfferings();
  }, [formData.programId, formData.levelId, setLoadingState]);

  // Fetch papers when subject offering changes
  useEffect(() => {
    const fetchPapers = async () => {
      if (!formData.subjectOfferingId) {
        setPapers([]);
        return;
      }

      try {
        setLoadingState('papers', true);
        setErrorMsg('');
        
        // Get the subject_id from the selected offering
        const offering = subjectOfferings.find(so => so.id === formData.subjectOfferingId);
        if (!offering) {
          setPapers([]);
          return;
        }

        const { data, error } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_code, paper_name')
          .eq('subject_id', offering.subject_id)
          .order('paper_code');
        
        if (error) throw error;
        
        setPapers(data || []);
      } catch (error) {
        console.error('❌ [AssignClassForm] Error fetching papers:', error);
        setErrorMsg('Failed to load papers. Please try again.');
        setPapers([]);
      } finally {
        setLoadingState('papers', false);
      }
    };

    fetchPapers();
  }, [formData.subjectOfferingId, subjectOfferings, setLoadingState]);

  // Validation function
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.programId) errors.programId = 'Please select a program';
    if (!formData.levelId) errors.levelId = 'Please select a level';
    if (!formData.subjectOfferingId) errors.subjectOfferingId = 'Please select a subject';
    if (!formData.paperId) errors.paperId = 'Please select a paper';
    if (!formData.academicYear.trim()) errors.academicYear = 'Please enter an academic year';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Validate teacher has teacher_id
      if (!teacher?.teacher_id) {
        throw new Error('Teacher ID is missing. Please contact an administrator.');
      }

      // Get the subject offering details
      const offering = subjectOfferings.find(so => so.id === formData.subjectOfferingId);
      if (!offering) {
        throw new Error('Selected subject offering not found.');
      }

      // Insert into teacher_assignments table
      const { error: teacherAssignmentError } = await supabase
        .from('teacher_assignments')
        .insert([{
          teacher_id: teacher.teacher_id,
          subject_id: offering.subject_id,
          level_id: formData.levelId,
          program_id: formData.programId,
          academic_year: formData.academicYear.trim(),
          assigned_at: new Date().toISOString()
        }]);

      if (teacherAssignmentError) {
        throw new Error(`Failed to assign teacher: ${teacherAssignmentError.message}`);
      }

      onSuccess();
    } catch (error) {
      console.error('❌ [AssignClassForm] Assignment error:', error);
      setErrorMsg(error.message || 'Failed to assign subject.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearDependentFields(field);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [clearDependentFields, validationErrors]);

  // Get subject display name
  const getSubjectDisplayName = useCallback((offering) => {
    if (!offering?.subjects) return 'Unknown Subject';
    const subject = offering.subjects;
    return subject.name || 'Unknown Subject';
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Class/Subject
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Program Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program *
              </label>
              <div className="relative">
                <select
                  value={formData.programId}
                  onChange={(e) => handleFieldChange('programId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.programId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!!loadingStates.programs}
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.program_id} value={program.program_id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {loadingStates.programs && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {validationErrors.programId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.programId}
                </p>
              )}
            </div>

            {/* Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <div className="relative">
                <select
                  value={formData.levelId}
                  onChange={(e) => handleFieldChange('levelId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.levelId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!formData.programId || loadingStates.levels}
                >
                  <option value="">
                    {!formData.programId ? 'Select a program first' : 'Select a level'}
                  </option>
                  {levels.map((level) => (
                    <option key={level.level_id} value={level.level_id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                {loadingStates.levels && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {validationErrors.levelId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.levelId}
                </p>
              )}
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <div className="relative">
                <select
                  value={formData.subjectOfferingId}
                  onChange={(e) => handleFieldChange('subjectOfferingId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.subjectOfferingId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!formData.levelId || loadingStates.subjects}
                >
                  <option value="">
                    {!formData.levelId ? 'Select a level first' : 'Select a subject'}
                  </option>
                  {subjectOfferings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {getSubjectDisplayName(offering)}
                      {offering.is_compulsory ? ' (Compulsory)' : ''}
                    </option>
                  ))}
                </select>
                {loadingStates.subjects && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {validationErrors.subjectOfferingId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.subjectOfferingId}
                </p>
              )}
            </div>

            {/* Paper Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paper *
              </label>
              <div className="relative">
                <select
                  value={formData.paperId}
                  onChange={(e) => handleFieldChange('paperId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.paperId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!formData.subjectOfferingId || loadingStates.papers}
                >
                  <option value="">
                    {!formData.subjectOfferingId ? 'Select a subject first' : 'Select a paper'}
                  </option>
                  {papers.map((paper) => (
                    <option key={paper.paper_id} value={paper.paper_id}>
                      {paper.paper_code} - {paper.paper_name}
                    </option>
                  ))}
                </select>
                {loadingStates.papers && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {validationErrors.paperId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.paperId}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                placeholder="e.g., 2024-2025"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.academicYear ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.academicYear && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.academicYear}
                </p>
              )}
            </div>

            {/* Class Tutor Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="classTutor"
                checked={isClassTutor}
                onChange={(e) => setIsClassTutor(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="classTutor" className="ml-2 block text-sm text-gray-700">
                Assign as Class Tutor (Class Teacher)
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={!!loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Assign Subject
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={!!loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}