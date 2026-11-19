import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Zap,
  ZapOff,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { EventConfig, FrameTemplate } from '../types';
import { FrameOverlay } from './FrameOverlay';
import { playCountdownBeep, playShutterSound, playSuccessChime } from '../utils/audio';
import { composePhotoboothImage } from '../utils/canvasComposer';

interface CameraCaptureScreenProps {
  frame: FrameTemplate;
  availableFrames: FrameTemplate[];
  config: EventConfig;
  onPhotoCaptured: (dataUrl: string) => void;
  onBack: () => void;
  onSwitchFrame: (frame: FrameTemplate) => void;
}

export const CameraCaptureScreen: React.FC<CameraCaptureScreenProps> = ({
  frame,
  availableFrames,
  config,
  onPhotoCaptured,
  onBack,
  onSwitchFrame,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [useFlash, setUseFlash] = useState(true);
  const [isComposing, setIsComposing] = useState(false);

  // Initialize Camera stream
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: mode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1440, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err: any) {
      console.warn('Camera access failed, trying fallback constraints:', err);
      try {
        // Fallback with minimal video constraints
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setIsLoadingCamera(false);
      } catch (fallbackErr: any) {
        console.error('Complete camera error:', fallbackErr);
        setCameraError(
          fallbackErr.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda.'
            : 'Tidak dapat mengakses perangkat kamera. Pastikan kamera tidak digunakan oleh aplikasi lain.'
        );
        setIsLoadingCamera(false);
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Perform Capture
  const handleExecuteCapture = async () => {
    if (!videoRef.current) return;
    setIsComposing(true);

    if (useFlash) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 450);
    }

    playShutterSound();

    try {
      const dataUrl = await composePhotoboothImage({
        videoOrImage: videoRef.current,
        frame,
        config,
        mirrored: facingMode === 'user',
      });

      playSuccessChime();
      onPhotoCaptured(dataUrl);
    } catch (e: any) {
      console.error('Error generating photo:', e);
      alert('Gagal mengambil gambar: ' + (e.message || 'Error tidak diketahui'));
    } finally {
      setIsComposing(false);
      setCountdown(null);
    }
  };

  // Trigger 3s countdown before snapping
  const triggerCountdownCapture = () => {
    if (countdown !== null || isComposing) return;

    let count = 3;
    setCountdown(count);
    playCountdownBeep(880, 0.12);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(880, 0.12);
      } else {
        clearInterval(timer);
        setCountdown(null);
        handleExecuteCapture();
      }
    }, 1000);
  };

  // Simulated capture fallback for when camera hardware is unavailable
  const handleSimulatedCapture = async () => {
    setIsComposing(true);
    playShutterSound();

    // Create a mock canvas with aesthetic gradient and avatar
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1200;
    mockCanvas.height = 1500;
    const mctx = mockCanvas.getContext('2d');
    if (mctx) {
      const grad = mctx.createLinearGradient(0, 0, 1200, 1500);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(0.5, '#4c1d95');
      grad.addColorStop(1, '#831843');
      mctx.fillStyle = grad;
      mctx.fillRect(0, 0, 1200, 1500);

      mctx.fillStyle = '#ffffff';
      mctx.font = 'bold 44px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText('✨ Momen Virtual Photobooth ✨', 600, 700);
      mctx.font = '28px sans-serif';
      mctx.fillStyle = '#e9d5ff';
      mctx.fillText(config.title, 600, 760);
    }

    try {
      const dataUrl = await composePhotoboothImage({
        videoOrImage: mockCanvas,
        frame,
        config,
        mirrored: false,
      });
      playSuccessChime();
      onPhotoCaptured(dataUrl);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-4">
      {/* Flash overlay */}
      {isFlashing && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash" />
      )}

      {/* Top Bar Controls */}
      <div className="flex items-center justify-between z-20 mb-3">
        <button
          onClick={onBack}
          disabled={countdown !== null || isComposing}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 transition-colors text-sm font-medium focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ganti Frame</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Flash Toggle */}
          <button
            onClick={() => setUseFlash(!useFlash)}
            className={`p-2 rounded-xl border transition-colors focus:outline-none ${
              useFlash
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/90 text-slate-400 border-slate-800'
            }`}
            title={useFlash ? 'Flash Aktif' : 'Flash Nonaktif'}
          >
            {useFlash ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
          </button>

          {/* Flip Camera */}
          <button
            onClick={toggleFacingMode}
            disabled={countdown !== null || isComposing}
            className="p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 transition-colors focus:outline-none"
            title="Putar Kamera Depan/Belakang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewfinder & Frame Preview Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-auto">
        <div className="relative w-full max-w-sm aspect-[4/5] bg-black rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-black">
          {/* Camera Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />

          {/* Loading indicator */}
          {isLoadingCamera && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-amber-400 gap-3 z-30">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-xs font-medium text-slate-300">
                Menghubungkan ke kamera...
              </span>
            </div>
          )}

          {/* Camera Error / Permission Fallback */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
              <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">
                Akses Kamera Terkendala
              </h4>
              <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Coba Akses Lagi
                </button>
                <button
                  onClick={handleSimulatedCapture}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                >
                  Ambil Foto Contoh (Demo)
                </button>
              </div>
            </div>
          )}

          {/* Real-time Frame Overlay */}
          <FrameOverlay frame={frame} config={config} />

          {/* Countdown Display Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-40">
              <div className="w-28 h-28 rounded-full bg-amber-500 text-slate-950 font-serif font-bold text-6xl flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-ping">
                {countdown}
              </div>
              <div className="absolute w-28 h-28 rounded-full bg-amber-500 text-slate-950 font-serif font-bold text-6xl flex items-center justify-center shadow-2xl shadow-amber-500/50">
                {countdown}
              </div>
            </div>
          )}

          {/* Composing spinner */}
          {isComposing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 gap-2 z-40">
              <Sparkles className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold text-slate-200">
                Memproses Frame Resolusi Tinggi...
              </span>
            </div>
          )}
        </div>

        {/* Frame Quick Switcher Pills below viewfinder */}
        <div className="flex items-center justify-center gap-2 mt-3 z-10 overflow-x-auto py-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Frame:</span>
          </span>
          {availableFrames
            .filter((f) => f.enabled)
            .map((f) => (
              <button
                key={f.id}
                onClick={() => onSwitchFrame(f)}
                disabled={countdown !== null || isComposing}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  f.id === frame.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.name}
              </button>
            ))}
        </div>
      </div>

      {/* Bottom Shutter Capture Bar */}
      <div className="pt-2 pb-1 z-20 flex flex-col items-center">
        <button
          onClick={triggerCountdownCapture}
          disabled={countdown !== null || isComposing}
          className="group relative flex items-center justify-center focus:outline-none cursor-pointer disabled:opacity-50"
          title="Ambil Foto Sekarang (Timer 3 Detik)"
        >
          {/* Shutter outer ring */}
          <div className="w-20 h-20 rounded-full border-4 border-amber-400/60 p-1 flex items-center justify-center group-hover:border-amber-300 group-hover:scale-105 transition-all shadow-xl shadow-amber-500/30">
            {/* Shutter inner button */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center group-active:scale-95 transition-transform">
              <Camera className="w-8 h-8 text-slate-950" />
            </div>
          </div>
        </button>

        <span className="text-[11px] text-slate-400 mt-2 font-medium tracking-wide">
          {countdown !== null ? 'Tersenyum dalam hitungan mundur...' : 'Ketuk untuk Ambil Gambar'}
        </span>
      </div>
    </div>
  );
};
