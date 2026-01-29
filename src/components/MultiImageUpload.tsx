import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, ImagePlus, AlertCircle } from 'lucide-react';
import { fileToBase64 } from '../utils';

export interface ImageItem {
  id: string;
  file: File;
  base64: string;
  mimeType: string;
  preview: string;
}

interface MultiImageUploadProps {
  onImagesSelected: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  onImagesSelected,
  maxImages = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const newImages: ImageItem[] = [];

    const remainingSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    if (fileArray.length > remainingSlots) {
      newErrors.push(`Only ${remainingSlots} more image(s) can be added. Maximum is ${maxImages}.`);
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        newErrors.push(`"${file.name}" is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        newErrors.push(`"${file.name}" exceeds 10MB limit`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const preview = `data:${file.type};base64,${base64}`;

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          file,
          base64,
          mimeType: file.type,
          preview,
        });
      } catch (err) {
        newErrors.push(`Failed to process "${file.name}"`);
        console.error(err);
      }
    }

    setErrors(newErrors);

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesSelected(updatedImages);
    }
  }, [images, maxImages, onImagesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  const clearAll = () => {
    setImages([]);
    setErrors([]);
    onImagesSelected([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-charcoal-700">
              {images.length} of {maxImages} images selected
            </p>
            <button
              onClick={clearAll}
              disabled={disabled}
              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-[3/4] rounded-lg overflow-hidden border border-charcoal-200 group"
              >
                <img
                  src={image.preview}
                  alt={`Wine label ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <span className="absolute top-1 left-1 bg-charcoal-900/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                {!disabled && (
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5 text-charcoal-600" />
                  </button>
                )}
              </div>
            ))}

            {images.length < maxImages && !disabled && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-charcoal-200 hover:border-wine-300 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <ImagePlus className="w-6 h-6 text-charcoal-400" />
                <span className="text-xs text-charcoal-500">Add more</span>
              </button>
            )}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            disabled
              ? 'border-charcoal-100 bg-charcoal-50'
              : 'border-charcoal-200 hover:border-wine-300'
          }`}
        >
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled}
                className="flex flex-col items-center gap-2 p-4 bg-wine-50 rounded-xl hover:bg-wine-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-8 h-8 text-wine-700" />
                <span className="text-sm font-medium text-wine-800">Take Photos</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex flex-col items-center gap-2 p-4 bg-charcoal-50 rounded-xl hover:bg-charcoal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-8 h-8 text-charcoal-600" />
                <span className="text-sm font-medium text-charcoal-700">Upload Images</span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-charcoal-500">
                Select up to {maxImages} wine label images
              </p>
              <p className="text-xs text-charcoal-400">
                Drag and drop or click to browse • Max 10MB per image
              </p>
            </div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
