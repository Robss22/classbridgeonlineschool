'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';


export default function StudentResources() {
  const { studentInfo } = useStudent();
  // Removed unused ResourceRow type
  type SubjectRow = { subject_id: string; name?: string | null };
  
  interface Resource {
    resource_id: string;
    title?: string | null;
    url?: string | null;
    subject_id?: string | null;
    created_at?: string | null;
    uploaded_by?: string | null;
    class_id?: string | null;
    description?: string | null;
    level_id?: string | null;
    paper_id?: string | null;
    program_id?: string | null;
    resource_type?: string | null;
    type?: string | null; // align with DB type field
    uploader?: {
      full_name?: string | null;
      email?: string | null;
    } | null;
  }
  
  const [resources, setResources] = useState<Resource[]>([]);
  // Removed unused subjects state
  const [subjectMap, setSubjectMap] = useState<Record<string, SubjectRow>>({});
  const [loading, setLoading] = useState(true);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  useEffect(() => {
    async function fetchSubjectsAndResources() {
      setLoading(true);
      // 1. Fetch compulsory and optional subject offerings for this student
      const { data: offerings } = await supabase
        .from('subject_offerings')
        .select('subject_id, is_compulsory, subjects(name)')
        .eq('program_id', studentInfo.program_id)
        .eq('level_id', studentInfo.level_id);
      if (!offerings) {
        setLoading(false);
        return;
      }
      // 2. Split compulsory and optionals
      const compulsorySubjectIds = offerings.filter(o => o.is_compulsory).map(o => o.subject_id);
      // 3. Fetch enrolled optionals
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_offering_id, subject_offerings(subject_id, is_compulsory)')
        .eq('user_id', studentInfo.id)
        .eq('status', 'active');
      const optionalSubjectIds = (enrollments || [])
        .filter(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return so && !so.is_compulsory;
        })
        .map(e => {
          const so = Array.isArray(e.subject_offerings) ? e.subject_offerings[0] : e.subject_offerings;
          return so?.subject_id;
        })
        .filter(Boolean);
      // 4. Combine all subject IDs
      const allSubjectIds = Array.from(new Set([...compulsorySubjectIds, ...optionalSubjectIds]));
      setSubjectIds(allSubjectIds);
      // 5. Fetch subject info for mapping
      const { data: subjectsData } = await supabase.from('subjects').select('subject_id, name').in('subject_id', allSubjectIds);
  // Removed setSubjects, not needed
      const map: Record<string, SubjectRow> = {};
      (subjectsData || []).forEach((s: Record<string, unknown>) => { 
        if (s?.subject_id) map[s.subject_id as string] = s as SubjectRow; 
      });
      setSubjectMap(map);
      // 6. Fetch resources for these subjects
      const { data: initialResourcesData, error } = await supabase
        .from('resources')
        .select('*, uploader:uploaded_by (full_name, email)')
        .in('subject_id', allSubjectIds);
      let resourcesData = initialResourcesData as unknown as Resource[] | null;
      if (!resourcesData || error) {
        const fallbackData = (await supabase.from('resources').select('*').in('subject_id', allSubjectIds)).data || [];
        resourcesData = fallbackData.map((r: Record<string, unknown>) => ({ 
          resource_id: String(r.resource_id || ''),
          title: (r.title as string | null) ?? null,
          url: (r.url as string | null) ?? null,
          subject_id: (r.subject_id as string | null) ?? null,
          created_at: (r.created_at as string | null) ?? null,
          uploaded_by: (r.uploaded_by as string | null) ?? null,
          class_id: (r.class_id as string | null) ?? null,
          description: (r.description as string | null) ?? null,
          level_id: (r.level_id as string | null) ?? null,
          paper_id: (r.paper_id as string | null) ?? null,
          program_id: (r.program_id as string | null) ?? null,
          resource_type: (r.resource_type as string | null) ?? null,
          type: ((r as { type?: string | null })?.type) ?? null,
          uploader: null 
        }));
      }
      setResources(resourcesData as Resource[]);
      setLoading(false);
    }
    if (studentInfo.program_id && studentInfo.level_id && studentInfo.id) fetchSubjectsAndResources();
  }, [studentInfo]);

  useEffect(() => {
    // When subjectIds change, collapse all by default
    if (subjectIds.length > 0) {
      const collapsedInit: Record<string, boolean> = {};
      subjectIds.forEach((id: string) => { collapsedInit[id] = true; });
      setCollapsed(collapsedInit);
    }
  }, [subjectIds]);

  // Group resources by subject_id
  const resourcesBySubject: Record<string, Resource[]> = {};
  resources.forEach((r: Resource) => {
    const sid = r.subject_id || undefined;
    if (!sid) return;
    if (!resourcesBySubject[sid]) resourcesBySubject[sid] = [];
    resourcesBySubject[sid].push(r);
  });

  // Filter resources by search
  function filterResources(list: Resource[]) {
    if (!search.trim()) return list;
    const s = search.trim().toLowerCase();
    return list.filter(r =>
      (r.title && r.title.toLowerCase().includes(s)) ||
      (r.uploader?.full_name && r.uploader.full_name.toString().toLowerCase().includes(s)) ||
      (r.uploader?.email && r.uploader.email.toString().toLowerCase().includes(s))
    );
  }

  function toggleCollapse(subjectId: string) {
    setCollapsed(prev => {
      const isCurrentlyCollapsed = prev[subjectId] ?? true;
      // If currently collapsed, open this one and close others
      if (isCurrentlyCollapsed) {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach(id => { next[id] = true; });
        next[subjectId] = false;
        return next;
      }
      // If currently open, collapse it
      return { ...prev, [subjectId]: true };
    });
  }

  // Resource preview modal
  function ResourcePreviewModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
    if (!resource) return null;
    const type = resource.url?.endsWith('.pdf') ? 'PDF'
      : resource.url?.match(/youtube|mp4|mov|avi|video/i) ? 'Video'
      : resource.url?.startsWith('http') ? 'Link'
      : 'File';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900" onClick={onClose}>&times;</button>
          <h3 className="text-lg font-semibold mb-4">{resource.title || resource.url}</h3>
          {type === 'PDF' ? (
            <iframe src={resource.url ?? undefined} title="PDF Preview" className="w-full h-96 border rounded" />
          ) : type === 'Video' ? (
            <video src={resource.url ?? undefined} controls className="w-full h-96 rounded" />
          ) : type === 'Link' ? (
            <a href={resource.url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Open Link</a>
          ) : (
            <div className="text-gray-500">No preview available.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-700" /> Resources</h1>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by title or uploader..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-80"
          />
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : subjectIds.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No subjects found for your level/program.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectIds.map(subjectId => {
              const subject = subjectMap[subjectId];
              const subjectResources = filterResources(resourcesBySubject[subjectId] || []);
              const isCollapsed = collapsed[subjectId] ?? false;
              return (
                <div
                  key={subjectId}
                  className={`border rounded-lg shadow-sm bg-white h-full flex flex-col col-span-1 ${!isCollapsed ? 'sm:col-span-2 lg:col-span-4' : ''}`}
                >
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-t-lg focus:outline-none"
                    onClick={() => toggleCollapse(subjectId)}
                  >
                    <span className="flex items-start gap-2">
                      {isCollapsed ? <ChevronRight className="w-5 h-5 mt-1" /> : <ChevronDown className="w-5 h-5 mt-1" />}
                      <span className="flex flex-col leading-tight">
                        <BookOpen className="w-6 h-6 text-blue-700 mb-1" />
                        <span className="text-lg font-semibold">{subject?.name || 'Subject'}</span>
                        <span className="text-xs text-gray-500">{subjectResources.length} resource{subjectResources.length !== 1 ? 's' : ''}</span>
                      </span>
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="overflow-x-auto rounded-b-lg border-t border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {subjectResources.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-gray-400">No resources for this subject.</td>
                            </tr>
                          ) : (
                            subjectResources.map((resource: Resource) => {
                              const type = resource.url?.endsWith('.pdf') ? 'PDF'
                                : resource.url?.match(/youtube|mp4|mov|avi|video/i) ? 'Video'
                                : resource.url?.startsWith('http') ? 'Link'
                                : 'File';
                              return (
                                <tr key={resource.resource_id}>
                                  <td className="px-4 py-2 font-medium text-gray-900 flex items-center gap-2">
                                    {resource.title || resource.url}
                                    {(type === 'PDF' || type === 'Video' || type === 'Link') && (
                                      <button
                                        className="ml-2 p-1 rounded hover:bg-blue-100 text-blue-700"
                                        title="Preview"
                                        onClick={() => setPreviewResource(resource)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-gray-700">{type}</td>
                                  <td className="px-4 py-2 text-gray-700">{resource.uploader?.full_name || resource.uploader?.email || resource.uploaded_by || 'Unknown'}</td>
                                  <td className="px-4 py-2 text-gray-500">{resource.created_at ? new Date(resource.created_at ?? '').toLocaleDateString() : '-'}</td>
                                  <td className="px-4 py-2">
                                    <a
                                      href={resource.url ?? undefined}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-800 transition-colors text-xs mr-2"
                                    >
                                      View
                                    </a>
                                    <a
                                      href={resource.url ?? undefined}
                                      download
                                      className="px-3 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-800 transition-colors text-xs"
                                    >
                                      Download
                                    </a>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {previewResource && <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />}
      </div>
    </div>
  );
}

// Removed unused DropdownAction component
