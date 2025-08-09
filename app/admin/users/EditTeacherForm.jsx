'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export default function TeacherForm({ teacher, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    bio: '',
    program_id: '',
  });

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch programs from Supabase
  useEffect(() => {
    async function fetchPrograms() {
      const { data, error } = await supabase.from('programs').select('program_id, name');
      if (!error) setPrograms(data || []);
    }
    fetchPrograms();
  }, []);

  // Pre-fill the form if editing
  useEffect(() => {
    if (teacher) {
      setForm({
        full_name: teacher.users_extended?.full_name || '',
        email: teacher.users_extended?.email || '',
        password: '',
        bio: teacher.bio || '',
        program_id: teacher.program_id || '',
      });
    }
  }, [teacher]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (teacher) {
        const updates = {
          full_name: form.full_name,
          email: form.email,
        };

        if (form.password.trim()) {
          updates.password_hash = bcrypt.hashSync(form.password, 10);
        }

        // Update users_extended
        const { error: userError } = await supabase
          .from('users_extended')
          .update(normalizeForInsert(updates))
          .eq('user_id', teacher.user_id);
        if (userError) throw userError;

        // Update teacher table with bio and program_id
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({
            bio: form.bio,
            program_id: form.program_id,
          })
          .eq('teacher_id', teacher.teacher_id);
        if (teacherError) throw teacherError;

      } else {
        throw new Error('Add teacher flow not supported here');
      }

      onSuccess?.();
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        type="text"
        name="full_name"
        placeholder="Full Name"
        value={form.full_name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="New Password (leave blank to keep current)"
        value={form.password}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

            <select
        name="program_id"
        value={form.program_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Program</option>
        {programs.map((program) => (
          <option key={program.program_id} value={program.program_id}>
            {program.name}
          </option>
        ))}
      </select>



      <textarea
        name="bio"
        placeholder="Short Bio"
        value={form.bio}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        rows={3}
      />



      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={!!loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Saving...' : 'Save Changes'}
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
