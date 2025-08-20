import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LiveClassFormProps {
  level_id: string;
  program_id: string;
  subject_id: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LiveClassForm({ level_id, program_id, subject_id, onClose, onSuccess }: LiveClassFormProps) {
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
    program_id: program_id || '',
    level_id: level_id || '',
    subject_id: subject_id || '',
    paper_id: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  type ProgramRow = { program_id: string; name?: string | null };
  type LevelRow = { level_id: string; name?: string | null };
  type SubjectRow = { subject_id: string; name?: string | null };
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levelsRes, subjectsRes, programsRes] = await Promise.all([
          supabase.from('levels').select('*'),
          supabase.from('subjects').select('*'),
          supabase.from('programs').select('*')
        ]);

        if (levelsRes.error) throw new Error('Error fetching levels: ' + levelsRes.error.message);
        if (subjectsRes.error) throw new Error('Error fetching subjects: ' + subjectsRes.error.message);
        if (programsRes.error) throw new Error('Error fetching programs: ' + programsRes.error.message);

        setLevels((levelsRes.data || []) as unknown as LevelRow[]);
        setSubjects((subjectsRes.data || []) as unknown as SubjectRow[]);
        setPrograms((programsRes.data || []) as unknown as ProgramRow[]);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create live class');
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <input
        type="date"
        value={formData.scheduled_date}
        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
        required
      />

      <input
        type="time"
        value={formData.start_time}
        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
        required
      />

      <input
        type="time"
        value={formData.end_time}
        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
        required
      />

      <select
        value={formData.program_id}
        onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
        required
      >
        <option value="">Select Program</option>
        {programs.map((program) => (
          <option key={program.program_id} value={program.program_id}>
            {program.name}
          </option>
        ))}
      </select>

      <select
        value={formData.level_id}
        onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
        required
      >
        <option value="">Select Level</option>
        {levels.map((level) => (
          <option key={level.level_id} value={level.level_id}>
            {level.name}
          </option>
        ))}
      </select>

      <select
        value={formData.subject_id}
        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
        required
      >
        <option value="">Select Subject</option>
        {subjects.map((subject) => (
          <option key={subject.subject_id} value={subject.subject_id}>
            {subject.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Live Class'}
      </button>
    </form>
  );
}
