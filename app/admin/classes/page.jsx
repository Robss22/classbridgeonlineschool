'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Dropdown menu for actions
function ActionsDropdown({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 border rounded hover:bg-gray-100"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Actions ▼
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-md z-10"
          role="menu"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left hover:bg-gray-200"
            role="menuitem"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100"
            role="menuitem"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Custom Delete Confirmation Modal
function DeleteConfirmModal({ show, onClose, onConfirm, itemName }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
        <p className="mb-6">Are you sure you want to delete "<span className="font-semibold">{itemName}</span>"? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Modal for Levels
function EditLevelModal({ levelItem, programs, onClose, onSave }) {
  const [name, setName] = useState(levelItem.name);
  const [programId, setProgramId] = useState(levelItem.program_id || ''); 
  const [description, setDescription] = useState(levelItem.description || '');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !programId) {
      alert('Level name and Program are required.'); 
      return;
    }

    const { error } = await supabase
      .from('levels')
      .update({ name: name.trim(), program_id: programId, description: description.trim() })
      .eq('level_id', levelItem.level_id); 

    if (error) {
      alert('Update failed: ' + error.message); 
    } else {
      onSave(); 
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Level</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Level Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-3 py-2 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 rounded w-full"
              rows={2}
            />
          </div>
          <div>
            <label className="block mb-1">Program</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="border px-3 py-2 rounded w-full"
              required
            >
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.program_id} value={p.program_id}> 
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LevelsPage() { 
  const [levels, setLevels] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newLevelName, setNewLevelName] = useState(''); 
  const [newLevelDescription, setNewLevelDescription] = useState(''); 
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [programs, setPrograms] = useState([]); 
  const [editingLevel, setEditingLevel] = useState(null); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState(null);
  // New state to manage collapsed programs
  const [collapsedPrograms, setCollapsedPrograms] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch levels and join with programs to get program names
      const { data: levelData, error: levelError } = await supabase
        .from('levels')
        .select('level_id, name, description, program_id, programs(name)') 
        .order('name');

      // Fetch all programs separately for the dropdowns and grouping
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('program_id, name'); 

      if (levelError || programError) {
        console.error('Supabase Error fetching data:', JSON.stringify(levelError || programError, null, 2)); 
        throw levelError || programError; 
      }

      setLevels(levelData);
      setPrograms(programData);
      // Initialize all programs as collapsed
      setCollapsedPrograms(new Set(programData.map(p => p.program_id)));
    } catch (err) {
      console.error('Caught error in fetchData:', err); 
      setError('Failed to load levels or programs. Please check your browser console for details and ensure your database schema and data are correctly set up (especially foreign keys and RLS).');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLevel(e) { 
    e.preventDefault();
    if (!newLevelName.trim() || !selectedProgramId) {
      alert('Please enter a level name and select a program.'); 
      return;
    }

    const { error } = await supabase.from('levels').insert([
      { name: newLevelName.trim(), description: newLevelDescription.trim(), program_id: selectedProgramId }
    ]);
    if (error) {
      alert('Error adding level: ' + error.message); 
    } else {
      setNewLevelName('');
      setNewLevelDescription('');
      setSelectedProgramId('');
      fetchData(); 
    }
  }

  async function handleDeleteConfirm() {
    if (!levelToDelete) return;
    try {
      const { error } = await supabase.from('levels').delete().eq('level_id', levelToDelete.level_id); 
      if (error) {
        alert('Delete error: ' + error.message); 
      } else {
        fetchData(); 
      }
    } catch (err) {
      console.error('Unexpected error during delete:', err);
      alert('An unexpected error occurred during deletion.');
    } finally {
      setShowDeleteConfirm(false);
      setLevelToDelete(null);
    }
  }

  // Function to toggle collapse state of a program
  const toggleProgramCollapse = (programId) => {
    setCollapsedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Levels</h1> 

      {/* Add Level Form */}
      <form onSubmit={handleAddLevel} className="mb-8 p-4 bg-blue-50 rounded-lg shadow-sm flex flex-wrap gap-3 items-center">
        <input
          value={newLevelName}
          onChange={(e) => setNewLevelName(e.target.value)}
          placeholder="Level name (e.g., S1, Level 100)"
          className="border border-blue-200 px-3 py-2 rounded-md flex-grow min-w-[180px]"
          required
        />
        <input
          value={newLevelDescription}
          onChange={(e) => setNewLevelDescription(e.target.value)}
          placeholder="Description (Optional)"
          className="border border-blue-200 px-3 py-2 rounded-md flex-grow min-w-[180px]"
        />
        <select
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          className="border border-blue-200 px-3 py-2 rounded-md"
          required
        >
          <option value="">Select Program</option>
          {programs.map((p) => (
            <option key={p.program_id} value={p.program_id}> 
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold shadow-md transition duration-200 ease-in-out flex-shrink-0"
        >
          Add Level
        </button>
      </form>

      {/* Grouped Display */}
      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading levels...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : (
        // Iterate over the programs fetched from the database to create categories
        programs.map((program) => {
          // Filter levels that belong to the current program
          const groupLevels = levels.filter(
            (level) => level.program_id === program.program_id 
          );

          // Only render a category if there are levels in it
          if (groupLevels.length === 0) return null;

          const isCollapsed = collapsedPrograms.has(program.program_id);

          return (
            <div key={program.program_id} className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-100">
              <h2 
                className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 cursor-pointer flex justify-between items-center"
                onClick={() => toggleProgramCollapse(program.program_id)}
              >
                {program.name} Levels 
                <span className="text-gray-500 text-lg">
                  {isCollapsed ? '▼' : '▲'}
                </span>
              </h2> 
              {!isCollapsed && ( // Conditionally render table based on collapse state
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level Name</th> 
                        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th> 
                        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Program</th>
                        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {groupLevels.map((level) => (
                        <tr key={level.level_id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                          <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{level.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate" title={level.description}>{level.description || 'N/A'}</td> 
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{level.programs?.name || 'N/A'}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">
                            <ActionsDropdown
                              onEdit={() => setEditingLevel(level)} 
                              onDelete={() => {setLevelToDelete(level); setShowDeleteConfirm(true);}} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edit Modal */}
      {editingLevel && ( 
        <EditLevelModal 
          levelItem={editingLevel} 
          programs={programs}
          onClose={() => setEditingLevel(null)}
          onSave={() => {
            setEditingLevel(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemName={levelToDelete?.name || ''}
      />
    </div>
  );
}
