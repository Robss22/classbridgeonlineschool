'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AssessmentService } from '@/lib/services/assessmentService';
import { Assessment, AssessmentFilters } from '@/types/assessments';
import AssessmentTable from '@/components/assessments/AssessmentTable';
import AssessmentFiltersComponent from '@/components/assessments/AssessmentFilters';
import TeacherAssessmentForm from '@/components/TeacherAssessmentForm';
import DeleteConfirmModal from '@/components/assessments/DeleteConfirmModal';

export default function TeacherAssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [filters, setFilters] = useState<AssessmentFilters>({});
  const [formOptions, setFormOptions] = useState<{
    subjects: Array<{ subject_id: string; name: string }>;
    levels: Array<{ level_id: string; name: string }>;
    programs: Array<{ program_id: string; name: string }>;
  }>({
    subjects: [],
    levels: [],
    programs: []
  });

  // Fetch teacher's assessments
  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AssessmentService.fetchAssessments(filters, 'teacher', user?.id);
      setAssessments(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load assessments: ' + errorMessage);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  // Fetch form options
  const fetchFormOptions = useCallback(async () => {
    try {
      const options = await AssessmentService.fetchFormOptions();
      setFormOptions(options);
    } catch (err) {
      console.error('Failed to fetch form options:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    if (user) {
      fetchAssessments();
      fetchFormOptions();
    }
  }, [user, fetchAssessments, fetchFormOptions]);

  // Handle assessment creation
  const handleAssessmentCreated = useCallback(() => {
    setShowCreateForm(false);
    fetchAssessments();
  }, [fetchAssessments]);

  // Handle assessment editing
  const handleAssessmentEdited = useCallback(() => {
    setEditingAssessment(null);
    fetchAssessments();
  }, [fetchAssessments]);

  // Handle assessment deletion
  const handleDeleteAssessment = useCallback(async (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setShowDeleteConfirm(true);
  }, []);

  // Confirm deletion
  const confirmDelete = useCallback(async () => {
    if (!assessmentToDelete) return;

    try {
      await AssessmentService.deleteAssessment(assessmentToDelete.id);
      setShowDeleteConfirm(false);
      setAssessmentToDelete(null);
      fetchAssessments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to delete assessment: ' + errorMessage);
    }
  }, [assessmentToDelete, fetchAssessments]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: AssessmentFilters) => {
    setFilters(newFilters);
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Access control
  if (!user || user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a teacher to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
              <p className="mt-2 text-gray-600">
                Create and manage assessments for your assigned programs and classes
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Create Assessment
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <AssessmentFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          subjects={formOptions.subjects}
          levels={formOptions.levels}
          programs={formOptions.programs}
          showAdvancedFilters={false}
        />

        {/* Assessments Table */}
        <div className="bg-white rounded-lg shadow">
          <AssessmentTable
            assessments={assessments}
            loading={loading}
            onEdit={setEditingAssessment}
            onDelete={handleDeleteAssessment}
            showActions={true}
            userRole="teacher"
          />
        </div>

        {/* Create/Edit Form Modal */}
        {(showCreateForm || editingAssessment) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingAssessment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <TeacherAssessmentForm
                  onClose={() => {
                    setShowCreateForm(false);
                    setEditingAssessment(null);
                  }}
                  onSave={editingAssessment ? handleAssessmentEdited : handleAssessmentCreated}
                  assessmentItem={editingAssessment}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          show={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setAssessmentToDelete(null);
          }}
          onConfirm={confirmDelete}
          itemName={assessmentToDelete?.title || ''}
        />
      </div>
    </div>
  );
}

