import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getMigrationStatus, migrateWineImages, cleanupMigratedImages } from '../utils/imageMigration';
import {
  Database,
  Cloud,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  HardDrive,
  Zap
} from 'lucide-react';

interface MigrationStatus {
  totalWithImages: number;
  migratedToStorage: number;
  pendingMigration: number;
}

export function MigrationSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ processed: 0, total: 0, successful: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const migrationStatus = await getMigrationStatus(user.id);
      setStatus(migrationStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch migration status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;

    setIsMigrating(true);
    setError(null);
    setMigrationProgress({ processed: 0, total: 0, successful: 0, failed: 0 });

    try {
      const result = await migrateWineImages(user.id, (progress) => {
        setMigrationProgress({
          processed: progress.processed,
          total: progress.total,
          successful: progress.successful,
          failed: progress.failed,
        });
      });

      if (result.failed > 0) {
        setError(`Migration completed with ${result.failed} errors. ${result.successful} images migrated successfully.`);
      }

      // Refresh status after migration
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCleanup = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'This will permanently remove base64 image data from the database for wines that have been migrated to storage. This cannot be undone. Continue?'
    );

    if (!confirmed) return;

    setIsCleaning(true);
    setError(null);

    try {
      const cleanedCount = await cleanupMigratedImages(user.id);
      alert(`Successfully cleaned up ${cleanedCount} migrated images from the database.`);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setIsCleaning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-charcoal-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-wine-500 animate-spin" />
        </div>
      </div>
    );
  }

  const migrationPercentage = status && status.totalWithImages > 0
    ? Math.round((status.migratedToStorage / status.totalWithImages) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-charcoal-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-charcoal-900">Image Storage Migration</h2>
            <p className="text-sm text-charcoal-500 mt-1">
              Migrate wine label images from database to cloud storage for better performance
            </p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-charcoal-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-charcoal-200 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-charcoal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-charcoal-900">{status?.totalWithImages || 0}</p>
                <p className="text-sm text-charcoal-500">Total with images</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{status?.migratedToStorage || 0}</p>
                <p className="text-sm text-green-600">In cloud storage</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{status?.pendingMigration || 0}</p>
                <p className="text-sm text-amber-600">Pending migration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {status && status.totalWithImages > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal-700">Migration Progress</span>
              <span className="text-sm text-charcoal-500">{migrationPercentage}%</span>
            </div>
            <div className="h-3 bg-charcoal-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${migrationPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Migration Progress (during migration) */}
        {isMigrating && (
          <div className="mb-6 p-4 bg-wine-50 border border-wine-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-wine-600 animate-spin" />
              <span className="font-medium text-wine-800">Migrating images...</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-charcoal-900">{migrationProgress.processed}</p>
                <p className="text-xs text-charcoal-500">Processed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-charcoal-900">{migrationProgress.total}</p>
                <p className="text-xs text-charcoal-500">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{migrationProgress.successful}</p>
                <p className="text-xs text-charcoal-500">Success</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{migrationProgress.failed}</p>
                <p className="text-xs text-charcoal-500">Failed</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {status && status.pendingMigration > 0 && (
            <button
              onClick={handleMigrate}
              disabled={isMigrating || isCleaning}
              className="flex items-center gap-2 px-4 py-2.5 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Migrate {status.pendingMigration} Images
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {status && status.migratedToStorage > 0 && status.pendingMigration === 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-800 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4" />
              All images migrated!
            </div>
          )}

          {status && status.migratedToStorage > 0 && (
            <button
              onClick={handleCleanup}
              disabled={isMigrating || isCleaning}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isCleaning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Cleanup Database
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">What does migration do?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Uploads images from your database to Supabase Storage (CDN)</li>
            <li>• Reduces database size significantly (images can be 100KB-500KB each)</li>
            <li>• Enables automatic thumbnail generation for faster loading</li>
            <li>• Improves app performance, especially on mobile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
