export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'user' | 'business_owner' | 'admin' | 'super_admin'
          phone: string | null
          bio: string | null
          preferences: Json
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'user' | 'business_owner' | 'admin' | 'super_admin'
          phone?: string | null
          bio?: string | null
          preferences?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'user' | 'business_owner' | 'admin' | 'super_admin'
          phone?: string | null
          bio?: string | null
          preferences?: Json
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string | null
          category_id: string | null
          name: string
          slug: string
          description: string | null
          short_description: string | null
          address: string
          city: string
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          website: string | null
          social_links: Json
          status: 'pending' | 'active' | 'suspended' | 'rejected'
          subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise'
          is_featured: boolean
          is_verified: boolean
          rating: number
          review_count: number
          view_count: number
          contact_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          category_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          address: string
          city: string
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          social_links?: Json
          status?: 'pending' | 'active' | 'suspended' | 'rejected'
          subscription_plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          is_featured?: boolean
          is_verified?: boolean
          rating?: number
          review_count?: number
          view_count?: number
          contact_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          category_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          address?: string
          city?: string
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          social_links?: Json
          status?: 'pending' | 'active' | 'suspended' | 'rejected'
          subscription_plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          is_featured?: boolean
          is_verified?: boolean
          rating?: number
          review_count?: number
          view_count?: number
          contact_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      business_hours: {
        Row: {
          id: string
          business_id: string
          day_of_week: number
          open_time: string | null
          close_time: string | null
          is_closed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          day_of_week: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          day_of_week?: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
          created_at?: string
        }
      }
      business_images: {
        Row: {
          id: string
          business_id: string
          url: string
          alt_text: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          url: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          url?: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          user_id: string
          rating: number
          title: string | null
          comment: string | null
          status: 'pending' | 'approved' | 'rejected' | 'flagged'
          is_verified: boolean
          helpful_count: number
          report_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          rating: number
          title?: string | null
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'flagged'
          is_verified?: boolean
          helpful_count?: number
          report_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'flagged'
          is_verified?: boolean
          helpful_count?: number
          report_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          created_at?: string
        }
      }
      contact_requests: {
        Row: {
          id: string
          business_id: string
          user_id: string
          type: 'info' | 'booking' | 'quote' | 'complaint'
          subject: string | null
          message: string
          contact_info: Json
          status: 'pending' | 'read' | 'replied' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          type?: 'info' | 'booking' | 'quote' | 'complaint'
          subject?: string | null
          message: string
          contact_info?: Json
          status?: 'pending' | 'read' | 'replied' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          type?: 'info' | 'booking' | 'quote' | 'complaint'
          subject?: string | null
          message?: string
          contact_info?: Json
          status?: 'pending' | 'read' | 'replied' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          discount_type: 'percentage' | 'fixed' | 'bogo' | 'other' | null
          discount_value: number | null
          terms: string | null
          is_active: boolean
          start_date: string | null
          end_date: string | null
          usage_limit: number | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed' | 'bogo' | 'other' | null
          discount_value?: number | null
          terms?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          usage_limit?: number | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed' | 'bogo' | 'other' | null
          discount_value?: number | null
          terms?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          usage_limit?: number | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}