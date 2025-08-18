import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface Resource {
  resource_id: string
  title: string
  description: string | null
  type: string | null
  url: string
  subject_id: string | null
  level_id: string | null
  class_id: string | null
  paper_id: string | null
  program_id: string | null
  uploaded_by: string | null
  created_at: string | null
}

export interface CreateResourceData {
  title: string
  description?: string
  type: string
  url: string
  subject_id?: string
  level_id?: string
  class_id?: string
  paper_id?: string
  program_id?: string
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  resource_id: string
}

// Query Keys
export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: string) => [...resourceKeys.lists(), { filters }] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...resourceKeys.details(), id] as const,
  byTeacher: (teacherId: string) => [...resourceKeys.all, 'teacher', teacherId] as const,
}

// Fetch resources by teacher
export function useTeacherResources(teacherId: string) {
  return useQuery({
    queryKey: resourceKeys.byTeacher(teacherId),
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', teacherId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!teacherId,
  })
}

// Fetch all resources
export function useResources(filters?: string) {
  return useQuery({
    queryKey: resourceKeys.list(filters || 'all'),
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })
}

// Fetch single resource
export function useResource(id: string) {
  return useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: async (): Promise<Resource> => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('resource_id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Create resource
export function useCreateResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateResourceData): Promise<Resource> => {
      const { data: newResource, error } = await supabase
        .from('resources')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      return newResource
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
      if (data.uploaded_by) {
        queryClient.invalidateQueries({ queryKey: resourceKeys.byTeacher(data.uploaded_by) })
      }
    },
  })
}

// Update resource
export function useUpdateResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ resource_id, ...data }: UpdateResourceData): Promise<Resource> => {
      const { data: updatedResource, error } = await supabase
        .from('resources')
        .update(data)
        .eq('resource_id', resource_id)
        .select()
        .single()
      
      if (error) throw error
      return updatedResource
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(data.resource_id) })
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
      if (data.uploaded_by) {
        queryClient.invalidateQueries({ queryKey: resourceKeys.byTeacher(data.uploaded_by) })
      }
    },
  })
}

// Delete resource
export function useDeleteResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('resource_id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
      // Note: We can't invalidate byTeacher here since we don't have the teacher ID
      // This will be handled by the component calling this hook
    },
  })
}
