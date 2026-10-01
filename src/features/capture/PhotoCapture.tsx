import React, { useState, useRef } from 'react';
import { CaptureResponse } from '../../types/api';
import { capturePhoto } from '../../services/captureService';
import { Camera, Loader2, AlertCircle, RefreshCw, Check, Upload, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface PhotoCaptureProps {
  facilityId: string;
  onCaptureSuccess: (res: CaptureResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

type StagedStage = 'idle' | 'uploading' | 'ocr' | 'matching';

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  facilityId,
  onCaptureSuccess,
  headers,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stage, setStage] = useState<StagedStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Invalid file type. Please select an image (JPEG, PNG, WEBP).');
      return;
    }

    // Validate size (8 MB limit)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image is too large (>8 MB limit). Please upload or take a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoSubmit = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Staged progress simulation
      setStage('uploading');
      await new Promise((res) => setTimeout(res, 600));

      setStage('ocr');
      await new Promise((res) => setTimeout(res, 700));

      setStage('matching');
      await new Promise((res) => setTimeout(res, 600));

      const response = await capturePhoto(
        {
          image: selectedFile,
          facility_id: facilityId,
        },
        headers
      );

      setStage('idle');
      onCaptureSuccess(response);
    } catch (err: any) {
      console.error('Photo submission error:', err);
      setStage('idle');
      if (err.status === 413) {
        setErrorMessage('File is too large (>8 MB limit). Please choose a smaller image.');
      } else {
        setErrorMessage(err.message || 'Failed to process photo register capture.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-theme-surface/40 border border-theme-border rounded-xl text-center space-y-6 w-full max-w-xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer w-full ${
            isDragOver
              ? 'border-theme-primary bg-theme-primary-tint/30 scale-[1.01]'
              : 'border-theme-border bg-theme-bg/60 hover:border-theme-primary/50'
          }`}
        >
          <div className="w-20 h-20 rounded-full bg-theme-primary-tint text-theme-primary flex items-center justify-center mb-4">
            <Camera className="w-9 h-9" />
          </div>

          <h3 className="text-sm font-bold text-theme-text mb-1">
            Tap to Take Photo or Drag Image Here
          </h3>
          <p className="text-xs text-theme-muted max-w-xs mb-4">
            Capture a picture of your physical stock register page or medicine shelf. Max size 8 MB.
          </p>

          <Button
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
            className="min-h-[44px]"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span>Select Image / Open Camera</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Preview Image Container */}
          <div className="relative w-full h-56 rounded-xl overflow-hidden border border-theme-border bg-theme-bg shadow-md">
            <img
              src={previewUrl}
              alt="Stock register preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-theme-surface/90 border border-theme-border text-2xs font-mono font-bold text-theme-primary">
              IMAGE READY
            </div>
          </div>

          {/* Staged Progress Indicator during processing */}
          {isProcessing && (
            <div className="w-full bg-theme-bg p-4 rounded-xl border border-theme-border space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-theme-text">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-theme-primary" />
                  Staged Processing
                </span>
                <span className="text-theme-primary uppercase">{stage}</span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
                <div
                  className={`p-2 rounded border transition-all ${
                    stage === 'uploading'
                      ? 'bg-theme-primary-tint text-theme-primary border-theme-primary font-bold'
                      : stage === 'ocr' || stage === 'matching'
                      ? 'bg-theme-healthy-bg text-theme-healthy border-theme-healthy/30'
                      : 'bg-theme-surface text-theme-muted border-theme-border'
                  }`}
                >
                  1. Uploading
                </div>
                <div
                  className={`p-2 rounded border transition-all ${
                    stage === 'ocr'
                      ? 'bg-theme-primary-tint text-theme-primary border-theme-primary font-bold'
                      : stage === 'matching'
                      ? 'bg-theme-healthy-bg text-theme-healthy border-theme-healthy/30'
                      : 'bg-theme-surface text-theme-muted border-theme-border'
                  }`}
                >
                  2. Reading OCR
                </div>
                <div
                  className={`p-2 rounded border transition-all ${
                    stage === 'matching'
                      ? 'bg-theme-primary-tint text-theme-primary border-theme-primary font-bold'
                      : 'bg-theme-surface text-theme-muted border-theme-border'
                  }`}
                >
                  3. Matching Drugs
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Replace, Remove, Extract */}
          <div className="flex flex-wrap items-center gap-3 w-full justify-center">
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Replace</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleRemove}
              disabled={isProcessing}
              className="min-h-[44px] text-theme-critical hover:text-theme-critical flex-1 sm:flex-initial"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Remove</span>
            </Button>

            <Button
              variant="primary"
              onClick={handlePhotoSubmit}
              disabled={isProcessing || disabled}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  <span>Confirm & Extract Stock</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-3 bg-theme-critical-bg border border-theme-critical/40 rounded-lg text-xs text-theme-critical-text flex items-center gap-2 max-w-md text-left font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

