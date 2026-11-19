import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles, ArrowLeft, Camera } from 'lucide-react';
import { EventConfig, FrameTemplate } from '../types';
import { FrameOverlay } from './FrameOverlay';
import { getTheme } from '../utils/theme';

interface FrameSelectionScreenProps {
  frames: FrameTemplate[];
  config: EventConfig;
  selectedFrameId: string;
  onSelectFrame: (frame: FrameTemplate) => void;
  onProceedToCamera: () => void;
  onBack: () => void;
}

export const FrameSelectionScreen: React.FC<FrameSelectionScreenProps> = ({
  frames,
  config,
  selectedFrameId,
  onSelectFrame,
  onProceedToCamera,
  onBack,
}) => {
  const theme = getTheme(config.themeColor);
  const enabledFrames = frames.filter((f) => f.enabled);
  // Ensure initial index matches selectedFrameId
  const initialIndex = Math.max(
    0,
    enabledFrames.findIndex((f) => f.id === selectedFrameId)
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const activeFrame = enabledFrames[currentIndex] || enabledFrames[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev > 0 ? prev - 1 : enabledFrames.length - 1;
      onSelectFrame(enabledFrames[nextIndex]);
      return nextIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev < enabledFrames.length - 1 ? prev + 1 : 0;
      onSelectFrame(enabledFrames[nextIndex]);
      return nextIndex;
    });
  };

  // Touch Swipe handlers for "mode geser"
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="text-center">
          <span className="font-cinzel text-xs text-amber-400 font-bold tracking-widest uppercase">
            Langkah 1 dari 2
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-100">
            Pilih Template Frame
          </h2>
        </div>

        <div className="w-20" /> {/* Spacer for symmetry */}
      </div>

      {/* Swipeable Carousel Area (Mode Geser) */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center py-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Geser kiri atau kanan untuk memilih desain frame</span>
        </p>

        {/* Carousel Container */}
        <div className="relative w-full max-w-sm flex items-center justify-center">
          {/* Prev Arrow */}
          <button
            onClick={handlePrev}
            className="absolute -left-3 sm:-left-6 z-20 w-11 h-11 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-slate-800 shadow-xl flex items-center justify-center transition-all focus:outline-none cursor-pointer"
            title="Frame Sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Active Frame Mockup Card */}
          <div className="w-full aspect-[4/5] bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-2xl shadow-black relative select-none">
            {/* Simulated camera background photo */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-500">
              <Camera className="w-12 h-12 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-400">
                Area Foto Anda
              </span>
            </div>

            {/* Live Frame Overlay Preview */}
            {activeFrame && <FrameOverlay frame={activeFrame} config={config} />}

            {/* Badge Indicator */}
            {activeFrame?.badge && (
              <div className="absolute top-3 right-3 z-20 bg-amber-500 text-slate-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{activeFrame.badge}</span>
              </div>
            )}
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            className="absolute -right-3 sm:-right-6 z-20 w-11 h-11 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 hover:text-amber-100 hover:bg-slate-800 shadow-xl flex items-center justify-center transition-all focus:outline-none cursor-pointer"
            title="Frame Selanjutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2 mt-4">
          {enabledFrames.map((frame, index) => (
            <button
              key={frame.id}
              onClick={() => {
                setCurrentIndex(index);
                onSelectFrame(frame);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-8 bg-amber-400'
                  : 'w-2.5 bg-slate-700 hover:bg-slate-500'
              }`}
              title={frame.name}
            />
          ))}
        </div>

        {/* Selected Frame Details */}
        <div className="mt-3 text-center max-w-sm px-4">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-serif text-lg font-bold text-slate-100">
              {activeFrame?.name}
            </h3>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {activeFrame?.theme}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {activeFrame?.description}
          </p>
        </div>
      </div>

      {/* Frame Selection Quick Carousel Thumbs */}
      <div className="flex items-center justify-center gap-3 my-3 overflow-x-auto py-1">
        {enabledFrames.map((f, i) => (
          <button
            key={f.id}
            onClick={() => {
              setCurrentIndex(i);
              onSelectFrame(f);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              i === currentIndex
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {i === currentIndex && <Check className="w-3.5 h-3.5 text-amber-400" />}
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {/* Bottom Action CTA */}
      <div className="pt-2">
        <button
          onClick={onProceedToCamera}
          className={`w-full max-w-sm mx-auto block py-3.5 px-6 rounded-2xl bg-gradient-to-r ${theme.buttonGradient} ${theme.buttonText} font-bold text-base shadow-xl ${theme.shadowGlow} hover:opacity-95 active:scale-[0.98] transition-transform cursor-pointer`}
        >
          <div className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            <span>Pilih Frame Ini & Lanjut ke Kamera</span>
          </div>
        </button>
      </div>
    </div>
  );
};
