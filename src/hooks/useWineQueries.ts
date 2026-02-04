import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Wine, WineFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 20;

// Helper to convert DB row to Wine type
function dbRowToWine(row: any): Wine {
  return {
    id: row.id,
    producer: row.producer,
    wineName: row.wine_name,
    vintage: row.vintage,
    region: row.region,
    subRegion: row.sub_region,
    country: row.country,
    appellation: row.appellation,
    varietals: row.varietals || [],
    wineColor: row.wine_color,
    alcoholContent: row.alcohol_content,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price,
    purchasedFrom: row.purchased_from,
    estimatedValue: row.estimated_value,
    quantity: row.quantity,
    storageLocation: row.storage_location,
    bottleCondition: row.bottle_condition || 'unknown',
    labelCondition: undefined,
    capsuleCondition: undefined,
    tastingNotes: row.tasting_notes || [],
    drinkingWindowStart: row.drinking_window_start,
    drinkingWindowEnd: row.drinking_window_end,
    drinkingStatus: row.drinking_status || 'unknown',
    pairingSuggestions: row.pairing_suggestions || [],
    personalRating: row.personal_rating,
    isOpen: row.is_open || false,
    whyPurchased: row.why_purchased,
    provenance: row.provenance,
    story: row.story,
    labelImageUrl: row.label_image_url,
    labelImageBase64: row.label_image_url,
    labelImageStoragePath: row.label_image_storage_path,
    dateAdded: row.created_at,
    dateModified: row.updated_at,
    consumptionHistory: row.consumption_history || [],
  };
}

// Helper to convert Wine to DB format for insert/update
function wineToDbRow(wine: Partial<Wine> & { id?: string }, userId: string) {
  return {
    user_id: userId,
    producer: wine.producer,
    wine_name: wine.wineName,
    vintage: wine.vintage,
    region: wine.region,
    sub_region: wine.subRegion || null,
    country: wine.country,
    appellation: wine.appellation || null,
    varietals: wine.varietals,
    wine_color: wine.wineColor,
    alcohol_content: wine.alcoholContent || null,
    purchase_date: wine.purchaseDate || null,
    purchase_price: wine.purchasePrice || null,
    purchased_from: wine.purchasedFrom || null,
    estimated_value: wine.estimatedValue || null,
    quantity: wine.quantity,
    storage_location: wine.storageLocation || null,
    bottle_condition: wine.bottleCondition || 'unknown',
    tasting_notes: wine.tastingNotes || [],
    drinking_window_start: wine.drinkingWindowStart || null,
    drinking_window_end: wine.drinkingWindowEnd || null,
    drinking_status: wine.drinkingStatus || 'unknown',
    pairing_suggestions: wine.pairingSuggestions || [],
    personal_rating: wine.personalRating || null,
    is_open: wine.isOpen || false,
    why_purchased: wine.whyPurchased || null,
    provenance: wine.provenance || null,
    story: wine.story || null,
    label_image_url: wine.labelImageBase64 || wine.labelImageUrl || null,
    consumption_history: wine.consumptionHistory || [],
  };
}

// Columns to fetch for list view (excludes large image data, but includes storage path)
const LIST_COLUMNS = `
  id, user_id, producer, wine_name, vintage, region, sub_region, country,
  appellation, varietals, wine_color, alcohol_content, purchase_date,
  purchase_price, purchased_from, estimated_value, quantity,
  storage_location, bottle_condition, tasting_notes, drinking_window_start,
  drinking_window_end, drinking_status, pairing_suggestions, personal_rating,
  is_open, why_purchased, provenance, story, consumption_history,
  created_at, updated_at, label_image_storage_path
`;

/**
 * Infinite scroll hook for wine list - fetches wines in pages
 */
export function useWineList() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['wines', 'list', user?.id],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('wines')
        .select(LIST_COLUMNS, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const wines = (data || []).map(dbRowToWine);
      const lastWine = wines[wines.length - 1];

      return {
        wines,
        nextCursor: wines.length === PAGE_SIZE ? lastWine?.dateAdded : null,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage: { wines: Wine[]; nextCursor: string | null; totalCount: number }) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: !!user,
  });
}

/**
 * Hook to get all wines as a flat array (from paginated data)
 */
export function useAllWines() {
  const query = useWineList();
  const allWines = query.data?.pages.flatMap((page: { wines: Wine[]; nextCursor: string | null; totalCount: number }) => page.wines) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return {
    ...query,
    wines: allWines,
    totalCount,
  };
}

