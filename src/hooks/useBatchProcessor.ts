import { useState, useCallback, useRef } from 'react';
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
  const cancelledRef = useRef(false);

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

  const processQueue = useCallback(async (processingItems: ProcessingItem[]) => {
    setIsProcessing(true);
    cancelledRef.current = false;

    for (let i = 0; i < processingItems.length; i++) {
      if (cancelledRef.current) break;

      const item = processingItems[i];
      if (item.status !== 'pending') continue;

      setCurrentIndex(i);

      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: 'processing' as ProcessingStatus } : p
        )
      );

      const result = await processImage(item);

      if (cancelledRef.current) break;

      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? result : p))
      );
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
  }, []);

  const startProcessing = useCallback((images: ImageItem[]) => {
    const processingItems: ProcessingItem[] = images.map((image) => ({
      id: image.id,
      image,
      status: 'pending' as ProcessingStatus,
    }));

    setItems(processingItems);
    setCurrentIndex(0);
    processQueue(processingItems);
  }, [processQueue]);

  const cancelProcessing = useCallback(() => {
    cancelledRef.current = true;
    setIsProcessing(false);
    setCurrentIndex(-1);

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
    const item = items.find((i) => i.id === id);
    if (!item || item.status !== 'error') return;

    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'processing' as ProcessingStatus, error: undefined } : p
      )
    );

    const result = await processImage(item);

    setItems((prev) =>
      prev.map((p) => (p.id === id ? result : p))
    );
  }, [items]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setItems([]);
    setIsProcessing(false);
    setCurrentIndex(-1);
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
