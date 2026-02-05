import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, FileText, X, Loader2, FileUp } from 'lucide-react';
import { fileToBase64 } from '../utils';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type InputMode = 'photo' | 'text' | 'pdf';

interface WineListInputProps {
  onWineListCapture: (data: { image?: string; mimeType?: string; text?: string }) => void;
  isProcessing?: boolean;
}

/**
 * Extract text from a PDF file using pdf.js
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: { str?: string }) => item.str || '')
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

export function WineListInput({ onWineListCapture, isProcessing = false }: WineListInputProps) {
  const [mode, setMode] = useState<InputMode>('photo');
  const [preview, setPreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedText, setHasSubmittedText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
      onWineListCapture({ image: base64, mimeType: file.type });
    } catch (err) {
      setError('Failed to process image');
      console.error(err);
    }
  }, [onWineListCapture]);

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

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError('Please enter the wine list');
      return;
    }
    setError(null);
    setHasSubmittedText(true);
    onWineListCapture({ text: textInput.trim() });
  };

  const clearInput = () => {
    setPreview(null);
    setTextInput('');
    setError(null);
    setHasSubmittedText(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onWineListCapture({});
  };

  // Show preview state for photo mode
  if (mode === 'photo' && preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Wine list preview"
          className="w-full max-h-80 object-contain rounded-lg border border-charcoal-200"
        />
        {isProcessing ? (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-wine-900 animate-spin" />
            <p className="text-sm font-medium text-charcoal-700">Analyzing wine list...</p>
          </div>
        ) : (
          <button
            onClick={clearInput}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        )}
      </div>
    );
  }

  // Show confirmed state for text mode
  if (mode === 'text' && hasSubmittedText) {
    return (
      <div className="relative">
        <div className="p-4 bg-charcoal-50 rounded-lg border border-charcoal-200 max-h-80 overflow-y-auto">
          <pre className="text-sm text-charcoal-700 whitespace-pre-wrap font-sans">
            {textInput}
          </pre>
        </div>
        {isProcessing ? (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-wine-900 animate-spin" />
            <p className="text-sm font-medium text-charcoal-700">Analyzing wine list...</p>
          </div>
        ) : (
          <button
            onClick={clearInput}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex border-b border-charcoal-200">
        <button
          type="button"
          onClick={() => {
            setMode('photo');
            setError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'photo'
              ? 'border-wine-900 text-wine-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          Photo
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('pdf');
            setError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'pdf'
              ? 'border-wine-900 text-wine-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
          }`}
        >
          <FileUp className="w-4 h-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('text');
            setError(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'text'
              ? 'border-wine-900 text-wine-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Text
        </button>
      </div>

      {/* Photo upload mode */}
      {mode === 'photo' && (
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
              Take a photo or upload an image of the restaurant's wine list
            </p>
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
      )}

      {/* Text paste mode */}
      {mode === 'text' && (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Paste the wine list here, for example:

RED WINES
2019 Caymus Cabernet Sauvignon, Napa Valley - $145
2020 Silver Oak Alexander Valley Cabernet - $180
2018 Opus One, Napa Valley - $450

WHITE WINES
2022 Rombauer Chardonnay, Carneros - $75
2021 Cloudy Bay Sauvignon Blanc, Marlborough - $65`}
            className="w-full h-48 px-4 py-3 border border-charcoal-200 rounded-xl text-sm focus:ring-2 focus:ring-wine-500 focus:border-wine-500 outline-none transition-colors resize-none"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="w-full px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            Use This Wine List
          </button>
        </div>
      )}

      {/* PDF upload mode */}
      {mode === 'pdf' && !pdfText && (
        <div
          onDrop={async (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
              setIsExtractingPdf(true);
              setError(null);
              try {
                const text = await extractTextFromPdf(file);
                setPdfFileName(file.name);
                setPdfText(text);
              } catch (err) {
                setError('Failed to extract text from PDF');
                console.error(err);
              } finally {
                setIsExtractingPdf(false);
              }
            } else {
              setError('Please select a PDF file');
            }
          }}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-charcoal-200 rounded-xl p-8 text-center hover:border-wine-300 transition-colors"
        >
          {isExtractingPdf ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-wine-700 animate-spin" />
              <p className="text-sm font-medium text-charcoal-700">Extracting text from PDF...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 bg-wine-50 rounded-xl hover:bg-wine-100 transition-colors mx-auto"
              >
                <FileUp className="w-8 h-8 text-wine-700" />
                <span className="text-sm font-medium text-wine-800">Upload PDF</span>
              </button>

              <p className="text-sm text-charcoal-500">
                Upload a PDF of the restaurant's wine list
              </p>
            </div>
          )}

          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsExtractingPdf(true);
                setError(null);
                try {
                  const text = await extractTextFromPdf(file);
                  setPdfFileName(file.name);
                  setPdfText(text);
                } catch (err) {
                  setError('Failed to extract text from PDF');
                  console.error(err);
                } finally {
                  setIsExtractingPdf(false);
                }
              }
            }}
            className="hidden"
          />
        </div>
      )}

      {/* PDF extracted - show preview */}
      {mode === 'pdf' && pdfText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-charcoal-600 mb-2">
            <FileUp className="w-4 h-4" />
            <span className="font-medium">{pdfFileName}</span>
          </div>
          <div className="p-4 bg-charcoal-50 rounded-lg border border-charcoal-200 max-h-48 overflow-y-auto">
            <pre className="text-xs text-charcoal-700 whitespace-pre-wrap font-sans">
              {pdfText.length > 1000 ? `${pdfText.slice(0, 1000)}...` : pdfText}
            </pre>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPdfFileName(null);
                setPdfText(null);
                if (pdfInputRef.current) pdfInputRef.current.value = '';
              }}
              className="flex-1 px-4 py-2 border border-charcoal-300 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-colors font-medium text-sm"
            >
              Choose Different PDF
            </button>
            <button
              type="button"
              onClick={() => {
                onWineListCapture({ text: pdfText });
              }}
              className="flex-1 px-4 py-2 bg-wine-900 text-white rounded-lg hover:bg-wine-800 transition-colors font-medium text-sm"
            >
              Use This Wine List
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium text-center">{error}</p>
      )}
    </div>
  );
}
