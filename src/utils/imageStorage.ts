import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'wine-images';

export interface UploadResult {
  path: string;
  publicUrl: string;
  thumbnailUrl: string;
}

/**
 * Upload a wine label image to Supabase Storage
 */
export async function uploadWineImage(
  file: File,
  userId: string,
  wineId: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${wineId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const publicUrl = getImageUrl(filePath);
  const thumbnailUrl = getThumbnailUrl(filePath);

  return { path: filePath, publicUrl, thumbnailUrl };
}

/**
 * Upload a base64 image to Supabase Storage
 */
export async function uploadBase64Image(
  base64Data: string,
  userId: string,
  wineId: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  const file = base64ToFile(base64Data, `${wineId}.jpg`, mimeType);
  return uploadWineImage(file, userId, wineId);
}

/**
 * Get the public URL for an image in storage
 */
export function getImageUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a thumbnail URL with image transformation
 */
export function getThumbnailUrl(path: string, width = 200, height = 200): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path, {
    transform: {
      width,
      height,
      resize: 'cover',
    },
  });
  return data.publicUrl;
}

/**
 * Delete an image from storage
 */
export async function deleteWineImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    console.error('Failed to delete image:', error);
  }
}

/**
 * Convert a base64 string to a File object
 */
export function base64ToFile(
  base64Data: string,
  filename: string,
  mimeType: string = 'image/jpeg'
): File {
  // Remove data URL prefix if present
  const base64Content = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data;

  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  return new File([blob], filename, { type: mimeType });
}

/**
 * Check if a string is a base64 image
 */
export function isBase64Image(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(str.slice(0, 100));
}

/**
 * Check if a string is a storage URL
 */
export function isStorageUrl(str: string | null | undefined): boolean {
  if (!str) return false;
  return str.includes('supabase') && str.includes('storage');
}

/**
 * Get the display URL for a wine image
 * Priority: Storage URL > Base64 data URL
 * @param storagePath - The storage path (if migrated)
 * @param base64Data - The base64 image data (legacy)
 * @param useThumbnail - Whether to use thumbnail transformation
 */
export function getWineImageDisplayUrl(
  imageData: string | null | undefined,
  useThumbnail = false,
  storagePath?: string | null
): string | null {
  // Priority 1: If storage path is provided, use storage URL
  if (storagePath) {
    if (useThumbnail) {
      return getThumbnailUrl(storagePath, 128, 192);
    }
    return getImageUrl(storagePath);
  }

  // Priority 2: Handle imageData (could be base64 or legacy URL)
  if (!imageData) return null;

  // If it's already a storage URL, return as-is or get thumbnail
  if (isStorageUrl(imageData)) {
    return imageData;
  }

  // If it's base64, return as data URL
  if (isBase64Image(imageData)) {
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    return `data:image/jpeg;base64,${imageData}`;
  }

  return null;
}
