'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AssessmentService } from '@/lib/services/assessmentService';
import { Assessment } from '@/types/assessments';
import AssessmentTable from '@/components/assessments/AssessmentTable';

export default function StudentAssessmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments assigned to this student
  const fetchStudentAssessments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await AssessmentService.fetchStudentAssessments(user.id);
      setAssessments(data);
    } catch (err: any) {
      setError('Failed to load assessments: ' + err.message);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchStudentAssessments();
    }
  }, [user, fetchStudentAssessments]);

  // Handle view assessment
  const handleViewAssessment = useCallback((assessment: Assessment) => {
    // TODO: Implement assessment viewing/submission functionality
    console.log('View assessment:', assessment.id);
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
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be logged in as a student to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
          <p className="mt-2 text-gray-600">View and complete your assigned assessments</p>
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

        {/* Assessments Table */}
        <div className="bg-white rounded-lg shadow">
          <AssessmentTable
            assessments={assessments}
            loading={loading}
            onView={handleViewAssessment}
            showActions={true}
            userRole="student"
          />
        </div>
      </div>
    </div>
  );
}

