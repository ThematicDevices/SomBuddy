import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Trash2, Edit3, Wine, AlertCircle, RotateCcw } from 'lucide-react';
import { MultiImageUpload, ImageItem } from '../components/MultiImageUpload';
import { BatchProcessingQueue } from '../components/BatchProcessingQueue';
import { useBatchProcessor } from '../hooks/useBatchProcessor';
import { useToast } from '../contexts';
import { useAddWine } from '../hooks/useWineQueries';
import { WineFormData, createDefaultWine } from '../types';

type BatchStep = 'select' | 'process' | 'review';

interface ReviewItem {
  id: string;
  data: Partial<WineFormData>;
  imagePreview: string;
  selected: boolean;
  status: 'pending' | 'added' | 'failed';
  error?: string;
}

export function BatchAddWines() {
  const navigate = useNavigate();
  const addWineMutation = useAddWine();
  const { showToast } = useToast();

  const [step, setStep] = useState<BatchStep>('select');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const {
    items: processingItems,
    isProcessing,
    currentIndex,
    successCount,
    errorCount,
    startProcessing,
    cancelProcessing,
    removeItem,
    retryItem,
    reset,
  } = useBatchProcessor();

  const handleImagesSelected = (images: ImageItem[]) => {
    setSelectedImages(images);
  };

  const handleStartProcessing = () => {
    if (selectedImages.length === 0) return;
    setStep('process');
    startProcessing(selectedImages);
  };

  const handleProcessingComplete = () => {
    const successfulItems: ReviewItem[] = processingItems
      .filter((item) => item.status === 'success' && item.result)
      .map((item) => ({
        id: item.id,
        data: item.result!,
        imagePreview: item.image.preview,
        selected: true,
        status: 'pending' as const,
      }));

    setReviewItems(successfulItems);
    setStep('review');
  };

  const toggleItemSelection = (id: string) => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = reviewItems.every((item) => item.selected);
    setReviewItems((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const removeReviewItem = (id: string) => {
    setReviewItems((prev) => prev.filter((item) => item.id !== id));
  };

  const retryFailedItems = async () => {
    const failedItems = reviewItems.filter((item) => item.status === 'failed');
    if (failedItems.length === 0) return;

    setIsAdding(true);

    for (const item of failedItems) {
      try {
        const formData: WineFormData = {
          ...createDefaultWine(),
          ...item.data,
        };
        await addWineMutation.mutateAsync(formData);

        // Mark as added
        setReviewItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'added' as const, error: undefined } : i
          )
        );
      } catch (err) {
        // Update error message
        setReviewItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, error: err instanceof Error ? err.message : 'Failed to add' }
              : i
          )
        );
      }
    }

    setIsAdding(false);

    const updatedFailedCount = reviewItems.filter((item) => item.status === 'failed').length;
    if (updatedFailedCount === 0) {
      showToast('All wines added successfully!', 'success');
      navigate('/collection');
    }
  };

  const handleAddSelectedWines = async () => {
    const selectedWines = reviewItems.filter((item) => item.selected && item.status === 'pending');
    if (selectedWines.length === 0) {
      showToast('Please select at least one wine to add', 'error');
      return;
    }

    setIsAdding(true);
    let addedCount = 0;

    // Process each wine and track status
    for (const item of selectedWines) {
      try {
        const formData: WineFormData = {
          ...createDefaultWine(),
          ...item.data,
        };
        await addWineMutation.mutateAsync(formData);
        addedCount++;

        // Mark as added
        setReviewItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'added' as const } : i
          )
        );
      } catch (err) {
        console.error('Failed to add wine:', err);

        // Mark as failed with error message
        setReviewItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'failed' as const, error: err instanceof Error ? err.message : 'Failed to add wine' }
              : i
          )
        );
      }
    }

    setIsAdding(false);

    // Check for any failures
    const failedCount = reviewItems.filter((item) => item.status === 'failed').length;

    if (failedCount === 0 && addedCount > 0) {
      showToast(`Successfully added ${addedCount} wine(s) to your collection!`, 'success');
      navigate('/collection');
    } else if (addedCount > 0 && failedCount > 0) {
      showToast(`Added ${addedCount} wine(s). ${failedCount} failed - see details below.`, 'info');
    } else if (addedCount === 0) {
      showToast('Failed to add wines. Please check the errors below.', 'error');
    }
  };

  const handleBack = () => {
    if (step === 'select') {
      navigate('/add');
    } else if (step === 'process') {
      cancelProcessing();
      reset();
      setStep('select');
    } else if (step === 'review') {
      setStep('process');
    }
  };

  const handleStartOver = () => {
    reset();
    setSelectedImages([]);
    setReviewItems([]);
    setStep('select');
  };

  const selectedCount = reviewItems.filter((item) => item.selected).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handleBack}
            className="p-1 text-charcoal-500 hover:text-charcoal-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-display font-bold text-charcoal-900">
            Batch Add Wines
          </h1>
        </div>
        <p className="text-charcoal-500 ml-8">
          {step === 'select' && 'Select up to 10 wine label images to process'}
          {step === 'process' && 'AI is analyzing your wine labels one by one'}
          {step === 'review' && 'Review and add wines to your collection'}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {['select', 'process', 'review'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-wine-600 text-white'
                  : ['select', 'process', 'review'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : 'bg-charcoal-100 text-charcoal-500'
              }`}
            >
              {['select', 'process', 'review'].indexOf(step) > i ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-1 mx-2 rounded ${
                  ['select', 'process', 'review'].indexOf(step) > i
                    ? 'bg-green-500'
                    : 'bg-charcoal-100'
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-sm text-charcoal-500 ml-2 capitalize">{step}</span>
      </div>

      <div className="bg-white rounded-xl border border-charcoal-100 p-6">
        {step === 'select' && (
          <div className="space-y-6">
            <MultiImageUpload
              onImagesSelected={handleImagesSelected}
              maxImages={10}
            />

            <div className="flex justify-between items-center pt-4 border-t border-charcoal-100">
              <Link
                to="/add"
                className="text-sm text-charcoal-500 hover:text-charcoal-700"
              >
                ← Add single wine instead
              </Link>
              <button
                onClick={handleStartProcessing}
                disabled={selectedImages.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-wine-900 hover:bg-wine-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'process' && (
          <div className="space-y-6">
            <BatchProcessingQueue
              items={processingItems}
              isProcessing={isProcessing}
              currentIndex={currentIndex}
              onRetry={retryItem}
              onRemove={removeItem}
              onCancel={cancelProcessing}
            />

            {!isProcessing && (
              <div className="flex justify-between items-center pt-4 border-t border-charcoal-100">
                <div className="text-sm text-charcoal-600">
                  {successCount > 0 && (
                    <span className="text-green-600 font-medium">{successCount} successful</span>
                  )}
                  {successCount > 0 && errorCount > 0 && <span> • </span>}
                  {errorCount > 0 && (
                    <span className="text-red-600 font-medium">{errorCount} failed</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleProcessingComplete}
                    disabled={successCount === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-wine-900 hover:bg-wine-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review {successCount} Wine{successCount !== 1 ? 's' : ''}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-600">
                {selectedCount} of {reviewItems.length} wines selected
              </p>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-wine-700 hover:text-wine-800 font-medium"
              >
                {reviewItems.every((item) => item.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    item.status === 'failed'
                      ? 'border-red-200 bg-red-50/30'
                      : item.status === 'added'
                      ? 'border-green-200 bg-green-50/30'
                      : item.selected
                      ? 'border-wine-200 bg-wine-50/30'
                      : 'border-charcoal-100 bg-charcoal-50/50'
                  }`}
                >
                  {item.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-5 h-5 rounded border-charcoal-300 text-wine-600 focus:ring-wine-500"
                    />
                  )}
                  {item.status === 'added' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {item.status === 'failed' && (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}

                  <img
                    src={item.imagePreview}
                    alt="Wine label"
                    className="w-14 h-20 object-cover rounded-md flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal-900 truncate">
                      {item.data.producer || 'Unknown Producer'}
                    </p>
                    <p className="text-sm text-charcoal-600 truncate">
                      {item.data.wineName || 'Unknown Wine'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-500">
                      {item.data.vintage && <span>{item.data.vintage}</span>}
                      {item.data.region && <span>• {item.data.region}</span>}
                      {item.data.wineColor && (
                        <span className="capitalize">• {item.data.wineColor}</span>
                      )}
                    </div>
                    {item.status === 'failed' && item.error && (
                      <p className="text-xs text-red-600 mt-1 truncate">
                        Error: {item.error}
                      </p>
                    )}
                    {item.status === 'added' && (
                      <p className="text-xs text-green-600 mt-1">
                        Added to collection
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'pending' && (
                      <>
                        <Link
                          to={`/add?prefill=${encodeURIComponent(JSON.stringify(item.data))}`}
                          className="p-2 text-charcoal-500 hover:text-wine-700 hover:bg-wine-50 rounded-md transition-colors"
                          title="Edit details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => removeReviewItem(item.id)}
                          className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <button
                        onClick={() => removeReviewItem(item.id)}
                        className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {reviewItems.length === 0 && (
                <div className="text-center py-12">
                  <Wine className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
                  <p className="text-charcoal-500">No wines to review</p>
                  <button
                    onClick={handleStartOver}
                    className="mt-4 text-wine-700 hover:text-wine-800 font-medium text-sm"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>

            {reviewItems.length > 0 && (
              <div className="flex flex-col gap-4 pt-4 border-t border-charcoal-100">
                {/* Show failed items summary with retry button */}
                {reviewItems.some((item) => item.status === 'failed') && (
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-700">
                        {reviewItems.filter((item) => item.status === 'failed').length} wine(s) failed to add
                      </span>
                    </div>
                    <button
                      onClick={retryFailedItems}
                      disabled={isAdding}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry Failed
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleAddSelectedWines}
                    disabled={selectedCount === 0 || isAdding}
                    className="flex items-center gap-2 px-6 py-2.5 bg-wine-900 hover:bg-wine-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add {selectedCount} Wine{selectedCount !== 1 ? 's' : ''} to Collection
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
