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
 * This utility processes wines one by one to avoid timeouts
 */
export async function migrateWineImages(
  userId: string,
  onProgress?: (progress: MigrationProgress) => void,
  batchSize: number = 3
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    results: [],
  };

  // Step 1: Get count and IDs only (fast query, no image data)
  const { data: wineIds, error: countError } = await supabase
    .from('wines')
    .select('id')
    .eq('user_id', userId)
    .is('label_image_storage_path', null)
    .limit(500); // Process max 500 at a time

  if (countError) {
    console.error('Error fetching wine IDs:', countError);
    throw new Error(`Failed to fetch wines: ${countError.message}`);
  }

  if (!wineIds || wineIds.length === 0) {
    return progress;
  }

  progress.total = wineIds.length;
  onProgress?.(progress);

  // Step 2: Process wines one by one, fetching image data individually
  for (let i = 0; i < wineIds.length; i += batchSize) {
    const batchIds = wineIds.slice(i, i + batchSize);

    // Process batch sequentially to avoid overwhelming the server
    for (const wineIdObj of batchIds) {
      const wineId = wineIdObj.id;

      try {
        // Fetch this wine's image data individually (much faster than bulk)
        const { data: wine, error: fetchError } = await supabase
          .from('wines')
          .select('id, label_image_url')
          .eq('id', wineId)
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        const base64Data = wine?.label_image_url;

        // Skip if no image data
        if (!base64Data) {
          progress.processed++;
          progress.successful++;
          progress.results.push({
            success: true,
            wineId,
            storagePath: undefined,
          });
          onProgress?.(progress);
          continue;
        }

        // Skip if it's already a URL (not base64)
        if (base64Data.startsWith('http')) {
          progress.processed++;
          progress.successful++;
          progress.results.push({
            success: true,
            wineId,
            storagePath: base64Data,
          });
          onProgress?.(progress);
          continue;
        }

        // Detect MIME type from base64 header
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
        const uploadResult = await uploadBase64Image(base64Data, userId, wineId, mimeType);
        const storagePath = uploadResult.path;

        // Update the wine record with the storage path
        const { error: updateError } = await supabase
          .from('wines')
          .update({ label_image_storage_path: storagePath })
          .eq('id', wineId)
          .eq('user_id', userId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        progress.processed++;
        progress.successful++;
        progress.results.push({
          success: true,
          wineId,
          storagePath,
        });
      } catch (error) {
        progress.processed++;
        progress.failed++;
        progress.results.push({
          success: false,
          wineId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      onProgress?.(progress);
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < wineIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
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
