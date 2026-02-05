import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts';
import { Modal, WineForm } from '../components';
import { WineFormData, TastingNote } from '../types';
import { useWineDetail, useUpdateWine, useDeleteWine } from '../hooks/useWineQueries';
import {
  getWineDisplayName,
  getVarietalString,
  formatPrice,
  formatDate,
  getDrinkingStatusColor,
  getDrinkingStatusLabel,
  getWineColorClass,
  calculateDrinkingStatus,
  enrichWineData,
} from '../utils';
import { getWineImageDisplayUrl } from '../utils/imageStorage';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Wine as WineIcon,
  MapPin,
  Calendar,
  DollarSign,
  Warehouse,
  Clock,
  Star,
  GlassWater,
  Plus,
  X,
  RefreshCw,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // React Query hooks
  const { data: wine, isLoading, error } = useWineDetail(id);
  const updateWineMutation = useUpdateWine();
  const deleteWineMutation = useDeleteWine();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [showTastingModal, setShowTastingModal] = useState(false);
  const [tastingNotes, setTastingNotes] = useState('');
  const [tastingRating, setTastingRating] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-wine-500 animate-spin mb-4" />
        <p className="text-charcoal-500">Loading wine details...</p>
      </div>
    );
  }

  // Error state
  if (error || !wine) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <WineIcon className="w-16 h-16 text-charcoal-300 mb-4" />
        <h2 className="text-xl font-semibold text-charcoal-900 mb-2">Wine Not Found</h2>
        <p className="text-charcoal-500 mb-6">This wine may have been removed from your collection.</p>
        <Link
          to="/collection"
          className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collection
        </Link>
      </div>
    );
  }

  const drinkingStatus = calculateDrinkingStatus(wine);

  const handleEdit = async (data: WineFormData) => {
    try {
      await updateWineMutation.mutateAsync({
        ...wine,
        ...data,
        dateModified: new Date().toISOString(),
      });
      setShowEditModal(false);
      showToast('Wine updated successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update wine', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWineMutation.mutateAsync(wine.id);
      showToast('Wine removed from collection', 'info');
      navigate('/collection');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete wine', 'error');
    }
  };

  const handleDrink = async () => {
    if (wine.quantity <= 0) return;

    const newNote: TastingNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      notes: tastingNotes,
      rating: tastingRating > 0 ? tastingRating : undefined,
      context: 'Opened bottle',
    };

    try {
      await updateWineMutation.mutateAsync({
        ...wine,
        quantity: wine.quantity - 1,
        tastingNotes: [...wine.tastingNotes, newNote],
        isOpen: true,
      });

      setShowDrinkModal(false);
      setTastingNotes('');
      setTastingRating(0);
      showToast('Bottle opened! Enjoy your wine.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open bottle', 'error');
    }
  };

  const handleAddTastingNote = async () => {
    const newNote: TastingNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      notes: tastingNotes,
      rating: tastingRating > 0 ? tastingRating : undefined,
    };

    try {
      await updateWineMutation.mutateAsync({
        ...wine,
        tastingNotes: [...wine.tastingNotes, newNote],
      });

      setShowTastingModal(false);
      setTastingNotes('');
      setTastingRating(0);
      showToast('Tasting note added', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add tasting note', 'error');
    }
  };

  const handleDeleteTastingNote = async (noteId: string) => {
    try {
      await updateWineMutation.mutateAsync({
        ...wine,
        tastingNotes: wine.tastingNotes.filter(n => n.id !== noteId),
      });
      showToast('Tasting note removed', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove tasting note', 'error');
    }
  };

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = Math.max(0, wine.quantity + delta);
    try {
      await updateWineMutation.mutateAsync({ ...wine, quantity: newQuantity });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update quantity', 'error');
    }
  };

  const handleRefreshInfo = async () => {
    setIsRefreshing(true);
    try {
      const enrichedData = await enrichWineData({
        producer: wine.producer,
        wineName: wine.wineName,
        vintage: wine.vintage,
        region: wine.region,
        country: wine.country,
        varietals: wine.varietals,
      });

      await updateWineMutation.mutateAsync({
        ...wine,
        estimatedValue: enrichedData.estimatedPrice,
        drinkingWindowStart: enrichedData.drinkingWindowStart || wine.drinkingWindowStart,
        drinkingWindowEnd: enrichedData.drinkingWindowEnd || wine.drinkingWindowEnd,
        pairingSuggestions: enrichedData.pairingSuggestions?.length
          ? enrichedData.pairingSuggestions
          : wine.pairingSuggestions,
        story: enrichedData.story || wine.story,
        dateModified: new Date().toISOString(),
      });

      showToast('Wine information refreshed with latest data!', 'success');
    } catch (err) {
      console.error('Error refreshing wine data:', err);
      showToast(err instanceof Error ? err.message : 'Failed to refresh wine info', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {(wine.labelImageStoragePath || wine.labelImageBase64) ? (
                <img
                  src={getWineImageDisplayUrl(wine.labelImageBase64, false, wine.labelImageStoragePath) || ''}
                  alt={wine.producer}
                  className="w-32 h-48 md:w-40 md:h-56 object-cover rounded-lg shadow-md mx-auto md:mx-0"
                />
              ) : (
                <div className={`w-32 h-48 md:w-40 md:h-56 rounded-lg flex items-center justify-center mx-auto md:mx-0 ${getWineColorClass(wine.wineColor)}`}>
                  <div className="w-8 h-20 bg-white/20 rounded-sm" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-charcoal-900">
                    {getWineDisplayName(wine)}
                  </h1>
                  <p className="text-lg text-charcoal-600 mt-1">
                    {getVarietalString(wine)}
                  </p>
                </div>
                <span className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-sm font-medium ${getDrinkingStatusColor(drinkingStatus)}`}>
                  {getDrinkingStatusLabel(drinkingStatus)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-charcoal-600">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-charcoal-400" />
                  {wine.region}, {wine.country}
                </span>
                {wine.vintage && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-charcoal-400" />
                    {wine.vintage}
                  </span>
                )}
                {wine.purchasePrice && (
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-charcoal-400" />
                    Paid: {formatPrice(wine.purchasePrice)}
                  </span>
                )}
                {wine.estimatedValue && (
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Market: {formatPrice(wine.estimatedValue)}
                  </span>
                )}
                {wine.storageLocation && (
                  <span className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-charcoal-400" />
                    {wine.storageLocation}
                  </span>
                )}
              </div>

              {wine.drinkingWindowStart && wine.drinkingWindowEnd && (
                <div className="mt-4 flex items-center gap-2 text-sm text-charcoal-600">
                  <Clock className="w-4 h-4 text-charcoal-400" />
                  Drinking window: {wine.drinkingWindowStart} - {wine.drinkingWindowEnd}
                </div>
              )}

              {wine.pairingSuggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {wine.pairingSuggestions.map((pairing, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-sm"
                    >
                      {pairing}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-charcoal-50 rounded-lg px-3 py-2">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={wine.quantity <= 0}
                    className="w-8 h-8 flex items-center justify-center text-charcoal-600 hover:bg-charcoal-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{wine.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 flex items-center justify-center text-charcoal-600 hover:bg-charcoal-200 rounded transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-charcoal-500 ml-1">bottles</span>
                </div>

                <button
                  onClick={() => setShowDrinkModal(true)}
                  disabled={wine.quantity <= 0}
                  className="flex items-center gap-2 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <GlassWater className="w-4 h-4" />
                  Open Bottle
                </button>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <button
                  onClick={handleRefreshInfo}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {(wine.whyPurchased || wine.appellation || wine.alcoholContent || wine.purchasedFrom) && (
          <div className="border-t border-charcoal-100 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Additional Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wine.appellation && (
                <div>
                  <dt className="text-sm text-charcoal-500">Appellation</dt>
                  <dd className="text-charcoal-800">{wine.appellation}</dd>
                </div>
              )}
              {wine.alcoholContent && (
                <div>
                  <dt className="text-sm text-charcoal-500">Alcohol Content</dt>
                  <dd className="text-charcoal-800">{wine.alcoholContent}%</dd>
                </div>
              )}
              {wine.purchasedFrom && (
                <div>
                  <dt className="text-sm text-charcoal-500">Purchased From</dt>
                  <dd className="text-charcoal-800">{wine.purchasedFrom}</dd>
                </div>
              )}
              {wine.purchaseDate && (
                <div>
                  <dt className="text-sm text-charcoal-500">Purchase Date</dt>
                  <dd className="text-charcoal-800">{formatDate(wine.purchaseDate)}</dd>
                </div>
              )}
              {wine.whyPurchased && (
                <div className="md:col-span-2">
                  <dt className="text-sm text-charcoal-500">Notes</dt>
                  <dd className="text-charcoal-800 whitespace-pre-wrap">{wine.whyPurchased}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="border-t border-charcoal-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-900">Tasting Notes</h2>
            <button
              onClick={() => setShowTastingModal(true)}
              className="flex items-center gap-1 text-sm text-wine-700 hover:text-wine-900 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>

          {wine.tastingNotes.length === 0 ? (
            <p className="text-charcoal-500 text-center py-6">
              No tasting notes yet. Add your impressions after enjoying this wine.
            </p>
          ) : (
            <div className="space-y-4">
              {wine.tastingNotes
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(note => (
                  <div key={note.id} className="bg-charcoal-50 rounded-lg p-4 relative group">
                    <button
                      onClick={() => handleDeleteTastingNote(note.id)}
                      className="absolute top-2 right-2 p-1 text-charcoal-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-charcoal-500">{formatDate(note.date)}</span>
                      {note.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                          <span className="text-sm font-medium text-charcoal-700">{note.rating}/5</span>
                        </div>
                      )}
                      {note.context && (
                        <span className="text-xs px-2 py-0.5 bg-wine-50 text-wine-700 rounded-full">
                          {note.context}
                        </span>
                      )}
                    </div>
                    <p className="text-charcoal-700 whitespace-pre-wrap">{note.notes}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="border-t border-charcoal-100 px-6 md:px-8 py-4 bg-charcoal-50 text-sm text-charcoal-500">
          Added {formatDate(wine.dateAdded)} • Last modified {formatDate(wine.dateModified)}
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Wine"
        size="full"
      >
        <WineForm
          initialData={{
            producer: wine.producer,
            wineName: wine.wineName,
            vintage: wine.vintage,
            region: wine.region,
            subRegion: wine.subRegion,
            country: wine.country,
            appellation: wine.appellation,
            varietals: wine.varietals,
            wineColor: wine.wineColor,
            alcoholContent: wine.alcoholContent,
            quantity: wine.quantity,
            purchasePrice: wine.purchasePrice,
            purchaseDate: wine.purchaseDate,
            purchasedFrom: wine.purchasedFrom,
            storageLocation: wine.storageLocation,
            drinkingWindowStart: wine.drinkingWindowStart,
            drinkingWindowEnd: wine.drinkingWindowEnd,
            whyPurchased: wine.whyPurchased,
            pairingSuggestions: wine.pairingSuggestions,
            labelImageBase64: wine.labelImageBase64,
          }}
          onSubmit={handleEdit}
          onCancel={() => setShowEditModal(false)}
          submitLabel="Save Changes"
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Wine"
        size="sm"
      >
        <div className="p-6">
          <p className="text-charcoal-600 mb-6">
            Are you sure you want to remove <strong>{getWineDisplayName(wine)}</strong> from your collection?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Delete Wine
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDrinkModal}
        onClose={() => setShowDrinkModal(false)}
        title="Open Bottle"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-charcoal-600">
            Opening <strong>{getWineDisplayName(wine)}</strong>.
            Add any tasting notes for this occasion.
          </p>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setTastingRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= tastingRating
                        ? 'text-gold-500 fill-gold-500'
                        : 'text-charcoal-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Tasting Notes (optional)
            </label>
            <textarea
              value={tastingNotes}
              onChange={e => setTastingNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors resize-none"
              placeholder="Describe the wine... color, aroma, taste, finish..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDrinkModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDrink}
              className="px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 font-medium transition-colors"
            >
              Open Bottle
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTastingModal}
        onClose={() => setShowTastingModal(false)}
        title="Add Tasting Note"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setTastingRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= tastingRating
                        ? 'text-gold-500 fill-gold-500'
                        : 'text-charcoal-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Notes *
            </label>
            <textarea
              value={tastingNotes}
              onChange={e => setTastingNotes(e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors resize-none"
              placeholder="Your impressions of this wine..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowTastingModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTastingNote}
              disabled={!tastingNotes.trim()}
              className="px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
