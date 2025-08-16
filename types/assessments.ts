export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  due_date: string | null;
  file_url: string | null;
  creator_id: string;
  created_at: string;
  paper_id?: string | null;
  
  // Joined data
  subject_name?: string;
  level_name?: string;
  program_name?: string;
  creator_name?: string;
  creator_role?: string;
}

export interface AssessmentFilters {
  search?: string;
  type?: string;
  subject_id?: string;
  level_id?: string;
  program_id?: string;
  creator_id?: string;
}

export interface AssessmentFormData {
  title: string;
  description: string;
  type: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  due_date: string | null;
  file_url: string | null;
  paper_id?: string | null;
}

export type AssessmentType = 'assignment' | 'quiz' | 'exam' | 'activity';

export const ASSESSMENT_TYPES: AssessmentType[] = ['assignment', 'quiz', 'exam', 'activity'];
