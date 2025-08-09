import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';

export default function AddResourceForm({ onClose, resource }: { onClose: () => void, resource?: any }) {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([]);
  const [levels, setLevels] = useState<{ level_id: string; name: string }[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(resource?.program_id || '');
  const [selectedLevel, setSelectedLevel] = useState(resource?.level_id || '');
  const [selectedSubjectOfferingId, setSelectedSubjectOfferingId] = useState(resource?.subject_id || '');
  const [actualSubjectId, setActualSubjectId] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(resource?.paper_id || '');
  const [title, setTitle] = useState(resource?.title || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [url, setUrl] = useState(resource?.url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef(null);
  const resourceTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'video', label: 'Video' },
    { value: 'link', label: 'Link' },
  ];
  const [resourceType, setResourceType] = useState(resource?.type || 'pdf');
  const [subjectOfferings, setSubjectOfferings] = useState<any[]>([]);
  const [subjectsForDropdown, setSubjectsForDropdown] = useState<{ subject_offering_id: string; subject_id: string; name: string }[]>([]);
  const [papersForDropdown, setPapersForDropdown] = useState<{ paper_id: string; paper_code: string; paper_name: string }[]>([]);

  const currentProgramIsAcademic = programs.find(
    p => p.program_id === selectedProgram && (p.name?.toLowerCase().includes('uneb') || p.name?.toLowerCase().includes('cambridge'))
  );

  console.log('🔍 [AddResourceForm] Program academic check:', { 
    selectedProgram, 
    programs: programs.map(p => ({ id: p.program_id, name: p.name })),
    currentProgramIsAcademic: currentProgramIsAcademic ? { id: currentProgramIsAcademic.program_id, name: currentProgramIsAcademic.name } : null
  });

  useEffect(() => { 
    setHydrated(true); 
    console.log('🔄 [AddResourceForm] Component hydrated');
  }, []);

  useEffect(() => {
    console.log('🔄 [AddResourceForm] Resource prop changed:', resource);
  }, [resource]);

  useEffect(() => {
    if (!hydrated) return;
    console.log('🔍 [AddResourceForm] Fetching programs...');
    supabase.from('programs').select('program_id, name').then(({ data, error }) => {
      if (error) { 
        console.error('❌ [AddResourceForm] Supabase error fetching programs:', error); 
      } else {
        console.log('✅ [AddResourceForm] Programs fetched:', data);
      }
      setPrograms(data || []);
      if (resource?.program_id) {
        setSelectedProgram(resource.program_id);
      }
    });
  }, [resource, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    console.log('🔍 [AddResourceForm] Checking program selection:', { selectedProgram, programs: programs.length });
    if (!selectedProgram) {
      console.log('⚠️ [AddResourceForm] No program selected, clearing dependent data');
      setLevels([]); setSelectedLevel('');
      setSubjectOfferings([]); setSubjectsForDropdown([]); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setPapersForDropdown([]); setSelectedPaper('');
      return;
    }
    console.log('🔍 [AddResourceForm] Current program is academic:', currentProgramIsAcademic);
    if (currentProgramIsAcademic) {
      console.log('🔍 [AddResourceForm] Fetching levels for academic program:', selectedProgram);
      supabase.from('levels').select('level_id, name').eq('program_id', selectedProgram).then(({ data, error }) => {
        if (error) { 
          console.error('❌ [AddResourceForm] Supabase error fetching levels:', error); 
        } else {
          console.log('✅ [AddResourceForm] Levels fetched:', data);
        }
        setLevels(data || []);
        if (resource?.level_id) {
          setSelectedLevel(resource.level_id);
        }
      });
    } else {
      console.log('⚠️ [AddResourceForm] Non-academic program, clearing level-dependent data');
      setLevels([]); setSelectedLevel('');
      setSubjectOfferings([]); setSubjectsForDropdown([]); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setPapersForDropdown([]); setSelectedPaper('');
    }
  }, [selectedProgram, programs, currentProgramIsAcademic, resource, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    console.log('🔍 [AddResourceForm] Checking level and program for subject offerings:', { selectedLevel, selectedProgram, currentProgramIsAcademic });
    if (!selectedLevel || !currentProgramIsAcademic || !selectedProgram) {
      console.log('⚠️ [AddResourceForm] Missing requirements for subject offerings, clearing data');
      setSubjectOfferings([]); setSubjectsForDropdown([]); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setPapersForDropdown([]); setSelectedPaper('');
      return;
    }
    console.log('🔍 [AddResourceForm] Fetching subject offerings for level:', selectedLevel, 'program:', selectedProgram);
    supabase
      .from('subject_offerings')
      .select('subject_offering_id, subject_id, is_compulsory')
      .eq('level_id', selectedLevel)
      .eq('program_id', selectedProgram)
      .then(async ({ data: offerings, error }) => {
        if (error) { 
          console.error('❌ [AddResourceForm] Supabase error fetching subject_offerings:', error); 
        } else {
          console.log('✅ [AddResourceForm] Subject offerings fetched:', offerings);
        }
        if (!offerings || offerings.length === 0) {
          console.log('⚠️ [AddResourceForm] No subject offerings found');
          setSubjectOfferings([]); setSubjectsForDropdown([]); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setPapersForDropdown([]); setSelectedPaper('');
          return;
        }
        setSubjectOfferings(offerings);
        const subjectIds = offerings.map(so => so.subject_id).filter(Boolean);
        console.log('🔍 [AddResourceForm] Subject IDs extracted:', subjectIds);
        if (!subjectIds.length) {
          console.log('⚠️ [AddResourceForm] No valid subject IDs found');
          setSubjectsForDropdown([]); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setPapersForDropdown([]); setSelectedPaper('');
          return;
        }
        console.log('🔍 [AddResourceForm] Fetching subjects for IDs:', subjectIds);
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('subject_id, name')
          .in('subject_id', subjectIds);
        if (subjectsError) { 
          console.error('❌ [AddResourceForm] Supabase error fetching subjects:', subjectsError); 
        } else {
          console.log('✅ [AddResourceForm] Subjects fetched:', subjectsData);
        }
        const mappedSubjects = (offerings || []).map(offering => {
          const subj = (subjectsData || []).find(s => s.subject_id === offering.subject_id);
          return subj ? { subject_offering_id: offering.subject_offering_id, subject_id: offering.subject_id, name: subj.name } : null;
        }).filter((item): item is { subject_offering_id: string; subject_id: string; name: string } => item !== null);
        console.log('✅ [AddResourceForm] Mapped subjects for dropdown:', mappedSubjects);
        setSubjectsForDropdown(mappedSubjects);
        if (resource && resource.subject_id && resource.level_id === selectedLevel && resource.program_id === selectedProgram) {
          const initialOffering = mappedSubjects.find(s => s.subject_id === resource.subject_id);
          if (initialOffering) {
            setSelectedSubjectOfferingId(initialOffering.subject_offering_id);
            setActualSubjectId(initialOffering.subject_id);
            setSubjectSearch(initialOffering.name);
          }
        }
      });
  }, [selectedLevel, selectedProgram, currentProgramIsAcademic, programs, resource, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    console.log('🔍 [AddResourceForm] Checking subject offering for papers:', { selectedSubjectOfferingId, subjectOfferings: subjectOfferings.length });
    if (!selectedSubjectOfferingId) {
      console.log('⚠️ [AddResourceForm] No subject offering selected, clearing papers');
      setPapersForDropdown([]);
      setSelectedPaper('');
      return;
    }
    const selectedOffering = subjectOfferings.find(so => so.subject_offering_id === selectedSubjectOfferingId);
    console.log('🔍 [AddResourceForm] Selected offering:', selectedOffering);
    if (!selectedOffering || !selectedOffering.subject_id) {
      console.log('⚠️ [AddResourceForm] Invalid selected offering, clearing papers');
      setPapersForDropdown([]);
      setSelectedPaper('');
      return;
    }
    console.log('🔍 [AddResourceForm] Fetching papers for subject:', selectedOffering.subject_id);
    supabase
      .from('subject_papers')
      .select('paper_id, paper_code, paper_name')
      .eq('subject_id', selectedOffering.subject_id)
      .then(({ data: papersData, error: papersError }) => {
        if (papersError) { 
          console.error('❌ [AddResourceForm] Supabase error fetching papers:', papersError); 
        } else {
          console.log('✅ [AddResourceForm] Papers fetched:', papersData);
        }
        setPapersForDropdown(papersData || []);
        if (resource && resource.paper_id && (papersData || []).some(p => p.paper_id === resource.paper_id)) {
          setSelectedPaper(resource.paper_id);
        }
      });
  }, [selectedSubjectOfferingId, subjectOfferings, resource, hydrated]);

  useEffect(() => {
    if (resource?.url) setFileUrl('');
  }, [resource]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (subjectDropdownRef.current && !(subjectDropdownRef.current as HTMLElement).contains(event.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    }
    if (subjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [subjectDropdownOpen]);

  const currentSelectedSubjectName = selectedSubjectOfferingId
    ? subjectsForDropdown.find(s => s.subject_offering_id === selectedSubjectOfferingId)?.name || ''
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    let resourceUrl = url || fileUrl || resource?.url;
    if (!resourceUrl) {
      setError('Please provide a file or a URL.');
      setLoading(false);
      return;
    }
    if (!selectedProgram) {
      setError('Please select a program.');
      setLoading(false);
      return;
    }
    const isCurrentProgramAcademicAtSubmit = programs.find(
      p => p.program_id === selectedProgram && (p.name?.toLowerCase().includes('uneb') || p.name?.toLowerCase().includes('cambridge'))
    );
    if (isCurrentProgramAcademicAtSubmit) {
      if (!selectedLevel) {
        setError('Please select a level.');
        setLoading(false);
        return;
      }
      if (!selectedSubjectOfferingId || !actualSubjectId) {
        setError('Please select a subject.');
        setLoading(false);
        return;
      }
    }
    const resourceData = {
      title,
      description,
      url: resourceUrl,
      program_id: selectedProgram,
      level_id: selectedLevel || null,
      subject_id: actualSubjectId || null,
      paper_id: selectedPaper || null,
      type: resourceType,
      uploaded_by: user?.id,
    };
    if (resource) {
      const { error: updateError } = await supabase.from('resources').update(resourceData).eq('resource_id', resource.resource_id);
      if (updateError) {
        setError('Failed to update resource: ' + (updateError.message || 'Unknown error'));
        setLoading(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('resources').insert([resourceData]);
      if (insertError) {
        setError('Failed to add resource: ' + (insertError.message || 'Unknown error'));
        setLoading(false);
        return;
      }
    }
    onClose();
  };

  if (!hydrated) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8 relative max-w-2xl mx-auto mt-8 flex flex-col" style={{height: '90vh', maxHeight: '90vh', minHeight: '60vh', overflow: 'hidden'}}>
      <div className="flex-1 overflow-y-auto pr-2" style={{scrollbarWidth: 'thin'}}>
        <h2 className="text-2xl font-bold mb-6 text-center col-span-2">{resource ? 'Edit Resource' : 'Add Resource'}</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" title="Close">&times;</button>
        <form onSubmit={handleSubmit} className="space-y-4 col-span-2">
          {/* Type & Program Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Resource Type</label>
              <select value={resourceType} onChange={e => setResourceType(e.target.value)} className="w-full border rounded px-3 py-2">
                {resourceTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Program</label>
              <select value={selectedProgram} onChange={e => { setSelectedProgram(e.target.value); setSelectedLevel(''); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setSelectedPaper(''); }} required className="w-full border rounded px-3 py-2">
                <option value="">Select Program</option>
                {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {/* Level & Subject Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentProgramIsAcademic && (
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <select value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedSubjectOfferingId(''); setActualSubjectId(''); setSelectedPaper(''); }} required className="w-full border rounded px-3 py-2">
                  <option value="">Select Level</option>
                  {levels.map(l => <option key={l.level_id} value={l.level_id}>{l.name}</option>)}
                </select>
              </div>
            )}
            {(currentProgramIsAcademic && selectedLevel) || (!currentProgramIsAcademic && selectedProgram) ? (
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <div className="relative" ref={subjectDropdownRef}>
                  <input
                    type="text"
                    value={currentSelectedSubjectName || subjectSearch}
                    onChange={e => {
                      const val = e.target.value;
                      setSubjectSearch(val);
                      if (val === '') {
                        setSelectedSubjectOfferingId('');
                        setActualSubjectId('');
                        setSelectedPaper('');
                      }
                    }}
                    placeholder="Search subject..."
                    className="w-full border rounded px-3 py-2 mb-1"
                    disabled={currentProgramIsAcademic && !selectedLevel}
                    onFocus={() => setSubjectDropdownOpen(true)}
                    onClick={() => setSubjectDropdownOpen(true)}
                  />
                  {subjectDropdownOpen && (
                    <div className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto shadow">
                      {(subjectSearch ? subjectsForDropdown.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase())) : subjectsForDropdown).map(s => (
                        <div
                          key={s.subject_offering_id}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${selectedSubjectOfferingId === s.subject_offering_id ? 'bg-blue-50 font-bold' : ''}`}
                          onClick={() => {
                            setSelectedSubjectOfferingId(s.subject_offering_id);
                            setActualSubjectId(s.subject_id);
                            setSubjectSearch(s.name);
                            setSubjectDropdownOpen(false);
                            setSelectedPaper('');
                          }}
                        >
                          {s.name}
                        </div>
                      ))}
                      {(subjectSearch ? subjectsForDropdown.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase())) : subjectsForDropdown).length === 0 && (
                        <div className="px-3 py-2 text-gray-400">No subjects found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 text-gray-500 text-sm">Select a program and level to see subjects.</div>
            )}
            {selectedSubjectOfferingId && papersForDropdown.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Paper (Optional)</label>
                <select
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Paper</option>
                  {papersForDropdown.map(p => (
                    <option key={p.paper_id} value={p.paper_id}>
                      {p.paper_name} ({p.paper_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center justify-center my-2 text-gray-400 text-xs font-semibold">──────── OR ────────</div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">File Upload (optional)</label>
              <FileUpload
                bucket="resources"
                folder={selectedProgram ? `program_${selectedProgram}` : ""}
                onUpload={setFileUrl}
                label="Attach Resource File"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png"
              />
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">File attached</a>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resource URL (optional)</label>
              <input value={url} onChange={e => setUrl(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="https://..." 
                disabled={!!resource}
              />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-blue-300 mt-2">
              {loading ? (resource ? 'Saving...' : 'Adding...') : (resource ? 'Save Changes' : 'Add Resource')}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition mt-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
