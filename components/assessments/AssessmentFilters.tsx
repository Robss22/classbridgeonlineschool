'use client';

import React from 'react';
import type { AssessmentFilters } from '@/types/assessments';
import { ASSESSMENT_TYPES } from '@/types/assessments';

interface AssessmentFiltersProps {
  filters: AssessmentFilters;
  onFiltersChange: (filters: AssessmentFilters) => void;
  subjects?: Array<{ subject_id: string; name: string }>;
  levels?: Array<{ level_id: string; name: string }>;
  programs?: Array<{ program_id: string; name: string }>;
  showAdvancedFilters?: boolean;
}

export default function AssessmentFilters({
  filters,
  onFiltersChange,
  subjects = [],
  levels = [],
  programs = [],
  showAdvancedFilters = false
}: AssessmentFiltersProps) {
  const handleFilterChange = (key: keyof AssessmentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search assessments..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {ASSESSMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        {showAdvancedFilters && subjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={filters.subject_id || ''}
              onChange={(e) => handleFilterChange('subject_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Level Filter */}
        {showAdvancedFilters && levels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={filters.level_id || ''}
              onChange={(e) => handleFilterChange('level_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level.level_id} value={level.level_id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Program Filter */}
        {showAdvancedFilters && programs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <select
              value={filters.program_id || ''}
              onChange={(e) => handleFilterChange('program_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program.program_id} value={program.program_id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {(filters.search || filters.type || filters.subject_id || filters.level_id || filters.program_id) && (
        <div className="mt-4">
          <button
            onClick={() => onFiltersChange({})}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
