import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Key,
  Layers,
  Cloud,
  CheckCircle2,
  Trash2,
  Upload,
  RefreshCw,
  ExternalLink,
  Download,
  Palette,
  Shield,
  UserCheck,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AdminRole, ColorThemeKey, CapturedPhoto, EventConfig, FrameTemplate } from '../types';
import {
  DEFAULT_BANNER,
  saveEventConfig,
  saveFrameTemplates,
  getAllPhotos,
  deletePhoto,
  clearAllPhotos,
  updatePhoto,
} from '../utils/storage';
import { googleSignIn, logout, getAccessToken } from '../services/auth';
import { getOrCreateVirtualMomentFolder, uploadPhotoToDrive } from '../services/drive';
import { THEMES, getTheme } from '../utils/theme';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  frames: FrameTemplate[];
  onConfigChange: (newConfig: EventConfig) => void;
  onFramesChange: (newFrames: FrameTemplate[]) => void;
  currentUser: User | null;
  onAuthChange: (user: User | null) => void;
  adminRole: AdminRole;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  frames,
  onConfigChange,
  onFramesChange,
  currentUser,
  onAuthChange,
  adminRole,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Super admin tabs: 'theme_logo' | 'event' | 'frames' | 'drive' | 'gallery'
  // Client admin tabs: 'event' | 'frames' | 'drive' | 'gallery'
  const [activeTab, setActiveTab] = useState<string>(
    adminRole === 'super' ? 'theme_logo' : 'event'
  );

  // Form State
  const [formData, setFormData] = useState<EventConfig>(config);
  const [localFrames, setLocalFrames] = useState<FrameTemplate[]>(frames);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [driveTestMessage, setDriveTestMessage] = useState<string | null>(null);
  const [driveFolderLink, setDriveFolderLink] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [newUserPin, setNewUserPin] = useState('');
  const [userPinSuccess, setUserPinSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isSuperAdmin = adminRole === 'super';

  // Theme
  const theme = getTheme(formData.themeColor);

  // Sync state with props
  useEffect(() => {
    setFormData(config);
    setLocalFrames(frames);
  }, [config, frames]);

  // Set default tab on open and reset authentication so role password is required
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(false);
      setEnteredPin('');
      setPinError(false);
      setActiveTab(adminRole === 'super' ? 'theme_logo' : 'event');
    }
  }, [isOpen, adminRole]);

  // Load photos when entering gallery tab
  useEffect(() => {
    if (activeTab === 'gallery' && isAuthenticated) {
      loadPhotos();
    }
  }, [activeTab, isAuthenticated]);

  const loadPhotos = async () => {
    const list = await getAllPhotos();
    setPhotos(list);
  };

  if (!isOpen) return null;

  // Handle PIN verification - Different password for Admin vs User
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = isSuperAdmin
      ? (config.adminPin || 'putrajamal')
      : (config.clientPin || 'user123');

    if (enteredPin === expectedPin) {
      setIsAuthenticated(true);
      setPinError(false);
      setEnteredPin('');
    } else {
      setPinError(true);
    }
  };

  // Handle Event Config Save
  const handleSaveConfig = () => {
    onConfigChange(formData);
    saveEventConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Handle Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan upload file gambar (JPG atau PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = { ...formData, bannerUrl: result };
      setFormData(updated);
      onConfigChange(updated);
      saveEventConfig(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleResetBanner = () => {
    const updated = { ...formData, bannerUrl: DEFAULT_BANNER };
    setFormData(updated);
    onConfigChange(updated);
    saveEventConfig(updated);
  };

  // Handle Custom LOGO Upload (Super Admin)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan upload file logo (PNG, JPG, atau SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = { ...formData, logoUrl: result };
      setFormData(updated);
      onConfigChange(updated);
      saveEventConfig(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    const updated = { ...formData, logoUrl: '' };
    setFormData(updated);
    onConfigChange(updated);
    saveEventConfig(updated);
  };

  // Handle Theme Color Change (Super Admin)
  const handleSelectTheme = (themeKey: ColorThemeKey) => {
    const updated = { ...formData, themeColor: themeKey };
    setFormData(updated);
    onConfigChange(updated);
    saveEventConfig(updated);
  };

  // Handle PIN Change (Super Admin only)
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) return;

    const updated = { ...formData, adminPin: newPin.trim() };
    setFormData(updated);
    onConfigChange(updated);
    saveEventConfig(updated);
    setNewPin('');
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 3000);
  };

  // Handle User/Client PIN Change (Created and managed from Admin Utama)
  const handleChangeUserPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserPin.trim()) return;

    const updated = { ...formData, clientPin: newUserPin.trim() };
    setFormData(updated);
    onConfigChange(updated);
    saveEventConfig(updated);
    setNewUserPin('');
    setUserPinSuccess(true);
    setTimeout(() => setUserPinSuccess(false), 3000);
  };

  // Toggle Frame Template
  const handleToggleFrame = (frameId: string) => {
    const updated = localFrames.map((f) => {
      if (f.id === frameId) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });

    // Ensure at least one frame is enabled
    const anyEnabled = updated.some((f) => f.enabled);
    if (!anyEnabled) {
      alert('Minimal 1 template frame harus tetap aktif!');
      return;
    }

    setLocalFrames(updated);
    onFramesChange(updated);
    saveFrameTemplates(updated);
  };

  // Upload Custom PNG Frame Overlay
  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      alert('Frame kustom harus berupa file PNG dengan latar belakang transparan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newFrame: FrameTemplate = {
        id: `custom-frame-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20) || 'Custom Frame',
        theme: 'custom',
        description: 'Template frame kustom yang diunggah oleh admin acara.',
        badge: 'Custom Client',
        enabled: true,
        aspectRatio: '4:5',
        primaryColor: '#d4af37',
        secondaryColor: '#0f172a',
        customOverlayUrl: dataUrl,
      };

      const updated = [...localFrames, newFrame];
      setLocalFrames(updated);
      onFramesChange(updated);
      saveFrameTemplates(updated);
    };
    reader.readAsDataURL(file);
  };

  // Delete Frame
  const handleDeleteCustomFrame = (frameId: string) => {
    const confirmed = window.confirm('Hapus template frame kustom ini?');
    if (!confirmed) return;

    const updated = localFrames.filter((f) => f.id !== frameId);
    setLocalFrames(updated);
    onFramesChange(updated);
    saveFrameTemplates(updated);
  };

  // Google Drive Login
  const handleGoogleSignIn = async () => {
    setIsDriveConnecting(true);
    setDriveTestMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthChange(res.user);
        // Automatically check/create folder "virtual moment"
        const folder = await getOrCreateVirtualMomentFolder(
          res.accessToken,
          formData.driveFolderName || 'virtual moment'
        );
        setDriveFolderLink(folder.webViewLink || null);
        setDriveTestMessage(`Terhubung! Folder “${folder.name}” siap digunakan.`);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed', err);
      alert('Gagal menghubungkan Google Drive: ' + (err.message || 'Error otentikasi'));
    } finally {
      setIsDriveConnecting(false);
    }
  };

  // Google Drive Logout
  const handleGoogleLogout = async () => {
    const confirmed = window.confirm('Keluar dari akun Google Drive di aplikasi ini?');
    if (!confirmed) return;

    await logout();
    onAuthChange(null);
    setDriveFolderLink(null);
    setDriveTestMessage(null);
  };

  // Test Folder Connection
  const handleTestDriveConnection = async () => {
    setIsDriveConnecting(true);
    setDriveTestMessage(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Silakan masuk dengan akun Google terlebih dahulu.');
      }

      const folder = await getOrCreateVirtualMomentFolder(
        token,
        formData.driveFolderName || 'virtual moment'
      );
      setDriveFolderLink(folder.webViewLink || null);
      setDriveTestMessage(`Koneksi berhasil! Folder “${folder.name}” aktif.`);
    } catch (err: any) {
      setDriveTestMessage('Gagal: ' + (err.message || 'Error koneksi Google Drive'));
    } finally {
      setIsDriveConnecting(false);
    }
  };

  // Manual upload photo from gallery to Drive
  const handleManualUploadPhoto = async (photo: CapturedPhoto) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Silakan login Google Drive di tab Google Drive terlebih dahulu.');
        return;
      }

      const folder = await getOrCreateVirtualMomentFolder(
        token,
        formData.driveFolderName || 'virtual moment'
      );
      const cleanTitle = formData.title.replace(/[^a-zA-Z0-9]/g, '_');
      const timeStr = new Date(photo.timestamp).toISOString().replace(/[:.]/g, '-');
      const fileName = `Photobooth_${cleanTitle}_${timeStr}.png`;

      const result = await uploadPhotoToDrive(token, folder.id, fileName, photo.dataUrl);

      const updated: CapturedPhoto = {
        ...photo,
        driveFileId: result.id,
        driveWebViewLink: result.webViewLink,
        driveUploadStatus: 'success',
      };
      await updatePhoto(updated);
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      alert('Foto berhasil diunggah ke Google Drive!');
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + err.message);
    }
  };

  // Delete single photo
  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = window.confirm('Hapus foto ini dari galeri penyimpanan lokal?');
    if (!confirmed) return;

    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Clear all photos
  const handleClearAllPhotos = async () => {
    const confirmed = window.confirm(
      'Hapus SEMUA foto tamu di penyimpanan browser ini? Tindakan ini tidak dapat dibatalkan.'
    );
    if (!confirmed) return;

    await clearAllPhotos();
    setPhotos([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : 'bg-blue-500/20 text-blue-300 border-blue-400/40'} border flex items-center justify-center`}>
              {isSuperAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base sm:text-lg text-slate-100">
                  {isSuperAdmin ? 'Admin' : 'User'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                  {isSuperAdmin ? 'Admin' : 'User'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isSuperAdmin
                  ? 'Pengaturan Tema Warna, Logo, Identitas, Bingkai & PIN User'
                  : 'Pengaturan Banner, Nama Pasangan, Tanggal, Bingkai & Google Drive'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Authentication Screen */}
        {!isAuthenticated ? (
          <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
            <div className={`w-16 h-16 rounded-2xl ${isSuperAdmin ? 'bg-amber-500/10 text-amber-400 border-amber-400/30' : 'bg-blue-500/10 text-blue-400 border-blue-400/30'} border flex items-center justify-center mb-4 shadow-inner`}>
              <Key className="w-8 h-8" />
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-100 mb-1">
              Masukkan PIN {isSuperAdmin ? 'Admin' : 'User'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              {isSuperAdmin ? (
                <>Akses panel Admin dilindungi oleh PIN keamanan (Default: <code className="text-amber-300 font-mono font-bold">putrajamal</code>)</>
              ) : (
                <>Akses panel User dilindungi oleh PIN keamanan (Default: <code className="text-blue-300 font-mono font-bold">{formData.clientPin || 'user123'}</code>)</>
              )}
            </p>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="password"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Masukkan PIN..."
                autoFocus
                className={`w-full text-center tracking-widest text-lg font-mono py-3 px-4 rounded-xl bg-slate-950 border ${
                  pinError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-700'
                } text-white focus:outline-none focus:border-amber-400`}
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium">
                  PIN salah. Silakan periksa kembali ({isSuperAdmin ? 'Default: putrajamal' : `Default: ${formData.clientPin || 'user123'}`})
                </p>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl ${isSuperAdmin ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-blue-600 hover:bg-blue-500 text-white'} font-bold text-sm shadow-lg active:scale-[0.98] transition-transform cursor-pointer`}
              >
                Buka Panel {isSuperAdmin ? 'Admin' : 'User'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-1 overflow-x-auto shrink-0">
              {/* TAB KHUSUS SUPER ADMIN: TEMA & LOGO */}
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('theme_logo')}
                  className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'theme_logo'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Tema & Logo</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('event')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'event'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSuperAdmin ? 'Identitas Acara' : 'Pengaturan Acara'}</span>
              </button>

              <button
                onClick={() => setActiveTab('frames')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'frames'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Template Bingkai</span>
              </button>

              <button
                onClick={() => setActiveTab('drive')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'drive'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Google Drive Sync</span>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'gallery'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Galeri Tamu ({photos.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB: TEMA WARNA & LOGO (SUPER ADMIN ONLY) */}
              {isSuperAdmin && activeTab === 'theme_logo' && (
                <div className="space-y-6">
                  {/* PENGATURAN LOGO */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Pengaturan Logo Brand / Acara
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Logo akan ditampilkan pada Header aplikasi, Banner selamat datang, serta
                      watermark digital foto tamu.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Preview */}
                      <div className="w-32 h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2 shrink-0">
                        {formData.logoUrl ? (
                          <img
                            src={formData.logoUrl}
                            alt="Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-500 text-[10px]">
                            <span>(Logo Default)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-wrap gap-2 w-full">
                        <label className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Logo Baru</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>

                        {formData.logoUrl && (
                          <button
                            type="button"
                            onClick={handleResetLogo}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PENGATURAN TEMA WARNA WEB APP */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Pengaturan Tema Warna Web App
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4">
                      Pilih palet warna mewah untuk menyesuaikan tema visual photobooth dengan warna
                      dekorasi acara klien.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(Object.keys(THEMES) as ColorThemeKey[]).map((key) => {
                        const t = THEMES[key];
                        const isSelected = formData.themeColor === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectTheme(key)}
                            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Color swatch circle */}
                              <div
                                className="w-7 h-7 rounded-full shadow-md border border-white/20 shrink-0"
                                style={{ backgroundColor: t.previewHex }}
                              />
                              <div>
                                <h4 className="text-xs font-bold text-slate-200">{t.name}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {t.accentHex}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: IDENTITAS ACARA / PENGATURAN ACARA KLIEN */}
              {activeTab === 'event' && (
                <div className="space-y-4">
                  {/* Banner Acara Upload (Available for Both Super Admin & Client) */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                      Banner Acara (JPG / PNG Custom)
                    </label>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Gambar banner selamat datang yang tampil di halaman undangan digital utama.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-48 aspect-[2/1] rounded-xl overflow-hidden border border-slate-700 bg-black shrink-0 relative">
                        <img
                          src={formData.bannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 flex flex-wrap gap-2 w-full">
                        <label className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Banner Baru</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleBannerUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleResetBanner}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Kategori / Subtitle - ONLY FOR SUPER ADMIN */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kategori / Subtitle Acara
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Contoh: WEDDING MEMORIES, BIRTHDAY PARTY, SWEET 17"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* Nama Pasangan / Judul Acara (Both Client & Super Admin) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Pasangan / Judul Acara
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: Fatimah & Naufal"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400 font-serif"
                    />
                  </div>

                  {/* Tanggal Acara (Both Client & Super Admin) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tanggal Acara
                    </label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="Contoh: 13 AGUSTUS 2026"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Kata-kata Mutiara (Both Client & Super Admin) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kata-kata Mutiara / Quotes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      placeholder="Kata-kata bijak / doa pernikahan..."
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400 italic"
                    />
                  </div>

                  {/* Nama Vendor Photobooth - ONLY FOR SUPER ADMIN */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Vendor Photobooth
                      </label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        placeholder="PutraTechno"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={handleSaveConfig}
                      className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-colors cursor-pointer"
                    >
                      Simpan Perubahan Acara
                    </button>
                    {saveSuccess && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Tersimpan!
                      </span>
                    )}
                  </div>

                  {/* PENGATURAN KEAMANAN & PIN - ONLY SHOWN IN SUPER ADMIN (DIHILANGKAN DARI USER) */}
                  {isSuperAdmin && (
                    <div className="mt-8 pt-4 border-t border-slate-800 space-y-6">
                      {/* CARD 1: BUAT & ATUR PIN USER / KLIEN */}
                      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-blue-400" />
                            <span>Buat & Atur PIN User (Klien)</span>
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                            PIN Aktif: {formData.clientPin || 'user123'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3">
                          PIN ini yang diberikan kepada klien/penyelenggara acara untuk mengakses panel <strong className="text-blue-300">User</strong> (ikon Gerigi).
                        </p>
                        <form onSubmit={handleChangeUserPin} className="flex gap-2">
                          <input
                            type="text"
                            value={newUserPin}
                            onChange={(e) => setNewUserPin(e.target.value)}
                            placeholder="PIN User Baru (misal: client789)"
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-blue-400 font-mono"
                          />
                          <button
                            type="submit"
                            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow cursor-pointer transition-colors"
                          >
                            Simpan PIN User
                          </button>
                        </form>
                        {userPinSuccess && (
                          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PIN User berhasil diperbarui! Berikan PIN ini kepada klien Anda.</span>
                          </p>
                        )}
                      </div>

                      {/* CARD 2: UBAH PIN ADMIN UTAMA */}
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ubah PIN Admin Utama</span>
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                            PIN Admin: {formData.adminPin || 'putrajamal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Ganti PIN akses panel Admin utama Anda (Default: <code>putrajamal</code>).
                        </p>
                        <form onSubmit={handleChangePin} className="flex gap-2">
                          <input
                            type="text"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="PIN Admin Baru (misal: putra2026)"
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="submit"
                            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
                          >
                            Ganti PIN Admin
                          </button>
                        </form>
                        {pinChangeSuccess && (
                          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PIN Admin berhasil diubah! Gunakan PIN baru ini untuk login berikutnya.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: TEMPLATE BINGKAI */}
              {activeTab === 'frames' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-slate-100 mb-1">
                      Pengaturan Template Bingkai
                    </h3>
                    <p className="text-xs text-slate-400">
                      Aktifkan atau nonaktifkan template tertentu sesuai paket sewa klien photobooth Anda.
                    </p>
                  </div>

                  {/* List of frames */}
                  <div className="space-y-2.5">
                    {localFrames.map((f) => (
                      <div
                        key={f.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          f.enabled
                            ? 'bg-slate-950 border-amber-500/40'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-400/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm">
                            {f.theme === 'custom' ? 'PNG' : f.theme.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-200">{f.name}</h4>
                              <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                                {f.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {f.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSuperAdmin && f.theme === 'custom' && (
                            <button
                              onClick={() => handleDeleteCustomFrame(f.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Frame Kustom"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleFrame(f.id)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                              f.enabled ? 'bg-amber-500' : 'bg-slate-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                                f.enabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Custom PNG Frame (Super Admin) */}
                  {isSuperAdmin && (
                    <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-dashed border-amber-500/30 text-center">
                      <Layers className="w-8 h-8 text-amber-400 mx-auto mb-1.5" />
                      <h4 className="text-xs font-bold text-slate-200">
                        Tambah Template Frame Kustom (Overlay PNG)
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5 mb-3">
                        Unggah file PNG transparan beresolusi 4:5 atau 1200x1500px khusus untuk tema pesanan klien.
                      </p>

                      <label className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File Frame PNG</span>
                        <input
                          type="file"
                          accept="image/png"
                          onChange={handleCustomFrameUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: GOOGLE DRIVE SYNC */}
              {activeTab === 'drive' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-slate-100 mb-1">
                      Integrasi Google Drive
                    </h3>
                    <p className="text-xs text-slate-400">
                      Otomatis tersimpan di folder <code className="text-amber-300 font-bold">“virtual moment”</code> dengan akses aman.
                    </p>
                  </div>

                  {/* Connection Card */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
                    {currentUser ? (
                      /* Connected State */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {currentUser.photoURL ? (
                              <img
                                src={currentUser.photoURL}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full border border-amber-400/50"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold">
                                {currentUser.email?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100">
                                  {currentUser.displayName || 'Pengguna Google'}
                                </h4>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                                  Terhubung
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{currentUser.email}</p>
                            </div>
                          </div>

                          <button
                            onClick={handleGoogleLogout}
                            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                          >
                            Keluar
                          </button>
                        </div>

                        {/* Folder Info */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                              Nama Folder Penyimpanan:
                            </span>
                            <span className="text-amber-300 font-bold">
                              {formData.driveFolderName || 'virtual moment'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleTestDriveConnection}
                              disabled={isDriveConnecting}
                              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${isDriveConnecting ? 'animate-spin' : ''}`}
                              />
                              <span>Cek Folder</span>
                            </button>

                            {driveFolderLink && (
                              <a
                                href={driveFolderLink}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-medium border border-amber-500/30 flex items-center gap-1"
                              >
                                <span>Buka Folder</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {driveTestMessage && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
                            {driveTestMessage}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Disconnected State - Official Google Sign In Button */
                      <div className="text-center py-4 flex flex-col items-center">
                        <Cloud className="w-12 h-12 text-slate-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-200 mb-1">
                          Masuk dengan Akun Google
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mb-5">
                          Hubungkan Google Drive untuk menyimpan setiap hasil foto tamu secara instan
                          ke folder <span className="text-amber-300">“virtual moment”</span>.
                        </p>

                        {/* Official Sign in with Google Button */}
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={isDriveConnecting}
                          className="gsi-material-button shadow-lg hover:shadow-xl transition-shadow cursor-pointer disabled:opacity-50"
                        >
                          <div className="gsi-material-button-state"></div>
                          <div className="gsi-material-button-content-wrapper">
                            <div className="gsi-material-button-icon">
                              <svg
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 48 48"
                                style={{ display: 'block' }}
                              >
                                <path
                                  fill="#EA4335"
                                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                />
                                <path
                                  fill="#4285F4"
                                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                />
                                <path fill="none" d="M0 0h48v48H0z" />
                              </svg>
                            </div>
                            <span className="gsi-material-button-contents">
                              {isDriveConnecting ? 'Menghubungkan...' : 'Sign in with Google'}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Automatic Sync Option */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Otomatis Unggah Setiap Foto Tamu
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Setiap kali tamu selesai foto di layar hasil, sistem langsung mengunggah PNG ke
                        folder Google Drive di latar belakang.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...formData,
                          autoUploadDrive: !formData.autoUploadDrive,
                        };
                        setFormData(updated);
                        onConfigChange(updated);
                        saveEventConfig(updated);
                      }}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        formData.autoUploadDrive ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                          formData.autoUploadDrive ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: GALERI FOTO TAMU */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-slate-100">
                        Galeri Foto Tamu ({photos.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Daftar seluruh foto yang telah diambil tamu pada sesi acara ini.
                      </p>
                    </div>

                    {isSuperAdmin && photos.length > 0 && (
                      <button
                        onClick={handleClearAllPhotos}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua</span>
                      </button>
                    )}
                  </div>

                  {photos.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Belum ada foto tamu yang diambil.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col group"
                        >
                          <div className="relative aspect-[4/5] bg-black">
                            <img
                              src={photo.dataUrl}
                              alt="Foto Tamu"
                              className="w-full h-full object-cover"
                            />
                            {photo.driveUploadStatus === 'success' && (
                              <span
                                className="absolute top-1.5 right-1.5 bg-emerald-500/90 text-slate-950 p-1 rounded-full shadow"
                                title="Tersimpan di Google Drive"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 font-bold" />
                              </span>
                            )}
                          </div>

                          <div className="p-2 flex flex-col justify-between flex-1 gap-1.5">
                            <div className="text-[10px] text-slate-400">
                              <p className="font-semibold text-slate-300 truncate">
                                {photo.frameName}
                              </p>
                              <p>{new Date(photo.timestamp).toLocaleTimeString()}</p>
                            </div>

                            <div className="flex items-center gap-1 pt-1 border-t border-slate-900">
                              {/* Download link */}
                              <a
                                href={photo.dataUrl}
                                download={`photobooth_${photo.timestamp}.png`}
                                className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold text-center flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>Unduh</span>
                              </a>

                              {/* Upload to Drive if not uploaded */}
                              {photo.driveUploadStatus !== 'success' && currentUser && (
                                <button
                                  onClick={() => handleManualUploadPhoto(photo)}
                                  className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] cursor-pointer"
                                  title="Upload ke Drive"
                                >
                                  <Cloud className="w-3 h-3" />
                                </button>
                              )}

                              {/* Drive link if uploaded */}
                              {photo.driveWebViewLink && (
                                <a
                                  href={photo.driveWebViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px]"
                                  title="Lihat di Google Drive"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              {/* Delete (Super Admin only) */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  title="Hapus Foto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
