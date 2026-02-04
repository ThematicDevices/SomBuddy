import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../contexts';
import { MigrationSettings } from '../components';
import { useRefreshWines } from '../hooks/useWineQueries';
import { User, Mail, LogOut, Trash2, Download, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { showToast } = useToast();
  const refreshWines = useRefreshWines();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const { error } = await updateProfile({ full_name: fullName });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Profile updated successfully', 'success');
    }

    setIsUpdating(false);
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const { data: wines } = await supabase
        .from('wines')
        .select('*')
        .eq('user_id', user?.id);

      const exportData = {
        wines: wines || [],
        exportDate: new Date().toISOString(),
        version: '2.0',
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sommelier-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }

    setIsExporting(false);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.wines && Array.isArray(data.wines)) {
        let imported = 0;
        let failed = 0;

        for (const wine of data.wines) {
          // Handle both snake_case (DB format) and camelCase (app format) field names
          const insertData = {
            user_id: user.id,
            producer: wine.producer,
            wine_name: wine.wine_name || wine.wineName || '',
            vintage: wine.vintage,
            region: wine.region || '',
            sub_region: wine.sub_region || wine.subRegion || null,
            country: wine.country || '',
            appellation: wine.appellation || null,
            varietals: wine.varietals || [],
            wine_color: wine.wine_color || wine.wineColor || 'red',
            alcohol_content: wine.alcohol_content || wine.alcoholContent || null,
            purchase_date: wine.purchase_date || wine.purchaseDate || null,
            purchase_price: wine.purchase_price || wine.purchasePrice || null,
            purchased_from: wine.purchased_from || wine.purchasedFrom || null,
            estimated_value: wine.estimated_value || wine.estimatedValue || null,
            quantity: wine.quantity || 1,
            storage_location: wine.storage_location || wine.storageLocation || null,
            bottle_condition: wine.bottle_condition || wine.bottleCondition || 'unknown',
            tasting_notes: wine.tasting_notes || wine.tastingNotes || [],
            drinking_window_start: wine.drinking_window_start || wine.drinkingWindowStart || null,
            drinking_window_end: wine.drinking_window_end || wine.drinkingWindowEnd || null,
            drinking_status: wine.drinking_status || wine.drinkingStatus || 'unknown',
            pairing_suggestions: wine.pairing_suggestions || wine.pairingSuggestions || [],
            personal_rating: wine.personal_rating || wine.personalRating || null,
            is_open: wine.is_open || wine.isOpen || false,
            why_purchased: wine.why_purchased || wine.whyPurchased || null,
            provenance: wine.provenance || null,
            story: wine.story || null,
            label_image_url: wine.label_image_url || wine.labelImageUrl || wine.labelImageBase64 || null,
            label_image_storage_path: wine.label_image_storage_path || wine.labelImageStoragePath || null,
            consumption_history: wine.consumption_history || wine.consumptionHistory || [],
          };

          const { error } = await supabase.from('wines').insert(insertData);

          if (!error) {
            imported++;
          } else {
            console.error('Failed to import wine:', wine.producer, error);
            failed++;
          }
        }

        // Invalidate React Query cache to show new wines
        refreshWines();

        if (failed > 0) {
          showToast(`Imported ${imported} wines (${failed} failed)`, 'info');
        } else {
          showToast(`Imported ${imported} wines successfully!`, 'success');
        }
      } else {
        showToast('Invalid import file format. Expected { wines: [...] }', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast('Failed to import data. Check file format.', 'error');
    } finally {
      setIsImporting(false);
    }

    e.target.value = '';
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out successfully', 'info');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);

    try {
      // First delete all user data
      if (user?.id) {
        // Delete wines
        await supabase.from('wines').delete().eq('user_id', user.id);
        // Delete chat history
        await supabase.from('chat_history').delete().eq('user_id', user.id);
        // Delete profile (will cascade from auth.users delete)
      }

      // Delete the auth user - this requires a server-side function or
      // using the user's current session to request deletion
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');

      if (error) {
        // If admin delete fails (expected for client-side), sign out and show message
        await signOut();
        showToast('Account data deleted. Please contact support to complete account removal.', 'info');
        navigate('/login');
      } else {
        showToast('Account deleted successfully', 'success');
        navigate('/login');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      // Even if auth deletion fails, the data is deleted
      await signOut();
      showToast('Account data deleted. Signed out.', 'info');
      navigate('/login');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-charcoal-900">Settings</h1>
        <p className="text-charcoal-500">Manage your account and preferences</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-100">
          <h2 className="font-semibold text-charcoal-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-charcoal-50 rounded-xl text-charcoal-600">
              <Mail className="w-4 h-4" />
              {user?.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
              placeholder="Your name"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Profile
          </button>
        </form>
      </div>

      {/* Image Storage Migration */}
      <MigrationSettings />

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-100">
          <h2 className="font-semibold text-charcoal-900 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors font-medium"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Collection
            </button>

            <label className="flex items-center justify-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors font-medium cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Collection
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-charcoal-500">
            Export your wine collection as JSON for backup or import data from a previous export.
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h2 className="font-semibold text-red-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-charcoal-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-charcoal-900">Delete Account</h3>
                <p className="text-sm text-charcoal-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Your entire wine collection</li>
                <li>All chat history with the sommelier</li>
                <li>Your account and profile data</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Type <span className="font-mono bg-charcoal-100 px-1 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Type DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
