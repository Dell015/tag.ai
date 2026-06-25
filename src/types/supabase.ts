/**
 * Supabase database type definitions for Tag.ai
 * These types mirror the PostgreSQL schema defined in the database migrations.
 * In production, these would be auto-generated via `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          coin_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          coin_balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string | null;
          coin_balance?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          deck_id: string | null;
          user_id: string | null;
          text: string;
          card_type: Database['public']['Enums']['card_type'];
          intensity: number;
          category: Database['public']['Enums']['card_category'];
          topics: string[];
          audience_type: string | null;
          is_curated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id?: string | null;
          user_id?: string | null;
          text: string;
          card_type: Database['public']['Enums']['card_type'];
          intensity: number;
          category: Database['public']['Enums']['card_category'];
          topics?: string[];
          audience_type?: string | null;
          is_curated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck_id?: string | null;
          user_id?: string | null;
          text?: string;
          card_type?: Database['public']['Enums']['card_type'];
          intensity?: number;
          category?: Database['public']['Enums']['card_category'];
          topics?: string[];
          audience_type?: string | null;
          is_curated?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cards_deck_id_fkey';
            columns: ['deck_id'];
            isOneToOne: false;
            referencedRelation: 'decks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          host_id: string;
          room_code: string;
          status: Database['public']['Enums']['session_status'];
          game_mode: Database['public']['Enums']['game_mode_type'] | null;
          heat_level: number;
          card_count_target: number;
          cards_played: number;
          comfort_filters: string[];
          drink_rule_template: string | null;
          custom_drink_rules: string[];
          non_drinking_mode: boolean;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          host_id: string;
          room_code: string;
          status?: Database['public']['Enums']['session_status'];
          game_mode?: Database['public']['Enums']['game_mode_type'] | null;
          heat_level?: number;
          card_count_target: number;
          cards_played?: number;
          comfort_filters?: string[];
          drink_rule_template?: string | null;
          custom_drink_rules?: string[];
          non_drinking_mode?: boolean;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          host_id?: string;
          room_code?: string;
          status?: Database['public']['Enums']['session_status'];
          game_mode?: Database['public']['Enums']['game_mode_type'] | null;
          heat_level?: number;
          card_count_target?: number;
          cards_played?: number;
          comfort_filters?: string[];
          drink_rule_template?: string | null;
          custom_drink_rules?: string[];
          non_drinking_mode?: boolean;
          created_at?: string;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_host_id_fkey';
            columns: ['host_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      session_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          display_name: string;
          turn_order: number;
          agreed_to_rules: boolean;
          joined_at: string;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          display_name: string;
          turn_order: number;
          agreed_to_rules?: boolean;
          joined_at?: string;
          removed_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          display_name?: string;
          turn_order?: number;
          agreed_to_rules?: boolean;
          joined_at?: string;
          removed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'session_players_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_players_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_trashed_cards: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          trashed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          trashed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          trashed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_trashed_cards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_trashed_cards_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          }
        ];
      };
      saved_cards: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          saved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_cards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_cards_card_id_fkey';
            columns: ['card_id'];
            isOneToOne: false;
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
    Enums: {
      card_category:
        | 'hot_takes'
        | 'relationships'
        | 'memories'
        | 'confessions'
        | 'dares'
        | 'hypotheticals'
        | 'controversial'
        | 'roasts'
        | 'deep_philosophical';
      card_type: 'question' | 'action' | 'wild';
      session_status: 'lobby' | 'active' | 'ended';
      game_mode_type: 'icebreaker' | 'barkada' | 'lovers' | 'spicy' | 'chaos' | 'family';
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {};
  };
};

/** Helper type for accessing table rows */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Helper type for inserting into tables */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Helper type for updating tables */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** Helper type for accessing enums */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
