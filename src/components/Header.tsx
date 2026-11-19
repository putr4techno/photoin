import React, { useState } from 'react';
import { Settings, Camera, Maximize, Minimize } from 'lucide-react';
import { EventConfig } from '../types';
import { getTheme } from '../utils/theme';

interface HeaderProps {
  config: EventConfig;
  onOpenClientAdmin: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, onOpenClientAdmin, onLogoClick }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = getTheme(config.themeColor);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className={`sticky top-0 z-30 w-full bg-slate-950/85 backdrop-blur-md border-b ${theme.borderSubtle} px-4 py-3 transition-colors`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          {config.logoUrl ? (
            <div className={`h-10 max-w-[130px] rounded-xl p-1 bg-slate-900 border ${theme.borderAccent} flex items-center justify-center overflow-hidden shadow-md`}>
              <img
                src={config.logoUrl}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.buttonGradient} p-[1.5px] shadow-lg ${theme.shadowGlow} group-hover:scale-105 transition-transform`}>
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Camera className={`w-5 h-5 ${theme.textAccent}`} />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm md:text-base tracking-wide text-slate-100">
                Virtual Photobooth
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${theme.bgBadge}`}>
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-xs">
              {config.vendorName} • {config.title}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-slate-800 transition-colors focus:outline-none"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Client Admin Settings Gear Button */}
          <button
            onClick={onOpenClientAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 ${theme.textAccent} border ${theme.borderAccent} hover:border-white/50 transition-all shadow-sm focus:outline-none group cursor-pointer`}
            title="User (PIN Terlindungi)"
          >
            <Settings className={`w-4 h-4 ${theme.textAccent} group-hover:rotate-45 transition-transform duration-300`} />
            <span className="text-xs font-semibold tracking-wide hidden sm:inline">
              User
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