/**
 * Hook to fetch a single wine with full data (including image)
 */
export function useWineDetail(wineId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wines', 'detail', wineId],
    queryFn: async () => {
      if (!wineId || !user) throw new Error('Missing wineId or user');

      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', wineId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return dbRowToWine(data);
    },
    enabled: !!wineId && !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

/**
 * Hook to add a new wine
 */
export function useAddWine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: WineFormData) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        user_id: user.id,
        producer: formData.producer,
        wine_name: formData.wineName,
        vintage: formData.vintage,
        region: formData.region,
        sub_region: formData.subRegion || null,
        country: formData.country,
        appellation: formData.appellation || null,
        varietals: formData.varietals,
        wine_color: formData.wineColor,
        alcohol_content: formData.alcoholContent || null,
        purchase_date: formData.purchaseDate || null,
        purchase_price: formData.purchasePrice || null,
        purchased_from: formData.purchasedFrom || null,
        quantity: formData.quantity,
        storage_location: formData.storageLocation || null,
        drinking_window_start: formData.drinkingWindowStart || null,
        drinking_window_end: formData.drinkingWindowEnd || null,
        why_purchased: formData.whyPurchased || null,
        pairing_suggestions: formData.pairingSuggestions || [],
        label_image_url: formData.labelImageBase64 || null,
        story: formData.story || null,
      };

      const { data, error } = await supabase
        .from('wines')
        .insert(insertData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return dbRowToWine(data);
    },
    onSuccess: () => {
      // Invalidate wine list to refetch
      queryClient.invalidateQueries({ queryKey: ['wines', 'list'] });
    },
  });
}

/**
 * Hook to add multiple wines at once
 */
export function useAddWines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formDataArray: WineFormData[]) => {
      if (!user) throw new Error('Not authenticated');
      if (formDataArray.length === 0) return [];

      const insertData = formDataArray.map(formData => ({
        user_id: user.id,
        producer: formData.producer,
        wine_name: formData.wineName,
        vintage: formData.vintage,
        region: formData.region,
        sub_region: formData.subRegion || null,
        country: formData.country,
        appellation: formData.appellation || null,
        varietals: formData.varietals,
        wine_color: formData.wineColor,
        alcohol_content: formData.alcoholContent || null,
        purchase_date: formData.purchaseDate || null,
        purchase_price: formData.purchasePrice || null,
        purchased_from: formData.purchasedFrom || null,
        quantity: formData.quantity,
        storage_location: formData.storageLocation || null,
        drinking_window_start: formData.drinkingWindowStart || null,
        drinking_window_end: formData.drinkingWindowEnd || null,
        why_purchased: formData.whyPurchased || null,
        pairing_suggestions: formData.pairingSuggestions || [],
        label_image_url: formData.labelImageBase64 || null,
      }));

      const { data, error } = await supabase
        .from('wines')
        .insert(insertData)
        .select();

      if (error) throw new Error(error.message);
      return (data || []).map(dbRowToWine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines', 'list'] });
    },
  });
}

/**
 * Hook to update a wine with optimistic updates
 */
export function useUpdateWine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wine: Wine) => {
      if (!user) throw new Error('Not authenticated');

      const updateData = wineToDbRow(wine, user.id);
      delete (updateData as any).user_id; // Don't update user_id

      const { error } = await supabase
        .from('wines')
        .update(updateData)
        .eq('id', wine.id)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return wine;
    },
    onMutate: async (newWine: Wine) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wines'] });

      // Snapshot the previous value
      const previousWine = queryClient.getQueryData(['wines', 'detail', newWine.id]);

      // Optimistically update the detail cache
      queryClient.setQueryData(['wines', 'detail', newWine.id], newWine);

      return { previousWine };
    },
    onError: (_err: unknown, newWine: Wine, context: { previousWine: Wine | undefined } | undefined) => {
      // Rollback on error
      if (context?.previousWine) {
        queryClient.setQueryData(['wines', 'detail', newWine.id], context.previousWine);
      }
    },
    onSettled: () => {
      // Refetch wine list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wines', 'list'] });
    },
  });
}

/**
 * Hook to delete a wine with optimistic removal
 */
export function useDeleteWine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wineId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wines')
        .delete()
        .eq('id', wineId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return wineId;
    },
    onSuccess: (wineId: string) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: ['wines', 'detail', wineId] });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['wines', 'list'] });
    },
  });
}

/**
 * Hook to refresh/refetch all wine data
 */
export function useRefreshWines() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['wines'] });
  };
}
