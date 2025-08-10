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
      // ... other tables remain the same ...
      live_classes: {
        Row: {
          academic_year: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          level_id: string | null
          live_class_id: string
          max_participants: number | null
          meeting_link: string | null
          meeting_platform: string | null
          scheduled_date: string | null
          start_time: string | null
          status: string | null
          subject_id: string | null
          teacher_id: string | null
          title: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          level_id?: string | null
          live_class_id?: string
          max_participants?: number | null
          meeting_link?: string | null
          meeting_platform?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          title?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          level_id?: string | null
          live_class_id?: string
          max_participants?: number | null
          meeting_link?: string | null
          meeting_platform?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_classes_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "live_classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "live_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
    }
  }
}