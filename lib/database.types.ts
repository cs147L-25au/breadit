export type BreadType = 
  | 'sourdough'
  | 'baguette'
  | 'croissant'
  | 'brioche'
  | 'ciabatta'
  | 'focaccia'
  | 'rye'
  | 'whole_wheat'
  | 'other';

export interface Database {
  public: {
    Tables: {
      bakeries: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          google_place_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          google_place_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          google_place_id?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          bakery_id: string;
          bread_type: BreadType;
          image_url: string | null;
          rating_overall: number;
          rating_crust: number;
          rating_crumb: number;
          rating_flavor: number;
          review_text: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bakery_id: string;
          bread_type: BreadType;
          image_url?: string | null;
          rating_overall: number;
          rating_crust: number;
          rating_crumb: number;
          rating_flavor: number;
          review_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bakery_id?: string;
          bread_type?: BreadType;
          image_url?: string | null;
          rating_overall?: number;
          rating_crust?: number;
          rating_crumb?: number;
          rating_flavor?: number;
          review_text?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      bread_type: BreadType;
    };
  };
}

// Helper types for easier usage
export type Bakery = Database['public']['Tables']['bakeries']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];

// Extended types with relations
export type ReviewWithProfile = Review & {
  profiles: Pick<Profile, 'username' | 'avatar_url'> | null;
};

export type BakeryWithReviews = Bakery & {
  reviews: ReviewWithProfile[];
  averageRating: number;
};

