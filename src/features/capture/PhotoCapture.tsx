import React, { useState, useRef } from 'react';
import { CaptureResponse } from '../../types/api';
import { capturePhoto } from '../../services/captureService';
import { Camera, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface PhotoCaptureProps {
  facilityId: string;
  onCaptureSuccess: (res: CaptureResponse) => void;
  headers: Record<string, string>;
  disabled?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  facilityId,
  onCaptureSuccess,
  headers,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('File is too large (>8 MB). Please select or shoot a smaller image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRetake = () => {
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
      const response = await capturePhoto(
        {
          image: selectedFile,
          facility_id: facilityId,
        },
        headers
      );
      onCaptureSuccess(response);
    } catch (err: any) {
      console.error('Photo submission error:', err);
      if (err.status === 413) {
        setErrorMessage('File is too large (>8 MB). Please choose a smaller image.');
      } else {
        setErrorMessage(err.message || 'Failed to process photo register capture.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-medex-surface/40 border border-medex-border rounded-xl text-center space-y-6">
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
        <div className="flex flex-col items-center space-y-4 my-2">
          <div className="w-24 h-24 rounded-full bg-medex-cyan/15 border border-medex-cyan/30 flex items-center justify-center text-medex-cyan">
            <Camera className="w-10 h-10" />
          </div>

          <p className="text-xs text-medex-secondary max-w-sm">
            Capture a photo of your PHC Stock Register or physical medicine shelf. Max size 8 MB.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={`px-5 py-2.5 rounded-lg bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo / Upload Image</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-medex-border bg-medex-bg">
            <img
              src={previewUrl}
              alt="Stock register preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-medex-bg/80 text-2xs font-mono text-medex-cyan">
              PREVIEW READY
            </div>
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isProcessing}
              className="px-4 py-2 rounded-md bg-medex-surface border border-medex-border text-medex-secondary font-semibold text-xs inline-flex items-center gap-1.5 hover:text-medex-primary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handlePhotoSubmit}
              disabled={isProcessing || disabled}
              className="px-5 py-2 rounded-md bg-medex-cyan text-medex-bg font-bold text-xs inline-flex items-center gap-1.5 hover:brightness-110 shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Capture...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Use Photo & Extract</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-medex-red/15 border border-medex-red/30 rounded-lg text-xs text-medex-red-light flex items-center gap-2 max-w-md text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
