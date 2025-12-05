import { BreadType } from '../../lib/database.types';

export interface UserReview {
  id: string;
  bread_type: BreadType;
  rating_overall: number;
  rating_crust: number;
  rating_crumb: number;
  rating_flavor: number;
  review_text: string | null;
  image_url: string | null;
  created_at: string;
  bakeries: {
    id: string;
    name: string;
    address: string;
  };
}

export interface SavedPlace {
  id: number;
  created_at: string;
  bakeries: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export type SortOption = 'newest' | 'highest' | 'lowest';

export const BREAD_TYPES: (BreadType | 'all')[] = [
  'all',
  'sourdough',
  'baguette',
  'croissant',
  'brioche',
  'ciabatta',
  'focaccia',
  'rye',
  'whole_wheat',
  'other',
];

export function formatBreadType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

