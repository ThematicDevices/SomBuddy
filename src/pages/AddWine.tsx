import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUpload, WineForm } from '../components';
import { useWines, useToast } from '../contexts';
import { extractWineFromImage } from '../utils';
import { WineFormData, createDefaultWine } from '../types';
import { Camera, Edit3, AlertCircle } from 'lucide-react';

type AddStep = 'choose' | 'photo' | 'validate' | 'manual';

export function AddWine() {
  const navigate = useNavigate();
  const { addWine } = useWines();
  const { showToast } = useToast();

  const [step, setStep] = useState<AddStep>('choose');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<WineFormData> | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageCapture = async (base64: string, mimeType: string) => {
    setImageBase64(base64);
    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractWineFromImage(base64, mimeType);
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

  const handleSubmit = async (data: WineFormData) => {
    try {
      const wine = await addWine(data);
      showToast(`${wine.producer} ${wine.wineName || ''} added to your collection!`, 'success');
      navigate(`/wine/${wine.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add wine', 'error');
    }
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
            onClick={() => setStep('photo')}
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
    </div>
  );
}
