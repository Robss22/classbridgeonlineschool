import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface LiveClass {
  live_class_id: string
  title: string | null
  description: string | null
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  status: string | null
  meeting_link: string | null
  meeting_platform: string | null
  created_by: string | null
  subject_id: string | null
}

export interface CreateLiveClassData {
  title: string
  description?: string
  scheduled_date: string
  start_time: string
  end_time: string
  subject_id?: string
  meeting_platform?: string
}

export interface UpdateLiveClassData extends Partial<CreateLiveClassData> {
  live_class_id: string
}

// Query Keys
export const liveClassKeys = {
  all: ['live-classes'] as const,
  lists: () => [...liveClassKeys.all, 'list'] as const,
  list: (filters: string) => [...liveClassKeys.lists(), { filters }] as const,
  details: () => [...liveClassKeys.all, 'detail'] as const,
  detail: (id: string) => [...liveClassKeys.details(), id] as const,
}

// Fetch live classes
export function useLiveClasses(filters?: string) {
  return useQuery({
    queryKey: liveClassKeys.list(filters || 'all'),
    queryFn: async (): Promise<LiveClass[]> => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .order('scheduled_date', { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })
}

// Fetch single live class
export function useLiveClass(id: string) {
  return useQuery({
    queryKey: liveClassKeys.detail(id),
    queryFn: async (): Promise<LiveClass> => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .eq('live_class_id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Create live class
export function useCreateLiveClass() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateLiveClassData): Promise<LiveClass> => {
      const { data: newClass, error } = await supabase
        .from('live_classes')
        .insert([data])
        .select()
        .single()
      
      if (error) throw error
      return newClass
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveClassKeys.lists() })
    },
  })
}

// Update live class
export function useUpdateLiveClass() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ live_class_id, ...data }: UpdateLiveClassData): Promise<LiveClass> => {
      const { data: updatedClass, error } = await supabase
        .from('live_classes')
        .update(data)
        .eq('live_class_id', live_class_id)
        .select()
        .single()
      
      if (error) throw error
      return updatedClass
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: liveClassKeys.detail(data.live_class_id) })
      queryClient.invalidateQueries({ queryKey: liveClassKeys.lists() })
    },
  })
}

// Delete live class
export function useDeleteLiveClass() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('live_classes')
        .delete()
        .eq('live_class_id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveClassKeys.lists() })
    },
  })
}
