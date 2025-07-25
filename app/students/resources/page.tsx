'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen, FileText, Video, Link2, MoreVertical, CheckCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';

const fileTypeIcons = {
  pdf: FileText,
  video: Video,
  link: Link2,
  default: BookOpen,
};

const fileTypeTags = {
  pdf: '#PDF',
  video: '#Video',
  link: '#Link',
  default: '#File',
};

export default function StudentResources() {
  const { studentInfo } = useStudent();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [subjectIds, setSubjectIds] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');
  const [previewResource, setPreviewResource] = useState(null);

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
      const optionalSubjectIds = enrollments
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
      const { data: subjectsData } = await supabase.from('subjects').select('*').in('subject_id', allSubjectIds);
      setSubjects(subjectsData || []);
      const map = {};
      (subjectsData || []).forEach(s => { map[s.subject_id] = s; });
      setSubjectMap(map);
      // 6. Fetch resources for these subjects
      let { data: resourcesData, error } = await supabase
        .from('resources')
        .select('*, uploader:uploaded_by (full_name, email)')
        .in('subject_id', allSubjectIds);
      if (!resourcesData || error) {
        resourcesData = (await supabase.from('resources').select('*').in('subject_id', allSubjectIds)).data;
      }
      setResources(resourcesData || []);
      setLoading(false);
    }
    if (studentInfo.program_id && studentInfo.level_id && studentInfo.id) fetchSubjectsAndResources();
  }, [studentInfo]);

  useEffect(() => {
    // When subjectIds change, collapse all by default
    if (subjectIds.length > 0) {
      const collapsedInit = {};
      subjectIds.forEach(id => { collapsedInit[id] = true; });
      setCollapsed(collapsedInit);
    }
  }, [subjectIds]);

  // Group resources by subject_id
  const resourcesBySubject = {};
  resources.forEach(r => {
    if (!resourcesBySubject[r.subject_id]) resourcesBySubject[r.subject_id] = [];
    resourcesBySubject[r.subject_id].push(r);
  });

  // Filter resources by search
  function filterResources(list) {
    if (!search.trim()) return list;
    const s = search.trim().toLowerCase();
    return list.filter(r =>
      (r.title && r.title.toLowerCase().includes(s)) ||
      (r.uploader?.full_name && r.uploader.full_name.toLowerCase().includes(s)) ||
      (r.uploader?.email && r.uploader.email.toLowerCase().includes(s))
    );
  }

  function toggleCollapse(subjectId) {
    setCollapsed(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }

  // Resource preview modal
  function ResourcePreviewModal({ resource, onClose }) {
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
            <iframe src={resource.url} title="PDF Preview" className="w-full h-96 border rounded" />
          ) : type === 'Video' ? (
            <video src={resource.url} controls className="w-full h-96 rounded" />
          ) : type === 'Link' ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Open Link</a>
          ) : (
            <div className="text-gray-500">No preview available.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
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
        subjectIds.map(subjectId => {
          const subject = subjectMap[subjectId];
          const subjectResources = filterResources(resourcesBySubject[subjectId] || []);
          const isCollapsed = collapsed[subjectId] ?? false;
          return (
            <div key={subjectId} className="mb-10 border rounded-lg shadow-sm">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-t-lg focus:outline-none"
                onClick={() => toggleCollapse(subjectId)}
              >
                <span className="flex items-center gap-2 text-lg font-semibold">
                  {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  <BookOpen className="w-5 h-5 text-blue-700" /> {subject?.name || 'Subject'}
                </span>
                <span className="text-xs text-gray-500">{subjectResources.length} resource{subjectResources.length !== 1 ? 's' : ''}</span>
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
                        subjectResources.map(resource => {
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
                              <td className="px-4 py-2 text-gray-500">{resource.created_at ? new Date(resource.created_at).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-2">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-800 transition-colors text-xs mr-2"
                >
                  View
                </a>
                <a
                  href={resource.url}
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
        })
      )}
      {previewResource && <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />}
    </div>
  );
}

// DropdownAction component
function DropdownAction({ url, type }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Actions"
      >
        <MoreVertical className="w-5 h-5 text-blue-700" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-blue-100 border border-blue-200 rounded-lg shadow-lg z-10">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2 text-sm text-blue-900 hover:bg-blue-200 hover:text-blue-900 rounded-t-lg"
            onClick={() => setOpen(false)}
            style={{ color: '#1e3a8a' }}
          >
            View
          </a>
          <a
            href={url}
            download
            className="block px-4 py-2 text-sm text-blue-900 hover:bg-blue-200 hover:text-blue-900 rounded-b-lg"
            onClick={() => setOpen(false)}
            style={{ color: '#1e3a8a' }}
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
