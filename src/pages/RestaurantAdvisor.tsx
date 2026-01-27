import { useState } from 'react';
import { useWines, useToast } from '../contexts';
import { getRestaurantRecommendation } from '../utils';
import { WineListInput, RecommendationCard } from '../components';
import { RestaurantAnalysis, Wine, WineComparison } from '../types';
import {
  UtensilsCrossed,
  Loader2,
  AlertCircle,
  Wine as WineIcon,
  DollarSign,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { formatPrice, getWineDisplayName } from '../utils';

export function RestaurantAdvisor() {
  const { wines } = useWines();
  const { showToast } = useToast();

  const [restaurantName, setRestaurantName] = useState('');
  const [corkageFee, setCorkageFee] = useState<string>('35');
  const [mealDescription, setMealDescription] = useState('');
  const [wineListData, setWineListData] = useState<{
    image?: string;
    mimeType?: string;
    text?: string;
  }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RestaurantAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasWineList = !!(wineListData.image || wineListData.text);

  const handleAnalyze = async () => {
    if (!restaurantName.trim()) {
      showToast('Please enter the restaurant name', 'error');
      return;
    }

    if (!hasWineList) {
      showToast('Please upload or paste the wine list', 'error');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await getRestaurantRecommendation(
        restaurantName.trim(),
        parseFloat(corkageFee) || 0,
        wines,
        wineListData.image,
        wineListData.mimeType,
        wineListData.text,
        mealDescription.trim() || undefined
      );

      setAnalysis(result);
      showToast('Analysis complete!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze wine list';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setWineListData({});
    setError(null);
  };

  const getCollectionWineName = (comparison: WineComparison): string | undefined => {
    const collectionWineId = comparison.collectionWine?.id;
    if (!collectionWineId) return undefined;
    const wine = wines.find((w: Wine) => w.id === collectionWineId);
    return wine ? getWineDisplayName(wine) : undefined;
  };

  // Empty collection state
  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-wine-50 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-12 h-12 text-wine-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-charcoal-900 mb-2">
          Add Wines First
        </h2>
        <p className="text-charcoal-500 text-center max-w-md">
          To get restaurant wine recommendations, you need to have wines in your collection.
          Add some wines first, then come back to compare.
        </p>
      </div>
    );
  }

  // Analysis results view
  if (analysis) {
    const bringRecommendations = analysis.recommendations.filter(r => r.recommendation === 'bring');
    const buyRecommendations = analysis.recommendations.filter(r => r.recommendation === 'buy');

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal-900">
              {analysis.restaurantName || restaurantName}
            </h1>
            <p className="text-charcoal-500">
              Wine selection recommendations
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-charcoal-600 hover:text-charcoal-800 hover:bg-charcoal-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <WineIcon className="w-5 h-5 text-green-700" />
              <span className="text-sm font-medium text-green-800">Bring from Cellar</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{analysis.bringFromCellarCount}</p>
          </div>

          <div className="bg-charcoal-50 rounded-xl p-4 border border-charcoal-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-charcoal-600" />
              <span className="text-sm font-medium text-charcoal-700">Buy at Restaurant</span>
            </div>
            <p className="text-2xl font-bold text-charcoal-900">{analysis.buyAtRestaurantCount}</p>
          </div>

          <div className="bg-gold-50 rounded-xl p-4 border border-gold-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-gold-700" />
              <span className="text-sm font-medium text-gold-800">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-gold-900">{formatPrice(analysis.totalPotentialSavings)}</p>
          </div>
        </div>

        {/* Summary text */}
        {analysis.summary && (
          <div className="bg-white rounded-xl border border-charcoal-100 p-5">
            <h3 className="font-semibold text-charcoal-900 mb-2">Sommelier's Recommendation</h3>
            <p className="text-charcoal-700 whitespace-pre-wrap">{analysis.summary}</p>
          </div>
        )}

        {/* Bring from cellar section */}
        {bringRecommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-charcoal-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm">🍷</span>
              Bring from Your Cellar ({bringRecommendations.length})
            </h3>
            <div className="space-y-4">
              {bringRecommendations.map((comparison, index) => (
                <RecommendationCard
                  key={index}
                  comparison={comparison}
                  collectionWineName={getCollectionWineName(comparison)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Buy at restaurant section */}
        {buyRecommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-charcoal-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-charcoal-100 rounded-full flex items-center justify-center text-sm">🏪</span>
              Buy at Restaurant ({buyRecommendations.length})
            </h3>
            <div className="space-y-4">
              {buyRecommendations.map((comparison, index) => (
                <RecommendationCard
                  key={index}
                  comparison={comparison}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Input form view
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900">Restaurant Wine Advisor</h1>
        <p className="text-charcoal-500">
          Compare restaurant wine prices with your collection to find the best value
        </p>
      </div>

      <div className="bg-white rounded-xl border border-charcoal-100 p-6 space-y-6">
        {/* Restaurant info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="restaurantName" className="block text-sm font-medium text-charcoal-700 mb-1">
              Restaurant Name
            </label>
            <input
              id="restaurantName"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g., The French Laundry"
              className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="corkageFee" className="block text-sm font-medium text-charcoal-700 mb-1">
                Corkage Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400">$</span>
                <input
                  id="corkageFee"
                  type="number"
                  value={corkageFee}
                  onChange={(e) => setCorkageFee(e.target.value)}
                  placeholder="35"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mealDescription" className="block text-sm font-medium text-charcoal-700 mb-1">
                What are you eating? <span className="text-charcoal-400">(optional)</span>
              </label>
              <input
                id="mealDescription"
                type="text"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="e.g., Ribeye steak, oysters"
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Wine list input */}
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Restaurant Wine List
          </label>
          <WineListInput
            onWineListCapture={setWineListData}
            isProcessing={isAnalyzing}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Analysis failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Collection info */}
        <div className="flex items-center gap-3 p-4 bg-wine-50 rounded-lg">
          <WineIcon className="w-5 h-5 text-wine-700" />
          <p className="text-sm text-wine-800">
            Comparing against <span className="font-semibold">{wines.length} wines</span> in your collection
          </p>
        </div>

        {/* Submit button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !restaurantName.trim() || !hasWineList}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Wine List...
            </>
          ) : (
            <>
              <UtensilsCrossed className="w-5 h-5" />
              Compare & Recommend
            </>
          )}
        </button>
      </div>
    </div>
  );
}
