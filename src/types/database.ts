export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category_id: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          hours: Json | null
          id: string
          is_claimed: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          slug: string
          state: string | null
          total_ratings: number | null
          updated_at: string | null
          website: string | null
          entity_id: string | null
          follower_count: number | null
          following_count: number | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          hours?: Json | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          slug: string
          state?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          website?: string | null
          entity_id?: string | null
          follower_count?: number | null
          following_count?: number | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          hours?: Json | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          slug?: string
          state?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          website?: string | null
          entity_id?: string | null
          follower_count?: number | null
          following_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claims: {
        Row: {
          id: string
          business_id: string
          user_id: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          review_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'manager'
          invited_by: string | null
          status: 'pending' | 'active' | 'removed'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role: 'owner' | 'manager'
          invited_by?: string | null
          status?: 'pending' | 'active' | 'removed'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: 'owner' | 'manager'
          invited_by?: string | null
          status?: 'pending' | 'active' | 'removed'
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_follows: {
        Row: {
          id: string
          business_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          id: string
          type: 'user' | 'business'
          created_at: string | null
        }
        Insert: {
          id: string
          type: 'user' | 'business'
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: 'user' | 'business'
          created_at?: string | null
        }
        Relationships: []
      }
      entity_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          attribute_schema: Json | null
          created_at: string | null
          default_product_category_id: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          type: string
        }
        Insert: {
          attribute_schema?: Json | null
          created_at?: string | null
          default_product_category_id?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          type: string
        }
        Update: {
          attribute_schema?: Json | null
          created_at?: string | null
          default_product_category_id?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          id: string
          is_available: boolean | null
          notes: string | null
          price: number | null
          product_id: string
          section_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_available?: boolean | null
          notes?: string | null
          price?: number | null
          product_id: string
          section_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_available?: boolean | null
          notes?: string | null
          price?: number | null
          product_id?: string
          section_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "menu_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_sections: {
        Row: {
          description: string | null
          id: string
          menu_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          menu_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          menu_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_sections_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          actor_entity_id: string | null
          business_id: string | null
          created_at: string | null
          id: string
          rating_id: string | null
          read: boolean | null
          type: 'follow' | 'like' | 'comment' | 'claim_approved' | 'claim_rejected' | 'business_follow' | 'manager_invite' | 'manager_added' | 'manager_removed' | 'ownership_transfer'
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_entity_id?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          rating_id?: string | null
          read?: boolean | null
          type: 'follow' | 'like' | 'comment' | 'claim_approved' | 'claim_rejected' | 'business_follow' | 'manager_invite' | 'manager_added' | 'manager_removed' | 'ownership_transfer'
          user_id: string
        }
        Update: {
          actor_id?: string | null
          actor_entity_id?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          rating_id?: string | null
          read?: boolean | null
          type?: 'follow' | 'like' | 'comment' | 'claim_approved' | 'claim_rejected' | 'business_follow' | 'manager_invite' | 'manager_added' | 'manager_removed' | 'ownership_transfer'
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_entity_id_fkey"
            columns: ["actor_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          average_rating: number | null
          business_id: string
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          photo_url: string | null
          slug: string
          total_ratings: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          average_rating?: number | null
          business_id: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          photo_url?: string | null
          slug: string
          total_ratings?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          average_rating?: number | null
          business_id?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          photo_url?: string | null
          slug?: string
          total_ratings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          entity_id: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          is_admin: boolean | null
          is_business_owner: boolean | null
          onboarding_completed: boolean | null
          onboarding_skipped: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          entity_id?: string | null
          follower_count?: number | null
          following_count?: number | null
          id: string
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          entity_id?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_admin?: boolean | null
          is_business_owner?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          rating_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          rating_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          rating_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_comments_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_likes: {
        Row: {
          created_at: string | null
          id: string
          rating_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_likes_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_photos: {
        Row: {
          created_at: string | null
          id: string
          rating_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_photos_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          comment_count: number | null
          created_at: string | null
          id: string
          like_count: number | null
          location_name: string | null
          product_id: string
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          comment_count?: number | null
          created_at?: string | null
          id?: string
          like_count?: number | null
          location_name?: string | null
          product_id: string
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          comment_count?: number | null
          created_at?: string | null
          id?: string
          like_count?: number | null
          location_name?: string | null
          product_id?: string
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
