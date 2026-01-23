import React, { useState, useRef } from 'react';
import { useApiKey, useWines, useToast } from '../contexts';
import { storage } from '../utils';
import { Key, Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';
import { Modal } from '../components';

export function Settings() {
  const { apiKey, setApiKey, clearApiKey, isConfigured } = useApiKey();
  const { wines, refreshWines } = useWines();
  const { showToast } = useToast();

  const [newApiKey, setNewApiKey] = useState('');
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveApiKey = () => {
    if (newApiKey.trim()) {
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      showToast('API key saved successfully', 'success');
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    showToast('API key removed', 'info');
  };

  const handleExport = () => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sommelier-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Collection exported successfully', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = storage.importData(content);
      if (result.success) {
        refreshWines();
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllData = () => {
    localStorage.clear();
    refreshWines();
    setShowClearDataModal(false);
    showToast('All data cleared', 'info');
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-charcoal-900">Settings</h1>
        <p className="text-charcoal-500">Manage your API key and collection data</p>
      </div>

      <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
        <div className="p-6 border-b border-charcoal-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-wine-50 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-wine-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-charcoal-900">Claude API Key</h2>
              <p className="text-sm text-charcoal-500">
                Required for photo recognition and sommelier features
              </p>
            </div>
          </div>

          {isConfigured ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-800 font-medium">API key configured</span>
                <span className="text-xs text-green-600 ml-auto">
                  ••••••••{apiKey?.slice(-8)}
                </span>
              </div>
              <button
                onClick={handleClearApiKey}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove API key
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Enter your Claude API Key
                </label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={e => setNewApiKey(e.target.value)}
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
              <button
                onClick={handleSaveApiKey}
                disabled={!newApiKey.trim()}
                className="px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Save API Key
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-b border-charcoal-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-charcoal-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-charcoal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-charcoal-900">Collection Data</h2>
              <p className="text-sm text-charcoal-500">
                {wines.length} wines in your collection
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={wines.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Collection
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Collection
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        <div className="p-6 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              <p className="text-sm text-red-700">
                Permanently delete all your data
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowClearDataModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>

      <div className="bg-charcoal-50 rounded-xl p-6 text-center">
        <p className="text-sm text-charcoal-500">
          Sommelier - Your Personal Wine Catalog
        </p>
        <p className="text-xs text-charcoal-400 mt-1">
          All data is stored locally in your browser
        </p>
      </div>

      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title="Clear All Data"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              This will permanently delete all your wines, tasting notes, and chat history.
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearDataModal(false)}
              className="px-4 py-2 text-charcoal-600 hover:text-charcoal-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
