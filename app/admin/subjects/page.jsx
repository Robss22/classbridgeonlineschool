'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { normalizeForInsert as normalizeInsertStrict } from '@/utils/normalizeForInsert';
import { normalizeForInsert as normalizeInsertLoose } from '@/utils/db';

// Reusable Dropdown menu for actions
function ActionsDropdown({ onEdit, onDelete, onManageOfferings, onAddOffering }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside (use 'click' instead of 'mousedown' so the menu
  // doesn't disappear the moment you press on the scrollbar to start scrolling)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Actions ▼
      </button>
      {open && (
        <div
            className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10 py-1 max-h-60 overflow-y-auto"
          role="menu"
        >
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
          >
            Edit Subject
          </button>
                     <button
             onClick={() => { onAddOffering(); setOpen(false); }}
             className="block w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50"
             role="menuitem"
           >
             Add New Offering
          </button>
          <button
            onClick={() => { onManageOfferings(); setOpen(false); }}
            className="block w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
            role="menuitem"
          >
            Manage Offerings
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-100"
            role="menuitem"
          >
            Delete Subject
          </button>
        </div>
      )}
    </div>
  );
}

// Custom Delete Confirmation Modal (reused from LevelsPage)
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

// Form for Adding/Editing a Subject Offering
function SubjectOfferingForm({ offeringItem, subjectId, subjectName, programs, levels, onClose, onSave }) {
  const [programId, setProgramId] = useState(offeringItem?.program_id || '');
  const [levelId, setLevelId] = useState(offeringItem?.level_id || '');
  const [isCompulsory, setIsCompulsory] = useState(offeringItem?.is_compulsory || false);
  const [term, setTerm] = useState(offeringItem?.term || 'Annual');
  const [year, setYear] = useState(offeringItem?.year || '2025/2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!programId || !levelId) {
      setError('Program and Level are required for an offering.');
      setLoading(false);
      return;
    }

    // Check for existing offering with same subject, program, and level
    if (!offeringItem) {
      const { data: existingOfferings, error: checkError } = await supabase
        .from('subject_offerings')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('program_id', programId)
        .eq('level_id', levelId);

      if (checkError) {
        console.error('Error checking existing offerings:', checkError);
        setError('Failed to check existing offerings: ' + checkError.message);
        setLoading(false);
        return;
      }

      if (existingOfferings && existingOfferings.length > 0) {
        setError('An offering for this subject, program, and level combination already exists.');
        setLoading(false);
        return;
      }
    }

    const dataToSave = {
      subject_id: subjectId,
      program_id: programId,
      level_id: levelId,
      is_compulsory: isCompulsory,
      term: term.trim() || null,
      year: year.trim() || null,
    };

    try {
      if (offeringItem) {
        // Edit existing offering
        const { error: updateError } = await supabase
          .from('subject_offerings')
          .update(normalizeInsertLoose(dataToSave))
          .eq('id', offeringItem.id);
        if (updateError) throw updateError;
      } else {
        // Add new offering
        const { error: insertError } = await supabase
          .from('subject_offerings')
          .insert([normalizeInsertLoose(dataToSave)]);
        if (insertError) throw insertError;
      }
      onSave();
    } catch (err) {
      console.error('Error saving offering:', err);
      setError('Failed to save offering: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl">&times;</button>
                 <h2 className="text-2xl font-bold mb-4">{offeringItem ? 'Edit Offering' : 'Add New Offering'} for "{subjectName}"</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.program_id} value={p.program_id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">Select Level</option>
              {levels.map((l) => (
                <option key={l.level_id} value={l.level_id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCompulsory"
              checked={isCompulsory}
              onChange={(e) => setIsCompulsory(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isCompulsory" className="text-sm font-medium text-gray-700">Compulsory</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (Optional)</label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year (Optional)</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              disabled={!!loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={!!loading}
            >
              {loading ? 'Saving...' : 'Save Offering'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for Adding a New Subject Offering
function AddOfferingModal({ subject, onClose, onSave }) {
  const [programs, setPrograms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProgramsAndLevels = useCallback(async () => {
    try {
      const { data: programsData, error: programsError } = await supabase.from('programs').select('program_id, name');
      const { data: levelsData, error: levelsError } = await supabase.from('levels').select('level_id, name');

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        setError('Error fetching programs: ' + JSON.stringify(programsError));
        return;
      }
      if (levelsError) {
        console.error('Error fetching levels:', levelsError);
        setError('Error fetching levels: ' + JSON.stringify(levelsError));
        return;
      }

      setPrograms(programsData);
      setLevels(levelsData);
    } catch (err) {
      console.error('Error fetching programs/levels:', err);
      setError('Error fetching programs/levels: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgramsAndLevels();
  }, [fetchProgramsAndLevels]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4">Add New Offering for "{subject.name}"</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : (
                     <SubjectOfferingForm
             subjectId={subject.subject_id}
             subjectName={subject.name}
             programs={programs}
             levels={levels}
             onClose={onClose}
             onSave={onSave}
           />
        )}
      </div>
    </div>
  );
}

// Modal for Managing Subject Offerings
function ManageOfferingsModal({ subject, onClose, onSave }) {
  const [offerings, setOfferings] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [errorOfferings, setErrorOfferings] = useState('');
  const [editingOffering, setEditingOffering] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [offeringToDelete, setOfferingToDelete] = useState(null);

  const fetchOfferings = useCallback(async () => {
    setLoadingOfferings(true);
    setErrorOfferings('');
    try {
      // Check if subject.id exists
      if (!subject?.subject_id) {
        setErrorOfferings('Subject ID is missing');
        setOfferings([]);
        return;
      }

      const { data, error } = await supabase
        .from('subject_offerings')
        .select(`
          id, is_compulsory, term, year,
          programs(program_id, name),
          levels(level_id, name)
        `)
        .eq('subject_id', subject.subject_id);

      if (error) {
        console.error('Error fetching offerings:', error);
        setErrorOfferings('Failed to load offerings: ' + JSON.stringify(error));
        setOfferings([]);
        return;
      }
      if (!data || !Array.isArray(data)) {
        setErrorOfferings('No data returned from Supabase.');
        setOfferings([]);
        return;
      }
      setOfferings(data);
    } catch (err) {
      console.error('Error fetching offerings:', err);
      setErrorOfferings('Failed to load offerings: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setLoadingOfferings(false);
    }
  }, [subject?.subject_id]);

  const fetchProgramsAndLevels = useCallback(async () => {
    try {
      const { data: programsData, error: programsError } = await supabase.from('programs').select('program_id, name');
      const { data: levelsData, error: levelsError } = await supabase.from('levels').select('level_id, name');

      if (programsError) {
        console.error('Error fetching programs:', programsError);
        setPrograms([]);
        setLevels([]);
        alert('Error fetching programs: ' + JSON.stringify(programsError));
        return;
      }
      if (levelsError) {
        console.error('Error fetching levels:', levelsError);
        setPrograms([]);
        setLevels([]);
        alert('Error fetching levels: ' + JSON.stringify(levelsError));
        return;
      }

      setPrograms(programsData);
      setLevels(levelsData);
    } catch (err) {
      console.error('Error fetching programs/levels:', err);
      alert('Error fetching programs/levels: ' + (err?.message || JSON.stringify(err)));
      setPrograms([]);
      setLevels([]);
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
    fetchProgramsAndLevels();
  }, [fetchOfferings, fetchProgramsAndLevels]);

  const handleOfferingDelete = async () => {
    if (!offeringToDelete) return;
    try {
      const { error } = await supabase.from('subject_offerings').delete().eq('id', offeringToDelete.id);
      if (error) throw error;
      fetchOfferings(); // Refresh offerings list
      onSave(); // Notify parent to potentially refresh subject list if needed
    } catch (err) {
      console.error('Error deleting offering:', err);
      alert('Failed to delete offering: ' + err.message); // Consider custom toast
    } finally {
      setShowDeleteConfirm(false);
      setOfferingToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4">Manage Offerings for "{subject.name}"</h2>

        {loadingOfferings ? (
          <p className="text-center text-gray-500 py-4">Loading offerings...</p>
        ) : errorOfferings ? (
          <p className="text-red-500 text-center py-4">{errorOfferings}</p>
        ) : offerings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No offerings found for this subject.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Compulsory</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Term</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Year</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {offerings.map(off => (
                  <tr key={off.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{off.programs?.name || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{off.levels?.name || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{off.is_compulsory ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{off.term || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{off.year || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setEditingOffering(off)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-semibold mr-2"
                      >Edit</button>
                      <button
                        onClick={() => {setOfferingToDelete(off); setShowDeleteConfirm(true);}}
                        className="text-red-600 hover:text-red-900 text-xs font-semibold"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingOffering && (
          <SubjectOfferingForm
            offeringItem={editingOffering}
             subjectId={subject.subject_id}
             subjectName={subject.name}
            programs={programs}
            levels={levels}
            onClose={() => setEditingOffering(null)}
            onSave={() => {
              setEditingOffering(null);
              fetchOfferings(); // Refresh list after edit
              onSave(); // Notify parent
            }}
          />
        )}

        <DeleteConfirmModal
          show={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleOfferingDelete}
          itemName={`offering for ${offeringToDelete?.programs?.name || 'N/A'} - ${offeringToDelete?.levels?.name || 'N/A'}`}
        />
      </div>
    </div>
  );
}

// Form for Adding/Editing a Subject
function SubjectForm({ subjectItem, onClose, onSave }) {
  const [name, setName] = useState(subjectItem?.name || '');
  const [description, setDescription] = useState(subjectItem?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Subject name is required.');
      setLoading(false);
      return;
    }

    const dataToSave = {
      name: name.trim(),
      description: description.trim() || null,
    };

    try {
      if (subjectItem) {
        // Edit existing subject
        const { error: updateError } = await supabase
          .from('subjects')
          .update(normalizeInsertLoose(dataToSave))
          .eq('subject_id', subjectItem.subject_id);
        if (updateError) throw updateError;
      } else {
        // Add new subject
        const { error: insertError } = await supabase
          .from('subjects')
          .insert([normalizeInsertLoose(dataToSave)]);
        if (insertError) throw insertError;
      }
      onSave();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError('Failed to save subject: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4">{subjectItem ? 'Edit Subject' : 'Add New Subject'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              disabled={!!loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              disabled={!!loading}
            >
              {loading ? 'Saving...' : 'Save Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




// Main Subjects Page Component
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [managingOfferingsForSubject, setManagingOfferingsForSubject] = useState(null);
  const [addingOfferingForSubject, setAddingOfferingForSubject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [search, setSearch] = useState('');

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('subject_id, name, description')
        .order('name');
      
      if (error) throw error;
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('subject_id', subjectToDelete.subject_id);
      if (error) throw error;
      fetchSubjects(); // Refresh subjects list
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert('Failed to delete subject: ' + err.message); // Consider custom toast
    } finally {
      setShowDeleteConfirm(false);
      setSubjectToDelete(null);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(search.toLowerCase()) ||
    subject.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Subjects</h1>

      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md flex-grow min-w-[200px]"
        />
        <button
          onClick={() => setShowAddSubjectForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold shadow-md transition duration-200 ease-in-out flex-shrink-0"
        >
          + Add New Subject
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-500">Loading subjects...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : filteredSubjects.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No subjects found.</p>
      ) : (
        Object.entries(
          filteredSubjects.reduce((acc, subj) => {
            // No category field, group all under 'All Subjects'
            const cat = 'All Subjects';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(subj);
            return acc;
          }, {})
        ).map(([category, subjects]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-700">{category}</h2>
            <div className="overflow-x-auto rounded-xl shadow border border-gray-100 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {subjects.map(subject => (
                    <tr key={subject.subject_id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={subject.description}>{subject.description || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <ActionsDropdown
                          onEdit={() => setEditingSubject(subject)}
                          onDelete={() => {setSubjectToDelete(subject); setShowDeleteConfirm(true);}}
                          onManageOfferings={() => setManagingOfferingsForSubject(subject)}
                            onAddOffering={() => setAddingOfferingForSubject(subject)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showAddSubjectForm && (
        <SubjectForm onClose={() => setShowAddSubjectForm(false)} onSave={() => { setShowAddSubjectForm(false); fetchSubjects(); }} />
      )}

      {editingSubject && (
        <SubjectForm subjectItem={editingSubject} onClose={() => setEditingSubject(null)} onSave={() => { setEditingSubject(null); fetchSubjects(); }} />
      )}

      {managingOfferingsForSubject && (
        <ManageOfferingsModal
          subject={managingOfferingsForSubject}
          onClose={() => setManagingOfferingsForSubject(null)}
          onSave={() => { /* Optionally refresh main subjects list if offerings affect subject display */ }}
        />
      )}

        {addingOfferingForSubject && (
          <AddOfferingModal
            subject={addingOfferingForSubject}
            onClose={() => setAddingOfferingForSubject(null)}
            onSave={() => { setAddingOfferingForSubject(null); }}
          />
        )}

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSubject}
        itemName={subjectToDelete?.name || ''}
      />
    </div>
  );
}
