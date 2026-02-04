import { createContext, useContext, ReactNode } from 'react';
import { Wine, WineFormData } from '../types';
import {
  useAllWines,
  useAddWine,
  useAddWines,
  useUpdateWine,
  useDeleteWine,
  useRefreshWines,
  useWineDetail,
} from '../hooks/useWineQueries';

/**
 * WineContext - Simplified wrapper around React Query hooks
 *
 * This context provides a familiar API for components that still use useWines(),
 * but delegates all data fetching and caching to React Query hooks.
 *
 * For new components, prefer using the React Query hooks directly:
 * - useAllWines() for wine list
 * - useWineDetail(id) for single wine
 * - useAddWine() for adding wines
 * - useUpdateWine() for updating wines
 * - useDeleteWine() for deleting wines
 */

interface WineContextType {
  wines: Wine[];
  isLoading: boolean;
  addWine: (formData: WineFormData) => Promise<Wine>;
  addWines: (formDataArray: WineFormData[]) => Promise<Wine[]>;
  updateWine: (wine: Wine) => Promise<void>;
  deleteWine: (wineId: string) => Promise<void>;
  getWine: (wineId: string) => Wine | undefined;
  fetchWineWithImage: (wineId: string) => Promise<Wine | null>;
  refreshWines: () => void;
}

const WineContext = createContext<WineContextType | null>(null);

export function WineProvider({ children }: { children: ReactNode }) {
  // Use React Query hooks
  const { wines, isLoading } = useAllWines();
  const addWineMutation = useAddWine();
  const addWinesMutation = useAddWines();
  const updateWineMutation = useUpdateWine();
  const deleteWineMutation = useDeleteWine();
  const refreshWines = useRefreshWines();

  // Wrapper functions to maintain backward compatibility
  const addWine = async (formData: WineFormData): Promise<Wine> => {
    return addWineMutation.mutateAsync(formData);
  };

  const addWines = async (formDataArray: WineFormData[]): Promise<Wine[]> => {
    return addWinesMutation.mutateAsync(formDataArray);
  };

  const updateWine = async (wine: Wine): Promise<void> => {
    await updateWineMutation.mutateAsync(wine);
  };

  const deleteWine = async (wineId: string): Promise<void> => {
    await deleteWineMutation.mutateAsync(wineId);
  };

  const getWine = (wineId: string): Wine | undefined => {
    return wines.find((w: Wine) => w.id === wineId);
  };

  // For fetchWineWithImage, we return the wine from the list if available
  // The actual image fetching happens in useWineDetail hook
  const fetchWineWithImage = async (wineId: string): Promise<Wine | null> => {
    const wine = wines.find((w: Wine) => w.id === wineId);
    return wine || null;
  };

  return (
    <WineContext.Provider
      value={{
        wines,
        isLoading,
        addWine,
        addWines,
        updateWine,
        deleteWine,
        getWine,
        fetchWineWithImage,
        refreshWines,
      }}
    >
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

// Re-export React Query hooks for direct usage
export { useAllWines, useWineDetail, useAddWine, useUpdateWine, useDeleteWine, useRefreshWines };
