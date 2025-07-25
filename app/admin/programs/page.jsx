'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProgramsPage() {
  // Initialize loading to true so both server and client render 'Loading...' initially
  const [programs, setPrograms] = useState([]);
  const [newProgramName, setNewProgramName] = useState('');
  const [loading, setLoading] = useState(true); // <--- CHANGE: Initialized to true
  const [errorMessage, setErrorMessage] = useState(''); // For displaying errors to the user
  const [successMessage, setSuccessMessage] = useState(''); // For displaying success messages

  useEffect(() => {
    // No need to set setLoading(true) here as it's already true initially
    fetchPrograms();
  }, []);

  async function fetchPrograms() {
    setErrorMessage(''); // Clear previous error messages
    setSuccessMessage(''); // Clear previous success messages
    // setLoading(true); // <--- REMOVED: Redundant as loading is true by default
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      // Note: orderBy() can cause issues if indexes are not configured.
      // If you encounter errors, fetch all data and sort client-side.
      .order('name');

    if (error) {
      console.error('Error fetching programs:', error.message || error);
      setErrorMessage(`Failed to fetch programs: ${error.message || 'Unknown error'}`);
      setPrograms([]); // Clear programs on error
    } else {
      setPrograms(data);
    }
    setLoading(false); // Set loading to false once data is fetched or error occurs
  }

  async function handleAddProgram(e) {
    e.preventDefault();
    setErrorMessage(''); // Clear previous error messages
    setSuccessMessage(''); // Clear previous success messages
    if (!newProgramName.trim()) {
      setErrorMessage('Program name cannot be empty.');
      return;
    }

    setLoading(true); // Show loading indicator while adding
    const { error } = await supabase
      .from('programs')
      .insert([{ name: newProgramName.trim() }]);

    if (error) {
      console.error('Error adding program:', error.message);
      setErrorMessage('Error adding program: ' + error.message);
    } else {
      setNewProgramName('');
      setSuccessMessage('Program added successfully!');
      await fetchPrograms(); // Re-fetch programs to update the list
    }
    setLoading(false); // Hide loading indicator
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Programs</h1>

      {/* Program Add Form */}
      <form onSubmit={handleAddProgram} className="mb-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input
          type="text"
          value={newProgramName}
          onChange={(e) => setNewProgramName(e.target.value)}
          placeholder="New Program Name"
          className="border border-gray-300 px-4 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 flex-grow"
          aria-label="New Program Name"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
          disabled={loading} // Disable button while loading
        >
          {loading ? 'Adding...' : 'Add Program'}
        </button>
      </form>

      {/* Messages (Error/Success) */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Conditional Rendering for Programs List */}
      {loading ? (
        <p className="text-center py-8 text-gray-600">Loading programs...</p>
      ) : programs.length === 0 ? (
        <p className="text-center py-8 text-gray-600">No programs yet. Add one above!</p>
      ) : (
        <ul className="space-y-3">
          {programs.map((program) => (
            <li key={program.program_id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center transform transition-transform hover:scale-[1.01]">
              <span className="text-gray-800 font-medium text-lg">{program.name}</span>
              {/* Add actions here like edit/delete if needed */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
