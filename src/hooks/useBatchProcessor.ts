import { useState, useCallback, useRef, useEffect } from 'react';
import { ImageItem } from '../components/MultiImageUpload';
import { WineFormData } from '../types';
import { extractWineFromImage } from '../utils';

export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error';

export interface ProcessingItem {
  id: string;
  image: ImageItem;
  status: ProcessingStatus;
  result?: Partial<WineFormData>;
  error?: string;
}

interface UseBatchProcessorReturn {
  items: ProcessingItem[];
  isProcessing: boolean;
  currentIndex: number;
  successCount: number;
  errorCount: number;
  startProcessing: (images: ImageItem[]) => void;
  cancelProcessing: () => void;
  removeItem: (id: string) => void;
  retryItem: (id: string) => void;
  reset: () => void;
}

export function useBatchProcessor(): UseBatchProcessorReturn {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shouldProcess, setShouldProcess] = useState(false);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
    };
  }, []);

  const processImage = async (item: ProcessingItem): Promise<ProcessingItem> => {
    try {
      const data = await extractWineFromImage(item.image.base64, item.image.mimeType);

      const formData: Partial<WineFormData> = {
        producer: data.producer,
        wineName: data.wineName,
        vintage: data.vintage,
        region: data.region,
        subRegion: data.subRegion,
        country: data.country,
        appellation: data.appellation,
        varietals: data.varietals,
        wineColor: data.wineColor,
        alcoholContent: data.alcoholContent,
        labelImageBase64: item.image.base64,
        purchasePrice: data.estimatedPrice,
        estimatedValue: data.estimatedPrice,
        drinkingWindowStart: data.drinkingWindowStart,
        drinkingWindowEnd: data.drinkingWindowEnd,
        pairingSuggestions: data.pairingSuggestions || [],
        story: data.story,
      };

      return {
        ...item,
        status: 'success',
        result: formData,
      };
    } catch (err) {
      return {
        ...item,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to process image',
      };
    }
  };

  // Process queue when shouldProcess changes and items are ready
  useEffect(() => {
    if (!shouldProcess || items.length === 0) return;

    const processQueue = async () => {
      if (!mountedRef.current) return;

      setIsProcessing(true);
      cancelledRef.current = false;

      for (let i = 0; i < items.length; i++) {
        if (cancelledRef.current || !mountedRef.current) break;

        const item = items[i];
        if (item.status !== 'pending') continue;

        setCurrentIndex(i);

        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'processing' as ProcessingStatus } : p
          )
        );

        const result = await processImage(item);

        if (cancelledRef.current || !mountedRef.current) break;

        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? result : p))
        );
      }

      if (mountedRef.current) {
        setIsProcessing(false);
        setCurrentIndex(-1);
        setShouldProcess(false);
      }
    };

    processQueue();
  }, [shouldProcess, items.length]); // Only trigger when shouldProcess is set or items array length changes initially

  const startProcessing = useCallback((images: ImageItem[]) => {
    const processingItems: ProcessingItem[] = images.map((image) => ({
      id: image.id,
      image,
      status: 'pending' as ProcessingStatus,
    }));

    cancelledRef.current = false;
    setItems(processingItems);
    setCurrentIndex(0);
    setShouldProcess(true); // Trigger processing via useEffect
  }, []);

  const cancelProcessing = useCallback(() => {
    cancelledRef.current = true;
    setIsProcessing(false);
    setCurrentIndex(-1);
    setShouldProcess(false);

    setItems((prev) =>
      prev.map((item) =>
        item.status === 'processing' ? { ...item, status: 'pending' as ProcessingStatus } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const retryItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item || item.status !== 'error') return prev;
      return prev.map((p) =>
        p.id === id ? { ...p, status: 'processing' as ProcessingStatus, error: undefined } : p
      );
    });

    // Find the item and process it
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const result = await processImage({ ...item, status: 'processing', error: undefined });

    if (mountedRef.current) {
      setItems((prev) =>
        prev.map((p) => (p.id === id ? result : p))
      );
    }
  }, [items]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setItems([]);
    setIsProcessing(false);
    setCurrentIndex(-1);
    setShouldProcess(false);
  }, []);

  const successCount = items.filter((item) => item.status === 'success').length;
  const errorCount = items.filter((item) => item.status === 'error').length;

  return {
    items,
    isProcessing,
    currentIndex,
    successCount,
    errorCount,
    startProcessing,
    cancelProcessing,
    removeItem,
    retryItem,
    reset,
  };
}
