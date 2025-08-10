export interface Database {
  public: {
    Tables: {
      live_classes: {
        Row: {
          id: string;
          level_id: string;
          subject_id: string;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          level_id: string;
          subject_id: string;
          start_time: string;
          end_time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          level_id?: string;
          subject_id?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      levels: {
        Row: {
          level_id: string;
          program_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          level_id?: string;
          program_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          level_id?: string;
          program_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          subject_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          subject_id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subject_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      programs: {
        Row: {
          program_id: string;
          name: string;
          description: string | null;
          duration_years: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          program_id?: string;
          name: string;
          description?: string | null;
          duration_years?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          program_id?: string;
          name?: string;
          description?: string | null;
          duration_years?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      resources: {
        Row: {
          resource_id: string;
          title: string;
          description: string | null;
          url: string | null;
          program_id: string | null;
          level_id: string | null;
          subject_id: string | null;
          paper_id: string | null;
          type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          resource_id?: string;
          title: string;
          description?: string | null;
          url?: string | null;
          program_id?: string | null;
          level_id?: string | null;
          subject_id?: string | null;
          paper_id?: string | null;
          type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          resource_id?: string;
          title?: string;
          description?: string | null;
          url?: string | null;
          program_id?: string | null;
          level_id?: string | null;
          subject_id?: string | null;
          paper_id?: string | null;
          type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];