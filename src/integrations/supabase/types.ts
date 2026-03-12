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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          message: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          type?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bases: {
        Row: {
          active: boolean
          base_type: string
          created_at: string
          day: number
          description: string | null
          id: string
          judge_user_id: string | null
          location: string | null
          name: string
          order_index: number
        }
        Insert: {
          active?: boolean
          base_type?: string
          created_at?: string
          day: number
          description?: string | null
          id?: string
          judge_user_id?: string | null
          location?: string | null
          name: string
          order_index?: number
        }
        Update: {
          active?: boolean
          base_type?: string
          created_at?: string
          day?: number
          description?: string | null
          id?: string
          judge_user_id?: string | null
          location?: string | null
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      bets: {
        Row: {
          amount: number
          created_at: string
          id: string
          matchup_id: string
          payout: number
          placed_by: string
          predicted_result: string
          status: string
          team_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          matchup_id: string
          payout?: number
          placed_by: string
          predicted_result: string
          status?: string
          team_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          matchup_id?: string
          payout?: number
          placed_by?: string
          predicted_result?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_matchup_id_fkey"
            columns: ["matchup_id"]
            isOneToOne: false
            referencedRelation: "matchups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          bonus_points: number
          created_at: string
          id: string
          matchup_id: string
          notes: string | null
          penalties: number
          result: string
          submitted_by: string | null
          team_a_points: number
          team_b_points: number
          updated_at: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          id?: string
          matchup_id: string
          notes?: string | null
          penalties?: number
          result: string
          submitted_by?: string | null
          team_a_points?: number
          team_b_points?: number
          updated_at?: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          id?: string
          matchup_id?: string
          notes?: string | null
          penalties?: number
          result?: string
          submitted_by?: string | null
          team_a_points?: number
          team_b_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_matchup_id_fkey"
            columns: ["matchup_id"]
            isOneToOne: true
            referencedRelation: "matchups"
            referencedColumns: ["id"]
          },
        ]
      }
      matchups: {
        Row: {
          base_id: string
          created_at: string
          id: string
          rotation_id: string
          status: string
          team_a_id: string
          team_b_id: string
        }
        Insert: {
          base_id: string
          created_at?: string
          id?: string
          rotation_id: string
          status?: string
          team_a_id: string
          team_b_id: string
        }
        Update: {
          base_id?: string
          created_at?: string
          id?: string
          rotation_id?: string
          status?: string
          team_a_id?: string
          team_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchups_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_rotation_id_fkey"
            columns: ["rotation_id"]
            isOneToOne: false
            referencedRelation: "rotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchups_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rotations: {
        Row: {
          created_at: string
          day: number
          id: string
          rotation_number: number
          status: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          rotation_number: number
          status?: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          rotation_number?: number
          status?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          betting_balance: number
          captain_user_id: string | null
          color: string
          created_at: string
          draws: number
          faculty: string | null
          id: string
          losses: number
          matches_played: number
          members_count: number
          name: string
          number: number
          status: string
          total_points: number
          updated_at: string
          wins: number
        }
        Insert: {
          betting_balance?: number
          captain_user_id?: string | null
          color?: string
          created_at?: string
          draws?: number
          faculty?: string | null
          id?: string
          losses?: number
          matches_played?: number
          members_count?: number
          name: string
          number: number
          status?: string
          total_points?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          betting_balance?: number
          captain_user_id?: string | null
          color?: string
          created_at?: string
          draws?: number
          faculty?: string | null
          id?: string
          losses?: number
          matches_played?: number
          members_count?: number
          name?: string
          number?: number
          status?: string
          total_points?: number
          updated_at?: string
          wins?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "captain" | "viewer" | "judge"
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
    Enums: {
      app_role: ["admin", "captain", "viewer", "judge"],
    },
  },
} as const
