import { supabase } from '../lib/supabase';
import { uploadBase64Image } from './imageStorage';

interface MigrationResult {
  success: boolean;
  wineId: string;
  storagePath?: string;
  error?: string;
}

interface MigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results: MigrationResult[];
}

/**
 * Migrate wine images from base64 database storage to Supabase Storage
 * This utility processes wines in batches to avoid overwhelming the server
 */
export async function migrateWineImages(
  userId: string,
  onProgress?: (progress: MigrationProgress) => void,
  batchSize: number = 5
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    results: [],
  };

  // Fetch all wines with base64 images that haven't been migrated yet
  const { data: wines, error: fetchError } = await supabase
    .from('wines')
    .select('id, label_image_url, label_image_storage_path')
    .eq('user_id', userId)
    .not('label_image_url', 'is', null)
    .is('label_image_storage_path', null);

  if (fetchError) {
    console.error('Error fetching wines for migration:', fetchError);
    throw new Error(`Failed to fetch wines: ${fetchError.message}`);
  }

  if (!wines || wines.length === 0) {
    return progress;
  }

  progress.total = wines.length;
  onProgress?.(progress);

  // Process in batches
  for (let i = 0; i < wines.length; i += batchSize) {
    const batch = wines.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (wine: { id: string; label_image_url: string; label_image_storage_path: string | null }): Promise<MigrationResult> => {
        try {
          const base64Data = wine.label_image_url;

          // Skip if it's already a URL (not base64)
          if (base64Data.startsWith('http')) {
            return {
              success: true,
              wineId: wine.id,
              storagePath: base64Data,
            };
          }

          // Detect MIME type from base64 header or default to JPEG
          let mimeType = 'image/jpeg';
          if (base64Data.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
          } else if (base64Data.startsWith('iVBORw0KGgo')) {
            mimeType = 'image/png';
          } else if (base64Data.startsWith('R0lGOD')) {
            mimeType = 'image/gif';
          } else if (base64Data.startsWith('UklGR')) {
            mimeType = 'image/webp';
          }

          // Upload to Supabase Storage
          const uploadResult = await uploadBase64Image(base64Data, userId, wine.id, mimeType);
          const storagePath = uploadResult.path;

          // Update the wine record with the storage path
          const { error: updateError } = await supabase
            .from('wines')
            .update({ label_image_storage_path: storagePath })
            .eq('id', wine.id)
            .eq('user_id', userId);

          if (updateError) {
            throw new Error(updateError.message);
          }

          return {
            success: true,
            wineId: wine.id,
            storagePath,
          };
        } catch (error) {
          return {
            success: false,
            wineId: wine.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Update progress
    for (const result of batchResults) {
      progress.processed++;
      if (result.success) {
        progress.successful++;
      } else {
        progress.failed++;
      }
      progress.results.push(result);
    }

    onProgress?.(progress);

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < wines.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return progress;
}

/**
 * Clean up base64 data from wines that have been migrated to storage
 * This should only be run after confirming migration was successful
 */
export async function cleanupMigratedImages(
  userId: string,
  onProgress?: (progress: { processed: number; total: number }) => void
): Promise<number> {
  // Fetch wines that have been migrated (have both base64 and storage path)
  const { data: wines, error: fetchError } = await supabase
    .from('wines')
    .select('id')
    .eq('user_id', userId)
    .not('label_image_url', 'is', null)
    .not('label_image_storage_path', 'is', null);

  if (fetchError) {
    throw new Error(`Failed to fetch migrated wines: ${fetchError.message}`);
  }

  if (!wines || wines.length === 0) {
    return 0;
  }

  const total = wines.length;
  let processed = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < wines.length; i += batchSize) {
    const batch = wines.slice(i, i + batchSize);
    const ids = batch.map((w: { id: string }) => w.id);

    // Clear base64 data for these wines
    const { error: updateError } = await supabase
      .from('wines')
      .update({ label_image_url: null })
      .in('id', ids)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error clearing base64 data:', updateError);
    }

    processed += batch.length;
    onProgress?.({ processed, total });
  }

  return processed;
}

/**
 * Get migration status for the current user
 */
export async function getMigrationStatus(userId: string): Promise<{
  totalWithImages: number;
  migratedToStorage: number;
  pendingMigration: number;
}> {
  // Count wines with any image
  const { count: totalWithImages } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('label_image_url', 'is', null);

  // Count wines already migrated
  const { count: migratedToStorage } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('label_image_storage_path', 'is', null);

  // Count wines pending migration
  const { count: pendingMigration } = await supabase
    .from('wines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('label_image_url', 'is', null)
    .is('label_image_storage_path', null);

  return {
    totalWithImages: totalWithImages || 0,
    migratedToStorage: migratedToStorage || 0,
    pendingMigration: pendingMigration || 0,
  };
}
