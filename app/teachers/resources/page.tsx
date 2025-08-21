"use client";

import React, { useEffect, useState, useCallback } from "react";
import TeacherResourceForm from "@/components/TeacherResourceForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { BookOpen, FileText, Video, Link2, Edit, Trash2, Plus } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

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

export default function TeacherResourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  type ResourceRow = {
    resource_id: string;
    title?: string;
    url?: string;
    subject_id?: string | null;
    level_id?: string | null;
    created_at?: string | null;
    subjects?: { name?: string } | null;
    levels?: { name?: string } | null;
  };
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [filters, setFilters] = useState({ subject: "", class: "", date: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; resourceId: string | null }>({ isOpen: false, resourceId: null });

  const fetchResources = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: teacherRecord, error: teacherError } = await supabase
        .from("teachers")
        .select("teacher_id")
        .eq("user_id", user?.id ?? "")
        .single();

      if (teacherError) {
        console.error("Error fetching teacher record:", teacherError);
        setResources([]);
        setLoading(false);
        return;
      }

      const { data: teacherAssignments } = await supabase
        .from("teacher_assignments")
        .select("subject_id, level_id")
        .eq("teacher_id", teacherRecord.teacher_id);

      const subjectIds = (teacherAssignments || []).map((a) => a.subject_id).filter(Boolean) as (string | null)[];
      const levelIds = (teacherAssignments || []).map((a) => a.level_id).filter(Boolean) as (string | null)[];

      // First, let's get all resources uploaded by this teacher
      let query = supabase
        .from("resources")
        .select("*, subjects:subject_id(name), levels:level_id(name)")
        .eq("uploaded_by", user.id);



      // Only apply subject/level filtering if we have assignments
      if (teacherAssignments && teacherAssignments.length > 0) {
        if (subjectIds && subjectIds.length > 0) {
          query = query.in("subject_id", subjectIds);
        }
        if (levelIds && levelIds.length > 0) {
          query = query.in("level_id", levelIds);
        }
      }

      const { data: resourcesData, error: resourcesError } = await query.order("created_at", { ascending: false });
      
      if (resourcesError) {
        console.error('Error fetching resources:', resourcesError);
      }
      

      setResources(resourcesData || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Please log in to view your resources.
      </div>
    );
  }

  const handleDelete = async (resource_id: string) => {
    setDeleteConfirm({ isOpen: true, resourceId: resource_id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.resourceId) return;
    try {
      await supabase.from("resources").delete().eq("resource_id", deleteConfirm.resourceId);
      setResources((prev) => prev.filter((r) => r.resource_id !== deleteConfirm.resourceId));
      toast({ title: 'Success', description: 'Resource deleted successfully', variant: 'success' });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({ title: 'Error', description: 'Failed to delete resource', variant: 'error' });
    } finally {
      setDeleteConfirm({ isOpen: false, resourceId: null });
    }
  };

  const handleEdit = (resource: ResourceRow) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  const handleFormSuccess = () => {
    fetchResources();
  };

  const filteredResources = resources.filter((r) => {
    return (
      (!filters.subject || r.subject_id === filters.subject) &&
      (!filters.class || r.level_id === filters.class) &&
      (!filters.date || (r.created_at && r.created_at.startsWith(filters.date)))
    );
  });

  const uniqueSubjects = [...new Set(resources.map((r) => r.subject_id || ''))].filter(Boolean) as string[];
  const uniqueLevels = [...new Set(resources.map((r) => r.level_id || ''))].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-700" />
        My Resources
      </h1>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {showForm && (
        <TeacherResourceForm
          onClose={handleFormClose}
          resource={editingResource}
          onSuccess={handleFormSuccess}
        />
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
          {uniqueSubjects.map((subjectId) => {
            const res = resources.find((r) => r.subject_id === subjectId);
            return (
              <option key={subjectId} value={subjectId}>
                {res?.subjects?.name || subjectId}
              </option>
            );
          })}
        </select>

        <label className="font-medium">Level:</label>
        <select
          value={filters.class}
          onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Levels</option>
          {uniqueLevels.map((levelId) => {
            const res = resources.find((r) => r.level_id === levelId);
            return (
              <option key={levelId} value={levelId}>
                {res?.levels?.name || levelId}
              </option>
            );
          })}
        </select>

        <label className="font-medium">Date:</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          className="border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Resource Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white rounded-xl shadow-md text-sm sm:text-base">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">File</th>
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">Subject</th>
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">Level</th>
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">Type</th>
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">Uploaded</th>
              <th className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">Loading...</td>
              </tr>
            ) : filteredResources.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {resources.length === 0
                    ? "No resources found. Create your first resource!"
                    : "No resources match the current filters."}
                </td>
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

                return (
                  <tr key={resource.resource_id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-700" />
                      <span className="font-medium">{resource.title || resource.url}</span>
                    </td>
                    <td className="p-3">{resource.subjects?.name || "-"}</td>
                    <td className="p-3">{resource.levels?.name || "-"}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                        {tag}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {resource.created_at ? new Date(resource.created_at ?? '').toLocaleDateString() : "-"}
                    </td>
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
                        onClick={() => handleEdit(resource)}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.resource_id)}
                        className="inline-flex items-center px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, resourceId: null })}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
