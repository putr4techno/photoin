import React from 'react';
import {
  Sparkles,
  Calendar,
  Heart,
  Camera,
  ArrowRight,
  ShieldCheck,
  Image as ImageIcon,
  Sliders,
  Settings,
} from 'lucide-react';
import { EventConfig } from '../types';
import { getTheme } from '../utils/theme';

interface WelcomeScreenProps {
  config: EventConfig;
  onStart: () => void;
  onOpenSuperAdmin: () => void;
  onOpenClientAdmin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  config,
  onStart,
  onOpenSuperAdmin,
  onOpenClientAdmin,
}) => {
  const theme = getTheme(config.themeColor);

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between items-center px-4 py-6 md:py-10">
      {/* Background ambient lighting driven by theme */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] ${theme.glowBg} rounded-full blur-3xl pointer-events-none -z-10`}
      />

      {/* Main Digital Invitation Container */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        {/* Card Frame */}
        <div
          className={`w-full bg-slate-900/85 backdrop-blur-xl border ${theme.borderAccent} rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80 relative overflow-hidden`}
        >
          {/* Subtle top gradient accent line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.buttonGradient}`}
          />

          {/* Event Banner */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[2/1] rounded-2xl overflow-hidden mb-6 border border-slate-700/60 shadow-inner group">
            <img
              src={config.bannerUrl}
              alt="Banner Acara"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Banner Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Category Pill on top of banner */}
            <div className="absolute top-3 left-3 bg-slate-950/85 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              <span className={`font-cinzel text-[11px] font-bold ${theme.textAccent} tracking-widest uppercase`}>
                {config.category}
              </span>
            </div>

            {/* Logo Badge in banner if present */}
            {config.logoUrl && (
              <div className="absolute top-3 right-3 max-h-8 max-w-[100px] bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 flex items-center justify-center">
                <img src={config.logoUrl} alt="Logo" className="max-h-6 max-w-full object-contain" />
              </div>
            )}

            {/* Quick Banner badge info */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <ImageIcon className={`w-3 h-3 ${theme.textAccent}`} />
              <span>Official Event Photobooth</span>
            </div>
          </div>

          {/* Invitation Content Section */}
          <div className="text-center flex flex-col items-center">
            {/* Elegant Subtitle */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-[1px] w-10 bg-slate-700" />
              <span className={`text-xs uppercase font-cinzel font-semibold tracking-widest ${theme.textAccent}`}>
                Selamat Datang Di
              </span>
              <div className="h-[1px] w-10 bg-slate-700" />
            </div>

            {/* Couple / Event Title */}
            <h1
              className={`font-serif text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r ${theme.textHeading} bg-clip-text text-transparent drop-shadow-md leading-tight mb-3`}
            >
              {config.title}
            </h1>

            {/* Event Date Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${theme.bgBadge} text-xs sm:text-sm font-semibold tracking-wider mb-5 shadow-sm`}
            >
              <Calendar className={`w-4 h-4 ${theme.textAccent}`} />
              <span>{config.date}</span>
            </div>

            {/* Main Action Button - Naik ke atas */}
            <button
              onClick={onStart}
              className={`w-full relative group overflow-hidden rounded-2xl p-[2px] focus:outline-none shadow-xl ${theme.shadowGlow} active:scale-[0.98] transition-transform cursor-pointer mb-5`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${theme.buttonGradient} rounded-2xl group-hover:opacity-90 transition-opacity`}
              />
              <div
                className={`relative bg-gradient-to-r ${theme.buttonGradient} ${theme.buttonText} font-bold text-base sm:text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors`}
              >
                <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Mulai Ambil Foto</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Kata-kata Mutiara / Quote Box - Pindah di bawahnya Ambil Foto */}
            <div className="w-full relative p-4 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-sm text-center">
              <span className={`absolute -top-3 left-6 bg-slate-900 px-2 ${theme.textAccent} font-serif text-xl leading-none`}>
                “
              </span>
              <p className="font-serif italic text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
                {config.quote}
              </p>
              <div className={`flex justify-center items-center gap-1.5 mt-2.5 ${theme.textAccent}`}>
                <Heart className={`w-3.5 h-3.5 fill-current`} />
                <span className="text-[10px] tracking-wider uppercase font-medium">
                  {config.vendorName} Moment
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area with ADMIN PANEL UTAMA & Client Links */}
      <footer className="w-full max-w-xl mx-auto mt-6 text-center text-xs text-slate-400 flex flex-col gap-3 border-t border-slate-800/60 pt-4 px-2">
        {/* Brand & Vendor info */}
        <div className="flex items-center justify-center gap-2">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="h-4 max-w-[80px] object-contain" />
          ) : (
            <ShieldCheck className={`w-3.5 h-3.5 ${theme.textAccent}`} />
          )}
          <span>Powered by {config.vendorName}</span>
        </div>

        {/* Admin Navigation Links at Bottom (Footer) */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          {/* Admin button - Prominent at bottom */}
          <button
            onClick={onOpenSuperAdmin}
            className={`px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 ${theme.textAccent} border ${theme.borderAccent} transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer shadow-sm`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="font-semibold">Admin</span>
          </button>

          {/* User Link */}
          <button
            onClick={onOpenClientAdmin}
            className="text-slate-400 hover:text-slate-200 hover:underline transition-colors focus:outline-none flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>User</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
