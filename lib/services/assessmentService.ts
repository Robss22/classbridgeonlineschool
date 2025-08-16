import { supabase } from '@/lib/supabaseClient';
import { Assessment, AssessmentFilters, AssessmentFormData } from '@/types/assessments';

export class AssessmentService {
  // Fetch assessments with filters
  static async fetchAssessments(filters: AssessmentFilters = {}, userRole?: string, userId?: string): Promise<Assessment[]> {
    try {
      let query = supabase
        .from('assessments')
        .select(`
          id, title, description, type, due_date, file_url, paper_id,
          program_id, level_id, subject_id, creator_id, created_at,
          programs(name),
          levels(name),
          subjects(name),
          creator:users(full_name, email, role)
        `);

      // Apply role-based filtering
      if (userRole === 'teacher' && userId) {
        query = query.eq('creator_id', userId);
      }

      // Apply filters
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.subject_id) {
        query = query.eq('subject_id', filters.subject_id);
      }
      if (filters.level_id) {
        query = query.eq('level_id', filters.level_id);
      }
      if (filters.program_id) {
        query = query.eq('program_id', filters.program_id);
      }
      if (filters.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      // Transform the data to match the Assessment interface
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        program_id: item.program_id,
        level_id: item.level_id,
        subject_id: item.subject_id,
        due_date: item.due_date,
        file_url: item.file_url,
        creator_id: item.creator_id,
        created_at: item.created_at,
        paper_id: item.paper_id,
        subject_name: item.subjects?.name || 'Unknown Subject',
        level_name: item.levels?.name || 'Unknown Level',
        program_name: item.programs?.name || 'Unknown Program',
        creator_name: item.creator?.full_name || 'Unknown Creator',
        creator_role: item.creator?.role || 'Unknown Role',
      }));
    } catch (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }
  }

  // Fetch student assessments based on enrollments
  static async fetchStudentAssessments(userId: string): Promise<Assessment[]> {
    try {
      // Get student's enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          subject_id,
          level_id,
          subject_offerings:subject_offering_id (
            program_id
          )
        `)
        .eq('user_id', userId);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Extract IDs for filtering
      const subjectIds = enrollments.map(e => e.subject_id).filter((id): id is string => id !== null && id !== undefined);
      const levelIds = enrollments.map(e => e.level_id).filter((id): id is string => id !== null && id !== undefined);
      const programIds = enrollments.map(e => e.subject_offerings?.program_id).filter((id): id is string => id !== null && id !== undefined);

      // Only proceed if we have valid IDs
      if (subjectIds.length === 0 || levelIds.length === 0 || programIds.length === 0) {
        return [];
      }

      // Fetch assessments for enrolled subjects/levels/programs
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id, title, description, type, due_date, file_url, paper_id,
          program_id, level_id, subject_id, creator_id, created_at,
          programs(name),
          levels(name),
          subjects(name),
          creator:users(first_name, last_name)
        `)
        .in('subject_id', subjectIds)
        .in('level_id', levelIds)
        .in('program_id', programIds)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Transform the data
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        program_id: item.program_id,
        level_id: item.level_id,
        subject_id: item.subject_id,
        due_date: item.due_date,
        file_url: item.file_url,
        creator_id: item.creator_id,
        created_at: item.created_at,
        paper_id: item.paper_id,
        subject_name: item.subjects?.name || 'Unknown Subject',
        level_name: item.levels?.name || 'Unknown Level',
        program_name: item.programs?.name || 'Unknown Program',
        creator_name: item.creator ? 
          `${item.creator.first_name} ${item.creator.last_name}` : 
          'Unknown Teacher',
      }));
    } catch (error) {
      console.error('Error fetching student assessments:', error);
      throw error;
    }
  }

  // Create new assessment
  static async createAssessment(assessmentData: AssessmentFormData, creatorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assessments')
        .insert([{
          ...assessmentData,
          creator_id: creatorId,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  // Update assessment
  static async updateAssessment(id: string, assessmentData: Partial<AssessmentFormData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('assessments')
        .update(assessmentData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  // Delete assessment
  static async deleteAssessment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  }

  // Fetch available subjects, levels, and programs for forms
  static async fetchFormOptions() {
    try {
      const [subjectsResult, levelsResult, programsResult] = await Promise.all([
        supabase.from('subjects').select('subject_id, name').order('name'),
        supabase.from('levels').select('level_id, name').order('name'),
        supabase.from('programs').select('program_id, name').order('name'),
      ]);

      return {
        subjects: subjectsResult.data || [],
        levels: levelsResult.data || [],
        programs: programsResult.data || [],
      };
    } catch (error) {
      console.error('Error fetching form options:', error);
      throw error;
    }
  }
}
