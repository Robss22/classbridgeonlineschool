'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AddResourceForm from './AddResourceForm';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(''); 
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  // Removed filterClass as 'resources' table does not directly link to 'classes'
  const [levelsForFilter, setLevelsForFilter] = useState([]);
  const [subjectsForFilter, setSubjectsForFilter] = useState([]);
  // Removed classesForFilter as 'resources' table does not directly link to 'classes'
  const [editResource, setEditResource] = useState(null);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const actionDropdownRef = useRef();
  const [programs, setPrograms] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [resourcesPerPage] = useState(10); // Fixed number of resources per page
  const [totalResources, setTotalResources] = useState(0);

  // Sorting states
  const [sortColumn, setSortColumn] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Delete confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  // Fetch all programs on mount and set initial selectedProgram
  useEffect(() => {
    supabase.from('programs').select('program_id, name').then(({ data }) => {
      setPrograms(data || []);
      if (data && data.length > 0) {
        setSelectedProgram(data[0].program_id);
      }
    });
  }, []);

  // Helper to determine if the selected program is academic
  const currentSelectedProgramIsAcademic = programs.find(
    p => p.program_id === selectedProgram && (p.name?.toLowerCase().includes('uneb') || p.name?.toLowerCase().includes('cambridge'))
  );

  // Fetch all resources with joined data for display, with pagination and sorting
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * resourcesPerPage;
      const to = from + resourcesPerPage - 1;

      let query = supabase
        .from('resources')
        .select(`
          resource_id, title, description, url, type, uploaded_by,
          program_id, level_id, subject_id, paper_id
        `, { count: 'exact' }); // Get exact count for pagination

      // Apply program filter
      if (selectedProgram) {
        query = query.eq('program_id', selectedProgram);
      }

      // Apply level filter
      if (filterLevel) {
        query = query.eq('level_id', filterLevel);
      }

      // Apply subject filter
      if (filterSubject) {
        query = query.eq('subject_id', filterSubject);
      }

      // Apply search filter (client-side for now, could be server-side with FTS)
      // For server-side search, you'd add .ilike('title', `%${search}%`) etc.
      // For now, search is applied after fetching, but pagination should still work.

      // Apply sorting
      if (sortColumn) {
        // Handle sorting for joined tables
        if (sortColumn === 'program_name') {
          query = query.order('name', { foreignTable: 'programs', ascending: sortDirection === 'asc' });
        } else if (sortColumn === 'level_name') {
          query = query.order('name', { foreignTable: 'levels', ascending: sortDirection === 'asc' });
        } else if (sortColumn === 'subject_name') {
          query = query.order('name', { foreignTable: 'subjects', ascending: sortDirection === 'asc' });
        } else if (sortColumn === 'paper_name') {
          query = query.order('paper_name', { foreignTable: 'subject_papers', ascending: sortDirection === 'asc' });
        } else if (sortColumn === 'uploaded_by_name') {
          query = query.order('full_name', { foreignTable: 'users', ascending: sortDirection === 'asc' });
        } else {
          // Default sorting for direct columns on 'resources'
          query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
        }
      }

      query = query.range(from, to); // Apply pagination range

      const { data, error, count } = await query;
      
      if (!error && data) {
        // Fetch related data for each resource
        const enrichedData = await Promise.all(
          data.map(async (resource) => {
            try {
              // Fetch user data - try both users and teachers_with_users tables
              let userData = null;
              
              if (resource.uploaded_by) {
                // First try to get from users table
                let { data: userResult, error: userError } = await supabase
                  .from('users')
                  .select('id, full_name, email, first_name, last_name')
                  .eq('auth_user_id', resource.uploaded_by)
                  .single();
                
                if (userError || !userResult) {
                  // If not found in users, try teachers_with_users
                  const { data: teacherResult, error: teacherError } = await supabase
                    .from('teachers_with_users')
                    .select('user_id, full_name, email, first_name, last_name')
                    .eq('auth_user_id', resource.uploaded_by)
                    .single();
                  
                  if (teacherError) {
                    // Teacher data fetch error - continue with null userData
                  } else if (teacherResult) {
                    userData = teacherResult;
                  }
                } else {
                  userData = userResult;
                }
                
                if (!userData) {
                  // No user data found - continue with null userData
                }
              }

              // Fetch program data
              let programData = null;
              if (resource.program_id) {
                const { data: programResult, error: programError } = await supabase
                  .from('programs')
                  .select('name')
                  .eq('program_id', resource.program_id)
                  .single();
                
                if (programError) {
                  // Program data fetch error - continue with null programData
                } else {
                  programData = programResult;
                }
              }

              // Fetch level data
              let levelData = null;
              if (resource.level_id) {
                const { data: levelResult, error: levelError } = await supabase
                  .from('levels')
                  .select('name')
                  .eq('level_id', resource.level_id)
                  .single();
                
                if (levelError) {
                  // Level data fetch error - continue with null levelData
                } else {
                  levelData = levelResult;
                }
              }

              // Fetch subject data
              let subjectData = null;
              if (resource.subject_id) {
                const { data: subjectResult, error: subjectError } = await supabase
                  .from('subjects')
                  .select('name')
                  .eq('subject_id', resource.subject_id)
                  .single();
                
                if (subjectError) {
                  // Subject data fetch error - continue with null subjectData
                } else {
                  subjectData = subjectResult;
                }
              } else {
                // No subject_id for resource
              }

              // Fetch paper data
              let paperData = null;
              if (resource.paper_id) {
                const { data: paperResult, error: paperError } = await supabase
                  .from('subject_papers')
                  .select('paper_code, paper_name')
                  .eq('paper_id', resource.paper_id)
                  .single();
                
                if (paperError) {
                  // Paper data fetch error - continue with null paperData
                } else {
                  paperData = paperResult;
                }
              } else {
                // No paper_id for resource
              }

              return {
                ...resource,
                users: userData || null,
                programs: programData || null,
                levels: levelData || null,
                subjects: subjectData || null,
                subject_papers: paperData || null
              };
            } catch {
              // Error enriching resource data - return original resource
              return resource;
            }
          })
        );

        // Debug logging removed for production
        
        // Client-side search filtering if 'search' is active
        let processedData = enrichedData;
        if (search) {
          processedData = enrichedData.filter(r => 
            r.title?.toLowerCase().includes(search.toLowerCase()) || 
            r.subjects?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.subject_papers?.paper_name?.toLowerCase().includes(search.toLowerCase()) ||
            r.subject_papers?.paper_code?.toLowerCase().includes(search.toLowerCase())
          );
        }
        setResources(processedData);
        setTotalResources(count || 0);
      } else {
        // Error fetching resources - handle silently in production
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, resourcesPerPage, selectedProgram, filterLevel, filterSubject, search, sortColumn, sortDirection]);

  // Fetch resources whenever relevant filters/pagination/sorting change
  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Fetch levels and subjects for the filter dropdowns based on selected program
  const fetchLevelsAndSubjectsForFilters = useCallback(async () => {
    const selectedProgramObj = programs.find(p => p.program_id === selectedProgram);

    if (!selectedProgramObj) {
      setLevelsForFilter([]);
      setSubjectsForFilter([]);
      return;
    }

    if (currentSelectedProgramIsAcademic) {
      const { data: levelData, error: levelError } = await supabase
        .from('levels')
        .select('level_id, name')
        .eq('program_id', selectedProgramObj.program_id);

      if (levelError) {
        setLevelsForFilter([]);
      } else {
        setLevelsForFilter(levelData || []);
      }

      const levelIds = (levelData || []).map(l => l.level_id);
      let subjectData = [];
      if (levelIds.length > 0) {
        const { data: offeringsData, error: offeringsError } = await supabase
          .from('subject_offerings')
          .select('subject_id')
          .eq('program_id', selectedProgramObj.program_id)
          .in('level_id', levelIds);

        if (offeringsError) {
          // Handle error silently
        } else {
          const distinctSubjectIds = [...new Set((offeringsData || []).map(o => o.subject_id))];
          if (distinctSubjectIds.length > 0) {
            const { data: subjectsResult, error: subjectsError } = await supabase
              .from('subjects')
              .select('subject_id, name')
              .in('subject_id', distinctSubjectIds);

            if (subjectsError) {
              // Handle error silently
            } else {
              subjectData = subjectsResult || [];
            }
          }
        }
      }
      setSubjectsForFilter(subjectData);

    } else {
      const { data: offeringsData, error: offeringsError } = await supabase
        .from('subject_offerings')
        .select('subject_id')
        .eq('program_id', selectedProgramObj.program_id);

      if (offeringsError) {
        // Handle error silently
      } else {
        const distinctSubjectIds = [...new Set((offeringsData || []).map(o => o.subject_id))];
        if (distinctSubjectIds.length > 0) {
          const { data: subjectsResult, error: subjectsError } = await supabase
            .from('subjects')
            .select('subject_id, name')
            .in('subject_id', distinctSubjectIds);
          if (subjectsError) {
            // Handle error silently
          } else {
            setSubjectsForFilter(subjectsResult || []);
          }
        } else {
          setSubjectsForFilter([]);
        }
      }
      setLevelsForFilter([]);
    }

    // Removed classes fetching as it's not directly linked to resources table
    // If 'classes' is needed, it would require a different join strategy or schema change.
  }, [selectedProgram, programs, currentSelectedProgramIsAcademic]);

  // Re-fetch filters when selectedProgram (ID) or programs (list) changes
  useEffect(() => { fetchLevelsAndSubjectsForFilters(); }, [fetchLevelsAndSubjectsForFilters]);

  // Handle sorting clicks
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Delete handler with custom confirmation modal
  const handleDelete = async () => {
    if (!resourceToDelete) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('resources').delete().eq('resource_id', resourceToDelete.resource_id);
      if (error) {
        alert('Failed to delete resource: ' + error.message); // Replace with custom toast/message box
      } else {
        fetchResources(); // Re-fetch resources after successful deletion
      }
    } catch {
      alert('An unexpected error occurred during deletion.'); // Replace with custom toast/message box
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
    }
  };

  // Custom Delete Confirmation Modal Component
  function DeleteConfirmModal({ show, onClose, onConfirm, resourceTitle }) {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
          <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
          <p className="mb-6">Are you sure you want to delete the resource: <span className="font-semibold">&quot;{resourceTitle}&quot;</span>? This action cannot be undone.</p>
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

  // Modal preview for PDFs/videos
  function PreviewModal({ url, onClose }) {
    if (!url) return null;
    const isPdf = url.endsWith('.pdf');
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full relative">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold">&times;</button>
          {isPdf ? (
            <iframe src={url} title="PDF Preview" className="w-full h-[70vh]" />
          ) : isVideo ? (
            <video src={url} controls className="w-full h-[70vh]" />
          ) : (
            <div className="text-center">Cannot preview this file type.</div>
          )}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResources / resourcesPerPage);

  const getSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Manage Resources</h1>
        <p className="text-lg text-gray-600">Add, edit, and organize educational resources for your programs</p>
      </div>
      {/* Program Tabs Row */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex gap-2 min-w-max">
            {programs.map(tab => (
              <button
                key={tab.program_id}
                onClick={() => {
                  setSelectedProgram(tab.program_id);
                  setFilterLevel('');
                  setFilterSubject('');
                  setCurrentPage(1); // Reset page on program change
                }}
                className={`px-4 py-2 rounded-md font-semibold text-xs border-2 transition-all duration-200 whitespace-nowrap shadow-sm
                  ${selectedProgram === tab.program_id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        {programs.length > 4 && (
          <div className="text-center text-xs text-gray-500 mt-2">
            ← Scroll to see more programs →
          </div>
        )}
      </div>
      {/* Filters + Add Button Row */}
      <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} // Reset page on search
          className="border border-gray-300 px-3 py-2 rounded-md flex-grow min-w-[200px]"
        />
        
        {currentSelectedProgramIsAcademic && (
          <>
            {levelsForFilter.length > 0 && (
              <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setCurrentPage(1); }} className="border border-gray-300 px-3 py-2 rounded-md">
                <option value="">All Levels</option>
                {levelsForFilter.map(l => <option key={l.level_id} value={l.level_id}>{l.name}</option>)}
              </select>
            )}
            {subjectsForFilter.length > 0 && (
              <select value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setCurrentPage(1); }} className="border border-gray-300 px-3 py-2 rounded-md">
                <option value="">All Subjects</option>
                {subjectsForFilter.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
              </select>
            )}
          </>
        )}
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold shadow-md transition duration-200 ease-in-out flex-shrink-0">
          + Add Resource
        </button>
      </div>

      {loading ? <p className="text-center py-8 text-gray-500">Loading resources...</p> : (
        <>
          {showAdd && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative max-w-2xl mx-auto border border-gray-200">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                title="Close"
              >
                &times;
              </button>
              <AddResourceForm onClose={() => { setShowAdd(false); fetchResources(); }} />
            </div>
          )}
          {editResource && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative max-w-2xl mx-auto border border-gray-200">
              <button
                type="button"
                onClick={() => setEditResource(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                title="Close"
              >
                &times;
              </button>
              <AddResourceForm resource={editResource} onClose={() => { setEditResource(null); fetchResources(); }} />
            </div>
          )}
          {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
          
          {resources.length > 0 ? (
            <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 align-middle">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('title')}>
                      Title {getSortIcon('title')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('uploaded_by_name')}>
                      Uploaded By {getSortIcon('uploaded_by_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('program_name')}>
                      Program {getSortIcon('program_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('level_name')}>
                      Level {getSortIcon('level_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('subject_name')}>
                      Subject {getSortIcon('subject_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle cursor-pointer" onClick={() => handleSort('paper_name')}>
                      Paper {getSortIcon('paper_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resources.map(res => (
                    <tr key={res.resource_id} className="hover:bg-blue-50 transition align-middle">
                      <td className="px-4 py-3 font-medium text-blue-900 max-w-xs truncate align-middle" title={res.title}>{res.title}</td>
                      <td className="px-4 py-3 text-gray-700 align-middle">
                        {res.users?.full_name || 
                         `${res.users?.first_name || ''} ${res.users?.last_name || ''}`.trim() || 
                         res.users?.email || 
                         (res.uploaded_by ? `ID: ${res.uploaded_by}` : 'Unknown')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 align-middle">{res.programs?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 align-middle">{res.levels?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 align-middle">{res.subjects?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700 align-middle">
                        {res.subject_papers ? `${res.subject_papers.paper_name} (${res.subject_papers.paper_code})` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate align-middle" title={res.description}>{res.description || ''}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-row items-center gap-2 justify-end">
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                            onClick={() => setPreviewUrl(res.url)}
                          >Preview</button>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition flex items-center gap-1"
                            download
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                            Download
                          </a>
                          <div className="relative">
                            <button
                              className="px-2 py-1 rounded bg-gray-100 border text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
                              onClick={e => {
                                e.preventDefault();
                                setOpenActionDropdown(openActionDropdown === res.resource_id ? null : res.resource_id);
                              }}
                            >More ▾</button>
                            {openActionDropdown === res.resource_id && (
                              <div ref={actionDropdownRef} className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-10">
                                <button
                                  className="block w-full text-left px-4 py-2 text-xs text-green-700 hover:bg-green-50"
                                  onClick={() => { setEditResource(res); setOpenActionDropdown(null); }}
                                >Edit</button>
                                <button
                                  className="block w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50"
                                  onClick={() => { setResourceToDelete(res); setShowDeleteConfirm(true); setOpenActionDropdown(null); }}
                                >Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">No resources found for this program with the current filters.</div>
          )}

          {/* Pagination Controls */}
          {totalResources > resourcesPerPage && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          <DeleteConfirmModal
            show={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            resourceTitle={resourceToDelete?.title || ''}
          />
        </>
      )}
    </div>
  );
}
