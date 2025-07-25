"use client";
import React, { useEffect, useState, useRef } from "react";
import AddResourceForm from '../../admin/resources/AddResourceForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import { BookOpen, FileText, Video, Link2, Edit, Trash2, UploadCloud, Plus, X } from "lucide-react";

const fileTypeIcons = {
  pdf: FileText,
  video: Video,
  link: Link2,
  default: BookOpen,
};

const fileTypeTags = {
  pdf: "#PDF",
  video: "#Video",
  link: "#Link",
  default: "#File",
};

const resourceTypes = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "link", label: "Link" },
];

export default function TeacherResourcesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ subject: "", class: "", date: "" });
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      // Fetch teacher's assigned subjects and classes
      const { data: teacherAssignments } = await supabase
        .from("teacher_assignments")
        .select("subject_id, class_id")
        .eq("teacher_id", user.id);
      const subjectIds = teacherAssignments?.map((a) => a.subject_id).filter(Boolean);
      const classIds = teacherAssignments?.map((a) => a.class_id).filter(Boolean);
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .in("subject_id", subjectIds?.length ? subjectIds : [""]);
      const { data: classesData } = await supabase
        .from("classes")
        .select("class_id, name")
        .in("class_id", classIds?.length ? classIds : [""]);
      setSubjects(subjectsData || []);
      setClasses(classesData || []);
      // Fetch resources uploaded by this teacher
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*, subjects:subject_id(name), classes:class_id(name)")
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false });
      setResources(resourcesData || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const handleDelete = async (resource_id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    await supabase.from("resources").delete().eq("resource_id", resource_id);
    setResources((prev) => prev.filter((r) => r.resource_id !== resource_id));
  };

  const filteredResources = resources.filter((r) => {
    return (
      (!filters.subject || r.subject_id === filters.subject) &&
      (!filters.class || r.class_id === filters.class) &&
      (!filters.date || (r.created_at && r.created_at.startsWith(filters.date)))
    );
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-700" /> Resources Management
      </h1>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {showForm ? "Close" : "Add Resource"}
        </button>
      </div>
      {showForm && (
        <AddResourceForm onClose={() => { setShowForm(false); /* Optionally refresh resources here */ }} />
      )}
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="font-medium">Filter by Subject:</label>
        <select
          value={filters.subject}
          onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.name}
            </option>
          ))}
        </select>
        <label className="font-medium">Class:</label>
        <select
          value={filters.class}
          onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="font-medium">Date:</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      {/* Resources Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md">
          <thead>
            <tr className="bg-blue-50">
              <th className="p-3 text-left font-semibold">File</th>
              <th className="p-3 text-left font-semibold">Subject</th>
              <th className="p-3 text-left font-semibold">Class</th>
              <th className="p-3 text-left font-semibold">Type</th>
              <th className="p-3 text-left font-semibold">Uploaded</th>
              <th className="p-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">Loading...</td>
              </tr>
            ) : filteredResources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No resources found.</td>
              </tr>
            ) : (
              filteredResources.map((resource) => {
                const type = resource.url?.endsWith(".pdf")
                  ? "pdf"
                  : resource.url?.match(/youtube|mp4|mov|avi|video/i)
                  ? "video"
                  : resource.url?.startsWith("http")
                  ? "link"
                  : "default";
                const Icon = fileTypeIcons[type] || fileTypeIcons.default;
                const tag = fileTypeTags[type] || fileTypeTags.default;
                const subject = resource.subjects;
                const classObj = resource.classes;
                return (
                  <tr key={resource.resource_id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-700" />
                      <span className="font-medium">{resource.title || resource.url}</span>
                    </td>
                    <td className="p-3">{subject?.name || "-"}</td>
                    <td className="p-3">{classObj?.name || "-"}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{tag}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">{resource.created_at ? new Date(resource.created_at).toLocaleDateString() : "-"}</td>
                    <td className="p-3 flex gap-2">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
                      >
                        {type === "link" ? "View" : "Download"}
                      </a>
                      <button
                        onClick={() => handleDelete(resource.resource_id)}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {/* Edit button can be implemented as a modal in the future */}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 