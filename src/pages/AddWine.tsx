import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ImageUpload, WineForm } from '../components';
import { useWines, useToast } from '../contexts';
import { extractWineFromImage, enrichWineData } from '../utils';
import { WineFormData, createDefaultWine } from '../types';
import { Camera, Edit3, AlertCircle, Sparkles, Loader2, Images } from 'lucide-react';

type AddStep = 'choose' | 'photo' | 'validate' | 'manual';

export function AddWine() {
  const navigate = useNavigate();
  const { addWine } = useWines();
  const { showToast } = useToast();

  const [step, setStep] = useState<AddStep>('choose');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<WineFormData> | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualFormData, setManualFormData] = useState<Partial<WineFormData>>(createDefaultWine());

  const handleImageCapture = async (base64: string, mimeType: string) => {
    setImageBase64(base64);
    setIsProcessing(true);
    setError(null);

    try {
      const data = await extractWineFromImage(base64, mimeType);

      // Map extracted data to form fields, including new fields
      const formData: Partial<WineFormData> = {
        producer: data.producer,
        wineName: data.wineName,
        vintage: data.vintage,
        region: data.region,
        subRegion: data.subRegion,
        country: data.country,
        appellation: data.appellation,
        varietals: data.varietals,
        wineColor: data.wineColor,
        alcoholContent: data.alcoholContent,
        labelImageBase64: base64,
        // New fields from enhanced extraction
        purchasePrice: data.estimatedPrice,
        estimatedValue: data.estimatedPrice,
        drinkingWindowStart: data.drinkingWindowStart,
        drinkingWindowEnd: data.drinkingWindowEnd,
        pairingSuggestions: data.pairingSuggestions || [],
        story: data.story,
      };

      setExtractedData(formData);
      setStep('validate');
      showToast('Wine label analyzed with tasting notes and recommendations!', 'success');
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

  const handleEnrichManualEntry = async () => {
    if (!manualFormData.producer && !manualFormData.wineName) {
      showToast('Please enter at least a producer or wine name first', 'error');
      return;
    }

    setIsEnriching(true);

    try {
      const enrichedData = await enrichWineData({
        producer: manualFormData.producer,
        wineName: manualFormData.wineName,
        vintage: manualFormData.vintage,
        region: manualFormData.region,
        country: manualFormData.country,
        varietals: manualFormData.varietals,
      });

      // Merge enriched data with existing form data, preferring user-entered values
      setManualFormData(prev => ({
        ...prev,
        // Only fill in fields that are empty
        region: prev.region || enrichedData.region,
        subRegion: prev.subRegion || enrichedData.subRegion,
        country: prev.country || enrichedData.country,
        appellation: prev.appellation || enrichedData.appellation,
        varietals: prev.varietals?.length ? prev.varietals : enrichedData.varietals,
        wineColor: prev.wineColor || enrichedData.wineColor,
        alcoholContent: prev.alcoholContent || enrichedData.alcoholContent,
        // These fields are usually not entered manually, so we can fill them
        purchasePrice: prev.purchasePrice || enrichedData.estimatedPrice,
        estimatedValue: prev.estimatedValue || enrichedData.estimatedPrice,
        drinkingWindowStart: prev.drinkingWindowStart || enrichedData.drinkingWindowStart,
        drinkingWindowEnd: prev.drinkingWindowEnd || enrichedData.drinkingWindowEnd,
        pairingSuggestions: prev.pairingSuggestions?.length ? prev.pairingSuggestions : (enrichedData.pairingSuggestions || []),
        story: prev.story || enrichedData.story,
      }));

      showToast('Wine details enriched with tasting notes and recommendations!', 'success');
    } catch (err) {
      console.error('Error enriching wine data:', err);
      showToast(err instanceof Error ? err.message : 'Failed to enrich wine data', 'error');
    } finally {
      setIsEnriching(false);
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
      setManualFormData(createDefaultWine());
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
        <div className="space-y-4">
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
                  Take a photo of the label and let AI extract details, tasting notes, and recommendations
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
                  Enter wine name and let AI fill in tasting notes, drinking window, and pairings
                </p>
              </div>
            </button>
          </div>

          <Link
            to="/add/batch"
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-wine-50 to-gold-50 rounded-xl border-2 border-wine-100 hover:border-wine-300 transition-all group"
          >
            <div className="w-10 h-10 bg-wine-100 rounded-full flex items-center justify-center group-hover:bg-wine-200 transition-colors">
              <Images className="w-5 h-5 text-wine-700" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-charcoal-900">Batch Upload</h3>
              <p className="text-sm text-charcoal-500">
                Add multiple wines at once (up to 10 images)
              </p>
            </div>
          </Link>
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
                {extractedData?.story && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Tasting notes and recommendations included
                    </p>
                  )}
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
          <div className="px-6 pt-6">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-wine-50 to-gold-50 border border-wine-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-wine-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal-800">
                  AI-Powered Wine Details
                </p>
                <p className="text-sm text-charcoal-600 mt-1">
                  Enter the producer and wine name, then click the button below to auto-fill tasting notes, drinking window, food pairings, and more.
                </p>
                <button
                  onClick={handleEnrichManualEntry}
                  disabled={isEnriching || (!manualFormData.producer && !manualFormData.wineName)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-wine-900 hover:bg-wine-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing wine...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Fill in Details with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <WineForm
            initialData={manualFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add to Collection"
            onFormChange={setManualFormData}
          />
        </div>
      )}
    </div>
  );
}
