export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          about_student: string | null
          application_id: string
          class: string | null
          consent: boolean | null
          curriculum: string | null
          descriptive_program_code: string | null
          dob: string | null
          document_url: string | null
          first_name: string | null
          gender: string | null
          last_name: string | null
          nationality: string | null
          parent_contact: string | null
          parent_email: string | null
          parent_name: string | null
          program_id: string | null
          registration_number: string | null
          status: string
          student_email: string | null
          submitted_at: string | null
          temporary_password: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          about_student?: string | null
          application_id?: string
          class?: string | null
          consent?: boolean | null
          curriculum?: string | null
          descriptive_program_code?: string | null
          dob?: string | null
          document_url?: string | null
          first_name?: string | null
          gender?: string | null
          last_name?: string | null
          nationality?: string | null
          parent_contact?: string | null
          parent_email?: string | null
          parent_name?: string | null
          program_id?: string | null
          registration_number?: string | null
          status: string
          student_email?: string | null
          submitted_at?: string | null
          temporary_password?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          about_student?: string | null
          application_id?: string
          class?: string | null
          consent?: boolean | null
          curriculum?: string | null
          descriptive_program_code?: string | null
          dob?: string | null
          document_url?: string | null
          first_name?: string | null
          gender?: string | null
          last_name?: string | null
          nationality?: string | null
          parent_contact?: string | null
          parent_email?: string | null
          parent_name?: string | null
          program_id?: string | null
          registration_number?: string | null
          status?: string
          student_email?: string | null
          submitted_at?: string | null
          temporary_password?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
     
      enrollments: {
        Row: {
          academic_year: string
          class: string
          created_at: string | null
          curriculum: string
          enrollment_date: string | null
          id: string
          progress: number | null
          registration_number: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_year: string
          class: string
          created_at?: string | null
          curriculum: string
          enrollment_date?: string | null
          id?: string
          progress?: number | null
          registration_number: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_year?: string
          class?: string
          created_at?: string | null
          curriculum?: string
          enrollment_date?: string | null
          id?: string
          progress?: number | null
          registration_number?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          level_id: string
          name: string
          program_id: string | null
        }
        Insert: {
          level_id?: string
          name: string
          program_id?: string | null
        }
        Update: {
          level_id?: string
          name?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          description: string | null
          name: string
          program_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          name: string
          program_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          name?: string
          program_id?: string
        }
        Relationships: []
      }
      registration_sequences: {
        Row: {
          id: string
          last_sequence_number: number
          program_code: string
          year_month: string
        }
        Insert: {
          id?: string
          last_sequence_number?: number
          program_code: string
          year_month: string
        }
        Update: {
          id?: string
          last_sequence_number?: number
          program_code?: string
          year_month?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          level_id: string | null
          created_at: string | null
          description: string | null
          program_id: string | null
          resource_id: string
          title: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          level_id?: string | null
          created_at?: string | null
          description?: string | null
          program_id?: string | null
          resource_id?: string
          title: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          level_id?: string | null
          created_at?: string | null
          description?: string | null
          program_id?: string | null
          resource_id?: string
          title?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "resources_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          level_id: string | null
          name: string
          paper_type: string | null
          subject_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          level_id?: string | null
          name: string
          paper_type?: string | null
          subject_id?: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          level_id?: string | null
          name?: string
          paper_type?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["level_id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          assigned_at: string | null
          assignment_id: string
          level_id: string | null
          program_id: string | null
          academic_year: string | null
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_id?: string
          level_id?: string | null
          program_id?: string | null
          academic_year?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_id?: string
          level_id?: string | null
          program_id?: string | null
          academic_year?: string | null
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "teacher_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers_with_users"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string | null
          program_id: string | null
          teacher_id: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          program_id?: string | null
          teacher_id?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          program_id?: string | null
          teacher_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_teachers_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          message_id: string
          subject: string
          body: string
          sender_id: string
          recipient_id: string
          recipient_type: string
          parent_id: string | null
          created_at: string
          updated_at: string
          read: boolean
          archived: boolean
          message_type: string
          sender_type: string
          priority: string
        }
        Insert: {
          id?: string
          message_id?: string
          subject: string
          body: string
          sender_id: string
          recipient_id: string
          recipient_type: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
          read?: boolean
          archived?: boolean
          message_type?: string
          sender_type?: string
          priority?: string
        }
        Update: {
          id?: string
          message_id?: string
          subject?: string
          body?: string
          sender_id?: string
          recipient_id?: string
          recipient_type?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
          read?: boolean
          archived?: boolean
          message_type?: string
          sender_type?: string
          priority?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_recipient_id"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          academic_year: string | null
          address: string | null
          auth_user_id: string | null
          class: string | null
          created_at: string | null
          curriculum: string | null
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          enrollment_date: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_login: string | null
          last_name: string | null
          medical_conditions: string | null
          nationality: string | null
          parent_email: string | null
          password_changed: boolean | null
          password_hash: string | null
          phone: string | null
          registration_number: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          auth_user_id?: string | null
          class?: string | null
          created_at?: string | null
          curriculum?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          medical_conditions?: string | null
          nationality?: string | null
          parent_email?: string | null
          password_changed?: boolean | null
          password_hash?: string | null
          phone?: string | null
          registration_number?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          auth_user_id?: string | null
          class?: string | null
          created_at?: string | null
          curriculum?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          medical_conditions?: string | null
          nationality?: string | null
          parent_email?: string | null
          password_changed?: boolean | null
          password_hash?: string | null
          phone?: string | null
          registration_number?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      applications_with_programs: {
        Row: {
          about_student: string | null
          application_id: string | null
          class: string | null
          consent: boolean | null
          curriculum: string | null
          descriptive_program_code: string | null
          dob: string | null
          document_url: string | null
          first_name: string | null
          gender: string | null
          last_name: string | null
          nationality: string | null
          parent_contact: string | null
          parent_email: string | null
          parent_name: string | null
          program_description: string | null
          program_id: string | null
          program_name: string | null
          registration_number: string | null
          status: string | null
          student_email: string | null
          submitted_at: string | null
          temporary_password: string | null
          updated_at: string | null
          user_full_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers_with_users: {
        Row: {
          auth_user_id: string | null
          bio: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          last_name: string | null
          phone: string | null
          program_description: string | null
          program_id: string | null
          program_name: string | null
          role: string | null
          status: string | null
          teacher_created_at: string | null
          teacher_id: string | null
          user_created_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_teachers_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_registration_sequence: {
        Args: { p_program_code: string; p_year_month: string }
        Returns: number
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
