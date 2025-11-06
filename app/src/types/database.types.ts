/**
 * Database Types
 * Supabase database schema types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          is_active: boolean;
          phone: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          is_active?: boolean;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          user_role: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          resource_name: string | null;
          description: string;
          changes: Json | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          request_method: string | null;
          request_path: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email: string;
          user_role: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          resource_name?: string | null;
          description: string;
          changes?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_method?: string | null;
          request_path?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          user_role?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          resource_name?: string | null;
          description?: string;
          changes?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_method?: string | null;
          request_path?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          rate_per_day: number;
          amenities: Json;
          description: string | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          capacity: number;
          rate_per_day: number;
          amenities?: Json;
          description?: string | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          capacity?: number;
          rate_per_day?: number;
          amenities?: Json;
          description?: string | null;
          is_available?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_name: string;
          contact_person: string;
          email: string;
          phone: string;
          address: string | null;
          city: string | null;
          country: string;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          organization_name: string;
          contact_person: string;
          email: string;
          phone: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          organization_name?: string;
          contact_person?: string;
          email?: string;
          phone?: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          client_id: string;
          room_id: string;
          event_type_id: string;
          event_name: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          status: string;
          number_of_attendees: number | null;
          total_amount: number;
          discount_amount: number;
          final_amount: number;
          currency: string;
          notes: string | null;
          special_requirements: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          booking_number?: string;
          client_id: string;
          room_id: string;
          event_type_id: string;
          event_name: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          status?: string;
          number_of_attendees?: number | null;
          total_amount: number;
          discount_amount?: number;
          final_amount: number;
          currency?: string;
          notes?: string | null;
          special_requirements?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          booking_number?: string;
          client_id?: string;
          room_id?: string;
          event_type_id?: string;
          event_name?: string;
          start_date?: string;
          end_date?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          number_of_attendees?: number | null;
          total_amount?: number;
          discount_amount?: number;
          final_amount?: number;
          currency?: string;
          notes?: string | null;
          special_requirements?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      event_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      addons: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          rate: number;
          unit: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          rate: number;
          unit: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          rate?: number;
          unit?: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      booking_addons: {
        Row: {
          id: string;
          booking_id: string;
          addon_id: string;
          quantity: number;
          rate: number;
          subtotal: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          addon_id: string;
          quantity: number;
          rate: number;
          subtotal: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          addon_id?: string;
          quantity?: number;
          rate?: number;
          subtotal?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      auth_activity_log: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          action: string;
          success: boolean;
          ip_address: string | null;
          user_agent: string | null;
          failure_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          action: string;
          success?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          failure_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          action?: string;
          success?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          failure_reason?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          booking_id: string;
          document_type: string;
          document_number: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          document_type: string;
          document_number: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type: string;
          generated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          document_type?: string;
          document_number?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string;
          generated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_booking_conflict: {
        Args: {
          p_room_id: string;
          p_start_date: string;
          p_end_date: string;
          p_start_time: string;
          p_end_time: string;
          p_exclude_booking_id?: string | null;
        };
        Returns: {
          has_conflict: boolean;
          conflicting_booking_id: string | null;
          conflicting_booking_number: string | null;
          conflicting_event_name: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
