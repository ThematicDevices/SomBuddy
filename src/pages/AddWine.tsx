import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUpload, WineForm, Modal } from '../components';
import { useWines, useApiKey, useToast } from '../contexts';
import { extractWineFromImage } from '../utils';
import { WineFormData, createDefaultWine } from '../types';
import { Camera, Edit3, AlertCircle, Key } from 'lucide-react';

type AddStep = 'choose' | 'photo' | 'validate' | 'manual';

export function AddWine() {
  const navigate = useNavigate();
  const { addWine } = useWines();
  const { apiKey, setApiKey, isConfigured } = useApiKey();
  const { showToast } = useToast();

  const [step, setStep] = useState<AddStep>('choose');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<WineFormData> | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const handleImageCapture = async (base64: string, mimeType: string) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setImageBase64(base64);
    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractWineFromImage(apiKey, base64, mimeType);
      setExtractedData({
        ...data,
        labelImageBase64: base64,
      });
      setStep('validate');
    } catch (err) {
      console.error('Error extracting wine data:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze wine label');
      setExtractedData({
        ...createDefaultWine(),
        labelImageBase64: base64,
      });
      setStep('validate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setShowApiKeyModal(false);
      showToast('API key saved successfully', 'success');
    }
  };

  const handleSubmit = (data: WineFormData) => {
    const wine = addWine(data);
    showToast(`${wine.producer} ${wine.wineName || ''} added to your collection!`, 'success');
    navigate(`/wine/${wine.id}`);
  };

  const handleCancel = () => {
    if (step === 'choose') {
      navigate('/');
    } else {
      setStep('choose');
      setExtractedData(null);
      setImageBase64(null);
      setError(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900">Add Wine to Collection</h1>
        <p className="text-charcoal-500">
          {step === 'choose' && 'Choose how to add your wine'}
          {step === 'photo' && 'Take a photo or upload an image of the wine label'}
          {step === 'validate' && 'Review and edit the extracted details'}
          {step === 'manual' && 'Enter wine details manually'}
        </p>
      </div>

      {step === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (!isConfigured) {
                setShowApiKeyModal(true);
              } else {
                setStep('photo');
              }
            }}
            className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl border-2 border-charcoal-100 hover:border-wine-300 hover:bg-wine-50/30 transition-all group"
          >
            <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center group-hover:bg-wine-200 transition-colors">
              <Camera className="w-8 h-8 text-wine-700" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-charcoal-900 text-lg">Photo Capture</h3>
              <p className="text-sm text-charcoal-500 mt-1">
                Take a photo of the label and let AI extract the details
              </p>
            </div>
            {!isConfigured && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Key className="w-3 h-3" />
                API key required
              </span>
            )}
          </button>

          <button
            onClick={() => setStep('manual')}
            className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl border-2 border-charcoal-100 hover:border-charcoal-300 hover:bg-charcoal-50/50 transition-all group"
          >
            <div className="w-16 h-16 bg-charcoal-100 rounded-full flex items-center justify-center group-hover:bg-charcoal-200 transition-colors">
              <Edit3 className="w-8 h-8 text-charcoal-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-charcoal-900 text-lg">Manual Entry</h3>
              <p className="text-sm text-charcoal-500 mt-1">
                Enter wine details manually using the form
              </p>
            </div>
          </button>
        </div>
      )}

      {step === 'photo' && (
        <div className="bg-white rounded-xl border border-charcoal-100 p-6">
          <ImageUpload
            onImageCapture={handleImageCapture}
            isProcessing={isProcessing}
          />

          <div className="mt-4 flex justify-between">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep('manual')}
              className="text-sm text-charcoal-500 hover:text-charcoal-700"
            >
              Enter manually instead
            </button>
          </div>
        </div>
      )}

      {step === 'validate' && (
        <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
          {error && (
            <div className="px-6 pt-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Couldn't fully analyze the label
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {error}. Please review and complete the details below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {imageBase64 && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-4 p-4 bg-charcoal-50 rounded-lg">
                <img
                  src={`data:image/jpeg;base64,${imageBase64}`}
                  alt="Wine label"
                  className="w-20 h-28 object-cover rounded-lg shadow-sm"
                />
                <div>
                  <p className="font-medium text-charcoal-900">Label captured</p>
                  <p className="text-sm text-charcoal-500">
                    Review and adjust the extracted details below
                  </p>
                </div>
              </div>
            </div>
          )}

          <WineForm
            initialData={extractedData || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add to Collection"
          />
        </div>
      )}

      {step === 'manual' && (
        <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
          <WineForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add to Collection"
          />
        </div>
      )}

      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Configure Claude API Key"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-charcoal-600">
            To use photo-based wine entry, you need to provide your Claude API key.
            This key is stored locally in your browser and is never sent to any server except Anthropic's API.
          </p>

          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Claude API Key
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            />
          </div>

          <p className="text-xs text-charcoal-500">
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wine-700 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveApiKey}
              disabled={!tempApiKey.trim()}
              className="px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Save API Key
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
