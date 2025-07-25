'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AssignClassForm({ teacher, onSuccess, onCancel }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchClasses() {
      let query = supabase.from('classes').select('class_id, name, program_id');

      if (teacher.program_id) {
        query = query.eq('program_id', teacher.program_id);
      }

      const { data, error } = await query;

      if (!error) {
        setClasses(data);
      } else {
        setErrorMsg('Failed to load classes.');
      }
    }

    fetchClasses();
  }, [teacher.program_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('teacher_assignments').insert([
        {
          teacher_id: teacher.teacher_id,
          class_id: selectedClassId,
        },
      ]);

      if (error) throw error;

      onSuccess?.();
    } catch (error) {
      setErrorMsg(error.message || 'Failed to assign class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-lg font-semibold">Assign Class to {teacher.users_extended?.full_name}</h2>

      <select
        value={selectedClassId}
        onChange={(e) => setSelectedClassId(e.target.value)}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Class</option>
        {classes.map((cls) => (
          <option key={cls.class_id} value={cls.class_id}>
            {cls.name}
          </option>
        ))}
      </select>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Assigning...' : 'Assign Class'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
