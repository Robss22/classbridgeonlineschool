import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface Student {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

export interface StudentWithDetails extends Student {
  profile?: {
    student_id: string
    level_id: string | null
    program_id: string | null
    enrollment_date: string | null
  }
}

// Query Keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: string) => [...studentKeys.lists(), { filters }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  byTeacher: (teacherId: string) => [...studentKeys.all, 'teacher', teacherId] as const,
}

// Fetch students by teacher
export function useTeacherStudents(teacherId: string) {
  return useQuery({
    queryKey: studentKeys.byTeacher(teacherId),
    queryFn: async (): Promise<StudentWithDetails[]> => {
      // This would need to be implemented based on your actual database schema
      // For now, returning basic student data
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, role, created_at, updated_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!teacherId,
  })
}

// Fetch all students
export function useStudents(filters?: string) {
  return useQuery({
    queryKey: studentKeys.list(filters || 'all'),
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, role, created_at, updated_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })
}

// Fetch single student
export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async (): Promise<Student> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, role, created_at, updated_at')
        .eq('id', id)
        .eq('role', 'student')
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Update student
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Student> & { id: string }): Promise<Student> => {
      const { data: updatedStudent, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select('id, email, first_name, last_name, full_name, role, created_at, updated_at')
        .single()
      
      if (error) throw error
      return updatedStudent
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
  })
}
