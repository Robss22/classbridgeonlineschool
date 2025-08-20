'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure this import is present

export default function AddTeacherForm({ onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    program_id: '',
    bio: '',
    role: 'teacher',
    phone: '',
    department: '',
    gender: 'Female',
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');



  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      // Get the current session for the access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('You must be logged in as an admin.');
        setLoading(false);
        return;
      }
      const access_token = session.access_token;

      // Call the admin user registration API with Authorization header
      const response = await fetch('/api/admin/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          first_name: form.full_name.split(' ')[0] || '',
          last_name: form.full_name.split(' ').slice(1).join(' ') || '',
          gender: form.gender,
          role: form.role,
          phone: form.phone,
          department: form.department,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      setSuccessMsg('User created successfully.');
      setForm({
        full_name: '',
        email: '',
        password: '',
        program_id: '',
        bio: '',
        role: 'teacher',
        phone: '',
        department: '',
        gender: 'Female',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setErrorMsg(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded max-h-screen overflow-y-auto pb-8">
      <h2 className="text-xl font-bold mb-4">Add New User (Teacher or Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
        <textarea
          name="bio"
          placeholder="Short Bio"
          value={form.bio}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          rows={3}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!!loading}
        >
          {loading ? 'Creating...' : 'Add'}
        </button>
      </form>
      {successMsg && <p className="text-green-600 mt-3">{successMsg}</p>}
      {errorMsg && <p className="text-red-600 mt-3">{errorMsg}</p>}
    </div>
  );
}
