import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Wine, WineFormData } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WineContextType {
  wines: Wine[];
  isLoading: boolean;
  addWine: (formData: WineFormData) => Promise<Wine>;
  updateWine: (wine: Wine) => Promise<void>;
  deleteWine: (wineId: string) => Promise<void>;
  getWine: (wineId: string) => Wine | undefined;
  refreshWines: () => Promise<void>;
}

const WineContext = createContext<WineContextType | null>(null);

function formDataToWineInsert(formData: WineFormData, userId: string) {
  return {
    user_id: userId,
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
  };
}

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
    isOpen: row.is_open,
    whyPurchased: row.why_purchased,
    provenance: row.provenance,
    story: row.story,
    labelImageUrl: row.label_image_url,
    labelImageBase64: row.label_image_url,
    dateAdded: row.created_at,
    dateModified: row.updated_at,
    consumptionHistory: row.consumption_history || [],
  };
}

export function WineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWines = useCallback(async () => {
    if (!user) {
      setWines([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wines:', error);
    } else {
      setWines((data || []).map(dbRowToWine));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshWines();
  }, [refreshWines]);

  const addWine = useCallback(async (formData: WineFormData): Promise<Wine> => {
    if (!user) throw new Error('Must be logged in to add wine');

    const insertData = formDataToWineInsert(formData, user.id);
    const { data, error } = await supabase
      .from('wines')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const wine = dbRowToWine(data);
    setWines((prev: Wine[]) => [wine, ...prev]);
    return wine;
  }, [user]);

  const updateWine = useCallback(async (wine: Wine) => {
    if (!user) throw new Error('Must be logged in to update wine');

    const { error } = await supabase
      .from('wines')
      .update({
        producer: wine.producer,
        wine_name: wine.wineName,
        vintage: wine.vintage,
        region: wine.region,
        sub_region: wine.subRegion,
        country: wine.country,
        appellation: wine.appellation,
        varietals: wine.varietals,
        wine_color: wine.wineColor,
        alcohol_content: wine.alcoholContent,
        purchase_date: wine.purchaseDate,
        purchase_price: wine.purchasePrice,
        purchased_from: wine.purchasedFrom,
        estimated_value: wine.estimatedValue,
        quantity: wine.quantity,
        storage_location: wine.storageLocation,
        bottle_condition: wine.bottleCondition,
        tasting_notes: wine.tastingNotes,
        drinking_window_start: wine.drinkingWindowStart,
        drinking_window_end: wine.drinkingWindowEnd,
        drinking_status: wine.drinkingStatus,
        pairing_suggestions: wine.pairingSuggestions,
        personal_rating: wine.personalRating,
        is_open: wine.isOpen,
        why_purchased: wine.whyPurchased,
        provenance: wine.provenance,
        story: wine.story,
        label_image_url: wine.labelImageBase64 || wine.labelImageUrl,
        consumption_history: wine.consumptionHistory,
      })
      .eq('id', wine.id)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    setWines((prev: Wine[]) => prev.map((w: Wine) => w.id === wine.id ? wine : w));
  }, [user]);

  const deleteWine = useCallback(async (wineId: string) => {
    if (!user) throw new Error('Must be logged in to delete wine');

    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', wineId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    setWines((prev: Wine[]) => prev.filter((w: Wine) => w.id !== wineId));
  }, [user]);

  const getWine = useCallback((wineId: string): Wine | undefined => {
    return wines.find((w: Wine) => w.id === wineId);
  }, [wines]);

  return (
    <WineContext.Provider value={{ wines, isLoading, addWine, updateWine, deleteWine, getWine, refreshWines }}>
      {children}
    </WineContext.Provider>
  );
}

export function useWines() {
  const context = useContext(WineContext);
  if (!context) {
    throw new Error('useWines must be used within a WineProvider');
  }
  return context;
}
