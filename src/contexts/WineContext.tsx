import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Wine, WineFormData } from '../types';
import { storage, formDataToWine } from '../utils';

interface WineContextType {
  wines: Wine[];
  addWine: (formData: WineFormData) => Wine;
  updateWine: (wine: Wine) => void;
  deleteWine: (wineId: string) => void;
  getWine: (wineId: string) => Wine | undefined;
  refreshWines: () => void;
}

const WineContext = createContext<WineContextType | null>(null);

export function WineProvider({ children }: { children: React.ReactNode }) {
  const [wines, setWines] = useState<Wine[]>([]);

  useEffect(() => {
    setWines(storage.getWines());
  }, []);

  const addWine = useCallback((formData: WineFormData): Wine => {
    const wine = formDataToWine(formData);
    const updatedWines = storage.addWine(wine);
    setWines(updatedWines);
    return wine;
  }, []);

  const updateWine = useCallback((wine: Wine) => {
    const updatedWines = storage.updateWine(wine);
    setWines(updatedWines);
  }, []);

  const deleteWine = useCallback((wineId: string) => {
    const updatedWines = storage.deleteWine(wineId);
    setWines(updatedWines);
  }, []);

  const getWine = useCallback((wineId: string): Wine | undefined => {
    return wines.find(w => w.id === wineId);
  }, [wines]);

  const refreshWines = useCallback(() => {
    setWines(storage.getWines());
  }, []);

  return (
    <WineContext.Provider value={{ wines, addWine, updateWine, deleteWine, getWine, refreshWines }}>
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
