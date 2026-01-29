import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw, X, StopCircle } from 'lucide-react';
import { ProcessingItem, ProcessingStatus } from '../hooks/useBatchProcessor';

interface BatchProcessingQueueProps {
  items: ProcessingItem[];
  isProcessing: boolean;
  currentIndex: number;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
}

const statusConfig: Record<ProcessingStatus, { icon: React.ReactNode; label: string; className: string }> = {
  pending: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Waiting',
    className: 'text-charcoal-400 bg-charcoal-50',
  },
  processing: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    label: 'Analyzing...',
    className: 'text-wine-700 bg-wine-50',
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Complete',
    className: 'text-green-700 bg-green-50',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'Failed',
    className: 'text-red-700 bg-red-50',
  },
};

export function BatchProcessingQueue({
  items,
  isProcessing,
  currentIndex: _currentIndex,
  onRetry,
  onRemove,
  onCancel,
}: BatchProcessingQueueProps) {
  const completedCount = items.filter((i) => i.status === 'success' || i.status === 'error').length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-charcoal-900">
            {isProcessing ? 'Processing wine labels...' : 'Processing complete'}
          </h3>
          <p className="text-sm text-charcoal-500">
            {completedCount} of {items.length} images processed
          </p>
        </div>
        {isProcessing && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-charcoal-600 hover:text-charcoal-800 bg-charcoal-100 hover:bg-charcoal-200 rounded-lg transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      <div className="w-full bg-charcoal-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-wine-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.map((item, index) => {
          const config = statusConfig[item.status];
          const wineInfo = item.result
            ? `${item.result.producer || 'Unknown Producer'}${item.result.wineName ? ` - ${item.result.wineName}` : ''}`
            : `Image ${index + 1}`;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                item.status === 'processing'
                  ? 'border-wine-200 bg-wine-50/50'
                  : 'border-charcoal-100 bg-white'
              }`}
            >
              <img
                src={item.image.preview}
                alt={`Wine label ${index + 1}`}
                className="w-12 h-16 object-cover rounded-md flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-900 truncate">{wineInfo}</p>
                {item.result?.vintage && (
                  <p className="text-sm text-charcoal-500">{item.result.vintage}</p>
                )}
                {item.error && (
                  <p className="text-sm text-red-600 truncate">{item.error}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </span>

                {item.status === 'error' && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="p-1.5 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-md transition-colors"
                    title="Retry"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {!isProcessing && item.status !== 'processing' && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
