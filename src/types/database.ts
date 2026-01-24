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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      wines: {
        Row: {
          id: string;
          user_id: string;
          producer: string;
          wine_name: string;
          vintage: number | null;
          region: string;
          sub_region: string | null;
          country: string;
          appellation: string | null;
          varietals: Json;
          wine_color: string;
          alcohol_content: number | null;
          purchase_date: string | null;
          purchase_price: number | null;
          purchased_from: string | null;
          estimated_value: number | null;
          quantity: number;
          storage_location: string | null;
          bottle_condition: string;
          tasting_notes: Json;
          drinking_window_start: number | null;
          drinking_window_end: number | null;
          drinking_status: string;
          pairing_suggestions: string[];
          personal_rating: number | null;
          is_open: boolean;
          why_purchased: string | null;
          provenance: string | null;
          story: string | null;
          label_image_url: string | null;
          created_at: string;
          updated_at: string;
          consumption_history: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          producer: string;
          wine_name: string;
          vintage?: number | null;
          region: string;
          sub_region?: string | null;
          country: string;
          appellation?: string | null;
          varietals?: Json;
          wine_color: string;
          alcohol_content?: number | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          purchased_from?: string | null;
          estimated_value?: number | null;
          quantity?: number;
          storage_location?: string | null;
          bottle_condition?: string;
          tasting_notes?: Json;
          drinking_window_start?: number | null;
          drinking_window_end?: number | null;
          drinking_status?: string;
          pairing_suggestions?: string[];
          personal_rating?: number | null;
          is_open?: boolean;
          why_purchased?: string | null;
          provenance?: string | null;
          story?: string | null;
          label_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          consumption_history?: Json;
        };
        Update: {
          producer?: string;
          wine_name?: string;
          vintage?: number | null;
          region?: string;
          sub_region?: string | null;
          country?: string;
          appellation?: string | null;
          varietals?: Json;
          wine_color?: string;
          alcohol_content?: number | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          purchased_from?: string | null;
          estimated_value?: number | null;
          quantity?: number;
          storage_location?: string | null;
          bottle_condition?: string;
          tasting_notes?: Json;
          drinking_window_start?: number | null;
          drinking_window_end?: number | null;
          drinking_status?: string;
          pairing_suggestions?: string[];
          personal_rating?: number | null;
          is_open?: boolean;
          why_purchased?: string | null;
          provenance?: string | null;
          story?: string | null;
          label_image_url?: string | null;
          updated_at?: string;
          consumption_history?: Json;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          wine_recommendations: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          wine_recommendations?: string[] | null;
          created_at?: string;
        };
        Update: {
          role?: string;
          content?: string;
          wine_recommendations?: string[] | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
