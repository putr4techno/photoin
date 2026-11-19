import React from 'react';
import { EventConfig, FrameTemplate } from '../types';

interface FrameOverlayProps {
  frame: FrameTemplate;
  config: EventConfig;
  className?: string;
}

export const FrameOverlay: React.FC<FrameOverlayProps> = ({ frame, config, className = '' }) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex flex-col justify-between select-none ${className}`}
    >
      {/* Custom Uploaded Overlay */}
      {frame.customOverlayUrl && (
        <img
          src={frame.customOverlayUrl}
          alt={frame.name}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Royal Floral Gold Theme */}
      {frame.theme === 'floral' && (
        <>
          {/* Top border & header badge */}
          <div className="relative pt-3 pb-2 px-4 flex flex-col items-center">
            <div className="absolute inset-0 border-t-4 border-x-4 border-amber-400/80 m-2 rounded-t-lg pointer-events-none" />
            <div className="bg-slate-950/85 border border-amber-400/70 px-4 py-1 rounded shadow-lg backdrop-blur-sm z-10">
              <span className="font-cinzel text-xs tracking-widest text-amber-200 font-semibold uppercase">
                {config.category}
              </span>
            </div>
            {/* Top decorative corners */}
            <div className="absolute top-2 left-2 text-amber-400 text-lg">✦</div>
            <div className="absolute top-2 right-2 text-amber-400 text-lg">✦</div>
          </div>

          {/* Center viewport spacer */}
          <div className="flex-1 relative mx-3 my-1 border-2 border-amber-400/60 rounded">
            {/* Corner flourishes */}
            <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
            <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
            <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
            <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300" />
          </div>

          {/* Bottom Card Panel */}
          <div className="relative pb-3 pt-2 px-4 flex flex-col items-center">
            <div className="absolute inset-0 border-b-4 border-x-4 border-amber-400/80 m-2 rounded-b-lg pointer-events-none" />
            <div className="w-full bg-slate-950/90 border border-amber-400/70 p-2.5 rounded-md shadow-2xl backdrop-blur-md text-center z-10 flex flex-col items-center">
              <h2 className="font-serif text-lg md:text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                {config.title}
              </h2>
              <div className="flex items-center gap-2 my-0.5">
                <span className="h-[1px] w-8 bg-amber-400/50" />
                <span className="text-[10px] text-amber-300">✦</span>
                <span className="h-[1px] w-8 bg-amber-400/50" />
              </div>
              <p className="text-[11px] font-medium tracking-wider text-slate-200">
                {config.date}
              </p>
              <span className="text-[9px] text-amber-300/80 tracking-tight mt-0.5">
                Virtual Photobooth by {config.vendorName}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Modern Polaroid Clean Theme */}
      {frame.theme === 'polaroid' && (
        <div className="relative w-full h-full p-3 flex flex-col justify-between bg-white/20 backdrop-contrast-125">
          {/* Polaroid inner frame border */}
          <div className="flex-1 border-2 border-dashed border-white/80 rounded-sm m-1 relative">
            <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-mono">
              REC ●
            </span>
          </div>

          {/* Polaroid Bottom Chin */}
          <div className="bg-stone-100 text-slate-800 p-3 rounded-b-sm shadow-xl text-center mt-2 flex flex-col items-center">
            <h3 className="font-serif text-xl font-bold tracking-tight text-slate-900">
              {config.title}
            </h3>
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5 tracking-wide uppercase">
              {config.category} • {config.date}
            </p>
            <p className="text-[10px] italic text-slate-500 font-serif line-clamp-1 mt-0.5">
              “{config.quote}”
            </p>
            <span className="text-[8px] tracking-widest font-bold text-slate-400 mt-1 uppercase">
              {config.vendorName} Virtual Moment
            </span>
          </div>
        </div>
      )}

      {/* Celebration Gold Sparkle Theme */}
      {frame.theme === 'celebration' && (
        <>
          {/* Top festive banner */}
          <div className="pt-3 pb-1 px-4 text-center z-10">
            <div className="inline-block bg-amber-500 text-slate-950 font-cinzel font-bold text-xs tracking-wider px-4 py-1 rounded-full shadow-lg">
              ★ {config.category.toUpperCase()} ★
            </div>
            {/* Corner geometric marks */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-yellow-300" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-yellow-300" />
          </div>

          {/* Viewfinder borders */}
          <div className="flex-1 mx-3 border-2 border-yellow-400/70 rounded relative">
            <div className="absolute top-1/2 left-2 text-yellow-300 text-sm animate-pulse">✨</div>
            <div className="absolute top-1/2 right-2 text-yellow-300 text-sm animate-pulse">✨</div>
          </div>

          {/* Bottom Gala Card */}
          <div className="pb-3 pt-2 px-4 z-10">
            <div className="bg-stone-900/90 border border-yellow-500/80 p-2.5 rounded-lg text-center shadow-2xl backdrop-blur-md">
              <h2 className="font-serif text-xl font-bold text-yellow-300 drop-shadow">
                {config.title}
              </h2>
              <p className="text-xs font-semibold text-amber-200 tracking-wider mt-0.5">
                {config.date}
              </p>
              <div className="text-[9px] text-stone-400 mt-1">
                Celebration Photobooth • {config.vendorName}
              </div>
            </div>
            {/* Bottom corner geometric marks */}
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-yellow-300" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-yellow-300" />
          </div>
        </>
      )}

      {/* Custom Theme Fallback */}
      {frame.theme === 'custom' && !frame.customOverlayUrl && (
        <div className="flex flex-col justify-between h-full p-4 border-4 border-amber-400/80 rounded-lg">
          <div className="text-center bg-slate-900/80 text-amber-300 text-xs py-1 px-3 rounded inline-block mx-auto">
            {config.category}
          </div>
          <div className="text-center bg-slate-900/90 text-white p-2 rounded border border-amber-400/50">
            <div className="font-serif font-bold text-base">{config.title}</div>
            <div className="text-[10px] text-slate-300">{config.date}</div>
          </div>
        </div>
      )}
    </div>
  );
};
