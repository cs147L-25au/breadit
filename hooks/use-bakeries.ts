import { useCallback, useEffect, useState } from 'react';

import { BakeryWithReviews, ReviewWithProfile } from '../lib/database.types';
import { supabase } from '../lib/supabase';

export function useBakeries() {
  const [bakeries, setBakeries] = useState<BakeryWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBakeries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: bakeriesData, error: bakeriesError } = await supabase
        .from('bakeries')
        .select(`
          *,
          reviews (
            *,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (bakeriesError) throw bakeriesError;

      const bakeriesWithRatings: BakeryWithReviews[] = (bakeriesData || []).map((bakery: any) => {
        const reviews = (bakery.reviews || []) as ReviewWithProfile[];
        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + Number(r.rating_overall), 0) / reviews.length
            : 0;

        return {
          id: bakery.id,
          name: bakery.name,
          address: bakery.address,
          latitude: bakery.latitude,
          longitude: bakery.longitude,
          google_place_id: bakery.google_place_id,
          created_at: bakery.created_at,
          reviews,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      });

      setBakeries(bakeriesWithRatings);
    } catch (err) {
      console.log('ERROR FETCHING BAKERIES', err);
      setError('Failed to load bakeries. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBakeries();
  }, [fetchBakeries]);

  return {
    bakeries,
    loading,
    error,
    refetch: fetchBakeries,
  };
}

