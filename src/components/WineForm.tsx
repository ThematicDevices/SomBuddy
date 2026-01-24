import React, { useState } from 'react';
import { WineFormData, wineColorOptions, commonVarietals, createDefaultWine } from '../types';
import { Plus, X, ChevronDown } from 'lucide-react';

interface WineFormProps {
  initialData?: Partial<WineFormData>;
  onSubmit: (data: WineFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  onFormChange?: (data: Partial<WineFormData>) => void;
}

export function WineForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Wine',
  isLoading = false,
  onFormChange
}: WineFormProps) {
  const [formData, setFormData] = useState<WineFormData>({
    ...createDefaultWine(),
    ...initialData,
  });

  // Sync form data with initialData when it changes (for enrichment)
  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const [newVarietal, setNewVarietal] = useState('');
  const [newPairing, setNewPairing] = useState('');
  const [showVarietalSuggestions, setShowVarietalSuggestions] = useState(false);

  const updateField = <K extends keyof WineFormData>(field: K, value: WineFormData[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Notify parent of form changes
      if (onFormChange) {
        onFormChange(newData);
      }
      return newData;
    });
  };

  const addVarietal = () => {
    if (newVarietal.trim() && !formData.varietals.some(v => v.varietal.toLowerCase() === newVarietal.toLowerCase())) {
      updateField('varietals', [...formData.varietals, { varietal: newVarietal.trim() }]);
      setNewVarietal('');
      setShowVarietalSuggestions(false);
    }
  };

  const removeVarietal = (index: number) => {
    updateField('varietals', formData.varietals.filter((_, i) => i !== index));
  };

  const addPairing = () => {
    if (newPairing.trim() && !formData.pairingSuggestions.includes(newPairing.trim())) {
      updateField('pairingSuggestions', [...formData.pairingSuggestions, newPairing.trim()]);
      setNewPairing('');
    }
  };

  const removePairing = (index: number) => {
    updateField('pairingSuggestions', formData.pairingSuggestions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const filteredVarietals = commonVarietals.filter(v =>
    v.toLowerCase().includes(newVarietal.toLowerCase()) &&
    !formData.varietals.some(fv => fv.varietal.toLowerCase() === v.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Producer/Winery *
          </label>
          <input
            type="text"
            required
            value={formData.producer}
            onChange={e => updateField('producer', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Château Margaux"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Wine Name
          </label>
          <input
            type="text"
            value={formData.wineName}
            onChange={e => updateField('wineName', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Grand Cru Classé"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Vintage Year
          </label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.vintage || ''}
            onChange={e => updateField('vintage', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., 2018"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Wine Color *
          </label>
          <div className="relative">
            <select
              required
              value={formData.wineColor}
              onChange={e => updateField('wineColor', e.target.value as WineFormData['wineColor'])}
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors appearance-none bg-white"
            >
              {wineColorOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Region *
          </label>
          <input
            type="text"
            required
            value={formData.region}
            onChange={e => updateField('region', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Bordeaux"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Country *
          </label>
          <input
            type="text"
            required
            value={formData.country}
            onChange={e => updateField('country', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., France"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Appellation
          </label>
          <input
            type="text"
            value={formData.appellation || ''}
            onChange={e => updateField('appellation', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Margaux AOC"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Alcohol Content (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="25"
            value={formData.alcoholContent || ''}
            onChange={e => updateField('alcoholContent', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., 13.5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1">
          Varietals/Grapes
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.varietals.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-wine-50 text-wine-800 rounded-full text-sm"
            >
              {v.varietal}
              <button type="button" onClick={() => removeVarietal(i)} className="p-0.5 hover:bg-wine-100 rounded-full">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={newVarietal}
            onChange={e => {
              setNewVarietal(e.target.value);
              setShowVarietalSuggestions(true);
            }}
            onFocus={() => setShowVarietalSuggestions(true)}
            onBlur={() => setTimeout(() => setShowVarietalSuggestions(false), 200)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addVarietal();
              }
            }}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="Type to add varietal..."
          />
          <button
            type="button"
            onClick={addVarietal}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-400 hover:text-wine-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          {showVarietalSuggestions && newVarietal && filteredVarietals.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-charcoal-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredVarietals.slice(0, 8).map(varietal => (
                <button
                  key={varietal}
                  type="button"
                  onClick={() => {
                    updateField('varietals', [...formData.varietals, { varietal }]);
                    setNewVarietal('');
                    setShowVarietalSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-wine-50 transition-colors"
                >
                  {varietal}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className="border-charcoal-100" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={e => updateField('quantity', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Purchase Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.purchasePrice || ''}
            onChange={e => updateField('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., 45.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            value={formData.purchaseDate || ''}
            onChange={e => updateField('purchaseDate', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Purchased From
          </label>
          <input
            type="text"
            value={formData.purchasedFrom || ''}
            onChange={e => updateField('purchasedFrom', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Wine.com, Local shop"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Storage Location
          </label>
          <input
            type="text"
            value={formData.storageLocation || ''}
            onChange={e => updateField('storageLocation', e.target.value)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., Cellar - Rack A2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Drinking Window Start (Year)
          </label>
          <input
            type="number"
            min="1900"
            max="2100"
            value={formData.drinkingWindowStart || ''}
            onChange={e => updateField('drinkingWindowStart', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., 2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-1">
            Drinking Window End (Year)
          </label>
          <input
            type="number"
            min="1900"
            max="2100"
            value={formData.drinkingWindowEnd || ''}
            onChange={e => updateField('drinkingWindowEnd', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="e.g., 2035"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1">
          Food Pairings
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.pairingSuggestions.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gold-50 text-gold-800 rounded-full text-sm"
            >
              {p}
              <button type="button" onClick={() => removePairing(i)} className="p-0.5 hover:bg-gold-100 rounded-full">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={newPairing}
            onChange={e => setNewPairing(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPairing();
              }
            }}
            className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors"
            placeholder="Type to add pairing (e.g., Beef, Lamb)..."
          />
          <button
            type="button"
            onClick={addPairing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-400 hover:text-gold-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1">
          Why Purchased / Notes
        </label>
        <textarea
          value={formData.whyPurchased || ''}
          onChange={e => updateField('whyPurchased', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors resize-none"
          placeholder="Any notes about why you bought this wine, special occasions, etc."
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-wine-900 hover:bg-wine-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
