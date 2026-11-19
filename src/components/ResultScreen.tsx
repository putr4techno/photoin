import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Share2,
  RotateCcw,
  Home,
  CheckCircle2,
  Cloud,
  CloudUpload,
  ExternalLink,
  Sparkles,
  QrCode,
  X,
  AlertTriangle,
} from 'lucide-react';
import { CapturedPhoto, EventConfig } from '../types';
import { getAccessToken } from '../services/auth';
import {
  getOrCreateVirtualMomentFolder,
  uploadPhotoToDrive,
  uploadPhotoViaAppsScript,
  UploadResult,
} from '../services/drive';
import { updatePhoto } from '../utils/storage';
import { getTheme } from '../utils/theme';

interface ResultScreenProps {
  photo: CapturedPhoto;
  config: EventConfig;
  onRetake: () => void;
  onFinish: () => void;
  onOpenAdmin: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  photo,
  config,
  onRetake,
  onFinish,
  onOpenAdmin,
}) => {
  const theme = getTheme(config.themeColor);
  const [currentPhoto, setCurrentPhoto] = useState<CapturedPhoto>(photo);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    photo.driveUploadStatus || 'idle'
  );
  const [driveUrl, setDriveUrl] = useState<string | null>(photo.driveWebViewLink || null);
  const [driveError, setDriveError] = useState<string | null>(photo.errorMessage || null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#fef08a', '#fbbf24', '#ffffff'],
    });

    // Check if auto-upload to Google Drive is configured
    handleAutoUpload();
  }, []);

  const handleAutoUpload = async () => {
    if (!config.autoUploadDrive) return;

    const useAppsScript = config.driveUploadMethod === 'apps_script';

    try {
      const cleanTitle = config.title.replace(/[^a-zA-Z0-9]/g, '_');
      const timeStr = new Date(currentPhoto.timestamp).toISOString().replace(/[:.]/g, '-');
      const fileName = `Photobooth_${cleanTitle}_${timeStr}.png`;

      let result: UploadResult;

      if (useAppsScript) {
        if (!config.appsScriptUrl?.trim()) {
          return;
        }
        setDriveStatus('uploading');
        setDriveError(null);
        result = await uploadPhotoViaAppsScript(
          config.appsScriptUrl.trim(),
          fileName,
          currentPhoto.dataUrl
        );
      } else {
        const token = await getAccessToken();
        if (!token) {
          // Not logged in to Google Drive yet
          return;
        }

        setDriveStatus('uploading');
        setDriveError(null);

        // 1. Ensure folder "virtual moment" exists
        const folder = await getOrCreateVirtualMomentFolder(
          token,
          config.driveFolderName || 'virtual moment'
        );

        // 2. Upload photo
        result = await uploadPhotoToDrive(token, folder.id, fileName, currentPhoto.dataUrl);
      }

      setDriveStatus('success');
      setDriveUrl(result.webViewLink);

      // Update in storage
      const updated: CapturedPhoto = {
        ...currentPhoto,
        driveFileId: result.id,
        driveWebViewLink: result.webViewLink,
        driveUploadStatus: 'success',
      };
      setCurrentPhoto(updated);
      await updatePhoto(updated);
    } catch (err: any) {
      console.error('Auto upload to drive error:', err);
      setDriveStatus('error');
      setDriveError(err.message || 'Gagal mengunggah ke Google Drive');
    }
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.dataUrl;
    const cleanTitle = config.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timeStr = new Date(currentPhoto.timestamp)
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '_');
    link.download = `Photobooth_${cleanTitle}_${timeStr}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share photo
  const handleShare = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(currentPhoto.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'photobooth_moment.png', { type: 'image/png' });

        await navigator.share({
          title: `Virtual Photobooth - ${config.title}`,
          text: `Foto berbingkai dari ${config.title} (${config.date}) • Powered by ${config.vendorName}`,
          files: [file],
        });
      } catch (err) {
        setShowQrModal(true);
      }
    } else {
      setShowQrModal(true);
    }
  };

  // Copy Image to clipboard
  const handleCopyImage = async () => {
    try {
      const res = await fetch(currentPhoto.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (err) {
      handleDownload();
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-4 md:py-6">
      {/* Header Result */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Foto Berhasil Diambil!</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
          Hasil Foto Virtual Photobooth
        </h2>
      </div>

      {/* Main Image Display & Drive Status Card */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto">
        <div className="w-full max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-2xl shadow-black relative group">
          <img
            src={currentPhoto.dataUrl}
            alt="Hasil Foto Photobooth"
            className="w-full h-auto object-contain bg-slate-950"
          />

          {/* Quick Download Overlay Button */}
          <button
            onClick={handleDownload}
            className="absolute bottom-3 right-3 p-3 rounded-full bg-slate-900/90 text-amber-300 hover:text-white border border-amber-400/50 shadow-xl opacity-90 group-hover:opacity-100 transition-opacity"
            title="Unduh PNG"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Google Drive Status Banner */}
        <div className="w-full max-w-sm mt-4">
          {driveStatus === 'uploading' && (
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3 text-amber-300 text-xs shadow-lg">
              <CloudUpload className="w-5 h-5 animate-bounce text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Menyimpan ke Google Drive...</p>
                <p className="text-[10px] text-slate-400">
                  Folder: <span className="text-amber-200">“{config.driveFolderName}”</span>
                </p>
              </div>
            </div>
          )}

          {driveStatus === 'success' && driveUrl && (
            <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-emerald-300 text-xs shadow-lg">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-200">Tersimpan di Google Drive!</p>
                  <p className="text-[10px] text-emerald-400/80">Folder “{config.driveFolderName}”</p>
                </div>
              </div>
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-medium text-[11px] border border-emerald-500/40"
              >
                <span>Buka</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {driveStatus === 'error' && (
            <div className="bg-rose-950/70 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between text-rose-300 text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-semibold">Gagal Sinkron ke Drive</p>
                  <p className="text-[10px] text-rose-400/80 truncate max-w-[200px]">{driveError}</p>
                </div>
              </div>
              <button
                onClick={handleAutoUpload}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-[11px] border border-rose-500/40"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {driveStatus === 'idle' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 px-3 flex items-center justify-between text-slate-400 text-xs">
              <div className="flex items-center gap-2 text-[11px]">
                <Cloud className="w-4 h-4 text-slate-500" />
                <span>
                  {config.driveUploadMethod === 'apps_script'
                    ? 'URL Apps Script Drive belum diatur'
                    : 'Google Drive belum terhubung'}
                </span>
              </div>
              <button
                onClick={onOpenAdmin}
                className="text-amber-400 text-[11px] hover:underline font-medium"
              >
                Atur di Panel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-2.5 mt-4">
        {/* Main Download Button */}
        <button
          onClick={handleDownload}
          className={`w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r ${theme.buttonGradient} ${theme.buttonText} font-bold text-base shadow-xl ${theme.shadowGlow} hover:opacity-95 active:scale-[0.98] transition-transform flex items-center justify-center gap-2.5 cursor-pointer`}
        >
          <Download className="w-5 h-5" />
          <span>Unduh Foto (PNG Resolusi Tinggi)</span>
        </button>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Bagikan</span>
          </button>

          <button
            onClick={handleCopyImage}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{copyFeedback ? 'Tersalin!' : 'Salin Gambar'}</span>
          </button>
        </div>

        {/* Retake and Home Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={onRetake}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Foto Ulang</span>
          </button>

          <button
            onClick={onFinish}
            className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Selesai / Tamu Baru</span>
          </button>
        </div>
      </div>

      {/* Share / QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <QrCode className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="font-serif text-lg font-bold text-slate-100">Bagikan Foto Anda</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Unduh file PNG langsung ke galeri perangkat Anda untuk diunggah ke Instagram Story
                atau dibagikan ke WhatsApp.
              </p>
              {driveUrl && (
                <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
                  <p className="text-[10px] text-emerald-300 font-semibold">
                    Tautan Google Drive Siap Dibagikan:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={driveUrl}
                      className="flex-1 text-[10px] font-mono bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300"
                    />
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 shrink-0"
                    >
                      Buka
                    </a>
                  </div>
                </div>
              )}
              <button
                onClick={handleDownload}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md"
              >
                Unduh Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
