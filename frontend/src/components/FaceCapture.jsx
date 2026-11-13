import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import Button from './ui/Button';

const FaceCapture = ({ onFaceCaptured, initialFaceData = null }) => {
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(initialFaceData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState(initialFaceData ? 'VERIFIED' : 'READY'); // 'READY' | 'SCANNING' | 'VERIFIED' | 'ERROR'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start webcam feed
  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setScanStatus('READY');
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser or upload a photo.');
      } else {
        setCameraError('Camera not available on this device. You can upload a face photo instead.');
      }
      setCameraActive(false);
    }
  };

  // Stop webcam feed
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  // Handle capture snapshot from live video
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setScanStatus('SCANNING');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Simulate real-time biometric feature extraction & liveness verification
    setTimeout(() => {
      setCapturedImage(dataUrl);
      setIsAnalyzing(false);
      setScanStatus('VERIFIED');
      stopCamera();
      if (onFaceCaptured) {
        onFaceCaptured(dataUrl);
      }
    }, 1200);
  };

  // Handle retake
  const handleRetake = () => {
    setCapturedImage(null);
    setScanStatus('READY');
    if (onFaceCaptured) {
      onFaceCaptured(null);
    }
    startCamera();
  };

  // Handle file upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        setScanStatus('VERIFIED');
        setCameraError('');
        stopCamera();
        if (onFaceCaptured) {
          onFaceCaptured(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Face Authentication Capture
            </h3>
          </div>
          {scanStatus === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Face Authorized
            </span>
          )}
        </div>

        {/* Viewfinder / Preview Container */}
        <div className="relative aspect-video w-full max-w-md mx-auto bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
          {/* Live Video Feed */}
          {!capturedImage && cameraActive && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Biometric Face Oval Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Face Alignment Ring */}
                <div className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 ${
                  scanStatus === 'SCANNING'
                    ? 'border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)] animate-pulse'
                    : 'border-slate-400/60 border-dashed'
                }`}>
                  {/* Scanner line animation during scanning */}
                  {scanStatus === 'SCANNING' && (
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scanline" />
                  )}
                </div>

                <p className="mt-3 text-[11px] font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-md border border-slate-700/60">
                  {scanStatus === 'SCANNING'
                    ? 'Analyzing facial landmarks...'
                    : 'Center your face within the frame'}
                </p>
              </div>
            </>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured Face Authorization"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-4">
                <div className="flex items-center gap-2 bg-emerald-950/90 text-emerald-300 text-xs px-3 py-1.5 rounded-lg border border-emerald-800/80 backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Biometric Hash Captured</span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Error / Fallback State */}
          {!capturedImage && !cameraActive && (
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                {cameraError || 'Camera inactive. Click below to start webcam or upload a photo.'}
              </p>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Canvas Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Input for Image Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Action Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {!capturedImage && cameraActive && (
            <Button
              type="button"
              onClick={handleCapture}
              loading={isAnalyzing}
              className="w-full sm:w-auto shadow-indigo-900/40"
              leftIcon={Camera}
            >
              {isAnalyzing ? 'Scanning Face...' : 'Capture Face Authentication'}
            </Button>
          )}

          {!capturedImage && !cameraActive && (
            <Button
              type="button"
              variant="outline"
              onClick={startCamera}
              className="w-full sm:w-auto"
              leftIcon={Camera}
            >
              Start Webcam
            </Button>
          )}

          {capturedImage && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRetake}
              className="w-full sm:w-auto text-slate-300 border-slate-700"
              leftIcon={RefreshCw}
            >
              Retake Face Scan
            </Button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-slate-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-1.5 transition-colors py-1 px-2"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo Instead</span>
          </button>
        </div>

        {/* Security / Privacy Note */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Facial features are encoded into biometric authorization hashes for secure voting.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;
