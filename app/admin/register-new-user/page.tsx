'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminRegisterPage() {
  const [firstname, setFirstname] = useState<string>('');
  const [lastname, setLastname] = useState<string>('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Get current user's session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to register users');
      }

      // Call API route
      const response = await fetch('/api/admin/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstname,
          last_name: lastname,
          gender,
          role,
          phone,
          department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage(`User created successfully with role: ${role}`);
      
      // Reset form
      setFirstname('');
      setLastname('');
      setGender('Female');
      setEmail('');
      setPassword('');
      setRole('student');
      setPhone('');
      setDepartment('');

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Register New User</h1>

        <input
          type="text"
          placeholder="First Name"
          className="w-full p-2 border rounded mb-4"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          className="w-full p-2 border rounded mb-4"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          required
        />

        <select
          className="w-full p-2 border rounded mb-4"
          value={gender}
          onChange={(e) => setGender(e.target.value as 'Female' | 'Male')}
        >
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <select
          className="w-full p-2 border rounded mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'teacher' | 'student')}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="text"
          placeholder="Phone"
          className="w-full p-2 border rounded mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Department"
          className="w-full p-2 border rounded mb-4"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        />

        {message && (
          <div className={`p-3 rounded mb-4 ${
            message.includes('Error') 
              ? 'bg-red-100 border border-red-400 text-red-700' 
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Register User'}
        </button>
      </form>
    </div>
  );
}