"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AdminLiveClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
  programs: any[];
  levels: any[];
  subjects: any[];
  teachers: any[];
  papers: any[];
}

export default function AdminLiveClassModal({
  onClose,
  onSuccess,
  programs,
  levels,
  subjects,
  teachers,
  papers,
}: AdminLiveClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedPapers, setFetchedPapers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
    meeting_platform: 'Zoom',
    max_participants: 50,
    teacher_id: '',
    program_id: '',
    level_id: '',
    subject_id: '',
    paper_id: '',
    status: 'scheduled',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create live class');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Try to fetch papers on-demand for selected subject if none were passed in props
  useEffect(() => {
    const loadPapersIfMissing = async () => {
      if (!formData.subject_id) return;
      const hasLocal = papers.some((p: any) => String(p.subject_id) === String(formData.subject_id));
      const hasFetched = fetchedPapers.some(
        (p: any) => String(p.subject_id) === String(formData.subject_id)
      );
      if (hasLocal || hasFetched) return;
      try {
        const { data, error } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_name, paper_code, subject_id')
          .eq('subject_id', formData.subject_id);
        if (error) throw error;
        setFetchedPapers((prev) => [...prev, ...(data || [])]);
      } catch (err) {
        // non-fatal; keep modal working without papers
      }
    };
    loadPapersIfMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subject_id]);

  const allPapers = useMemo(() => [...papers, ...fetchedPapers], [papers, fetchedPapers]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Schedule Live Class</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <select
              value={formData.program_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  program_id: e.target.value,
                  level_id: '',
                  subject_id: '',
                  paper_id: '',
                })
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Program</option>
              {programs.map((p: any) => (
                <option key={p.program_id} value={p.program_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              value={formData.level_id}
              onChange={(e) =>
                setFormData({ ...formData, level_id: e.target.value, subject_id: '', paper_id: '' })
              }
              className="w-full border rounded-lg px-3 py-2"
              required
              disabled={!formData.program_id}
            >
              <option value="">Select Level</option>
              {levels
                .filter((level: any) => level.program_id === formData.program_id)
                .map((level: any) => (
                  <option key={level.level_id} value={level.level_id}>
                    {level.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, paper_id: '' })}
              className="w-full border rounded-lg px-3 py-2"
              required
              disabled={!formData.level_id}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject: any) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Paper (Optional)</label>
            <select
              value={formData.paper_id}
              onChange={(e) => setFormData({ ...formData, paper_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              disabled={!formData.subject_id}
            >
              <option value="">Select Paper</option>
              {allPapers
                .filter((p: any) => String(p.subject_id) === String(formData.subject_id))
                .map((p: any) => (
                  <option key={p.paper_id} value={p.paper_id}>
                    {p.paper_name} ({p.paper_code})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher: any) => (
                <option key={teacher.teacher_id} value={teacher.teacher_id}>
                  {teacher.users?.first_name} {teacher.users?.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Platform</label>
              <select
                value={formData.meeting_platform}
                onChange={(e) => setFormData({ ...formData, meeting_platform: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Zoom">Zoom</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Teams">Teams</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Participants</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) =>
                  setFormData({ ...formData, max_participants: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full border rounded-lg px-3 py-2"
                min={1}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meeting Link</label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Scheduling…' : 'Schedule Class'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


