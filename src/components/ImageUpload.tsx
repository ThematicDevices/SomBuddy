import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { fileToBase64 } from '../utils';

interface ImageUploadProps {
  onImageCapture: (base64: string, mimeType: string) => void;
  isProcessing?: boolean;
}

export function ImageUpload({ onImageCapture, isProcessing = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPreview(`data:${file.type};base64,${base64}`);
      onImageCapture(base64, file.type);
    } catch (err) {
      setError('Failed to process image');
      console.error(err);
    }
  }, [onImageCapture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Wine label preview"
          className="w-full max-h-80 object-contain rounded-lg border border-charcoal-200"
        />
        {isProcessing ? (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-wine-900 animate-spin" />
            <p className="text-sm font-medium text-charcoal-700">Analyzing label...</p>
          </div>
        ) : (
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-charcoal-200 rounded-xl p-8 text-center hover:border-wine-300 transition-colors"
    >
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 bg-wine-50 rounded-xl hover:bg-wine-100 transition-colors"
          >
            <Camera className="w-8 h-8 text-wine-700" />
            <span className="text-sm font-medium text-wine-800">Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 bg-charcoal-50 rounded-xl hover:bg-charcoal-100 transition-colors"
          >
            <Upload className="w-8 h-8 text-charcoal-600" />
            <span className="text-sm font-medium text-charcoal-700">Upload Image</span>
          </button>
        </div>

        <p className="text-sm text-charcoal-500">
          Take a photo or upload an image of your wine label
        </p>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
