import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AdminRole, CapturedPhoto, EventConfig, FrameTemplate, ScreenState } from './types';
import {
  loadEventConfig,
  loadFrameTemplates,
  savePhoto,
  saveEventConfig,
  saveFrameTemplates,
} from './utils/storage';
import { initAuth } from './services/auth';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FrameSelectionScreen } from './components/FrameSelectionScreen';
import { CameraCaptureScreen } from './components/CameraCaptureScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminModal } from './components/AdminModal';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [config, setConfig] = useState<EventConfig>(loadEventConfig);
  const [frames, setFrames] = useState<FrameTemplate[]>(loadFrameTemplates);
  const [selectedFrameId, setSelectedFrameId] = useState<string>(() => {
    const loaded = loadFrameTemplates();
    const firstEnabled = loaded.find((f) => f.enabled);
    return firstEnabled ? firstEnabled.id : loaded[0]?.id || 'frame-floral-wedding';
  });
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>('client');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConfigChange = (newConfig: EventConfig) => {
    setConfig(newConfig);
    saveEventConfig(newConfig);
  };

  const handleFramesChange = (newFrames: FrameTemplate[]) => {
    setFrames(newFrames);
    saveFrameTemplates(newFrames);
    // If selected frame was disabled, choose first active
    if (!newFrames.find((f) => f.id === selectedFrameId)?.enabled) {
      const active = newFrames.find((f) => f.enabled);
      if (active) setSelectedFrameId(active.id);
    }
  };

  // Open Client Admin (Gerigi di header)
  const handleOpenClientAdmin = () => {
    setAdminRole('client');
    setIsAdminOpen(true);
  };

  // Open Super Admin (Posisi di bawah / footer)
  const handleOpenSuperAdmin = () => {
    setAdminRole('super');
    setIsAdminOpen(true);
  };

  // Currently selected frame template
  const activeFrame =
    frames.find((f) => f.id === selectedFrameId && f.enabled) ||
    frames.find((f) => f.enabled) ||
    frames[0];

  // Photo taken callback from camera
  const handlePhotoCaptured = async (dataUrl: string) => {
    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      timestamp: Date.now(),
      dataUrl,
      frameId: activeFrame.id,
      frameName: activeFrame.name,
      driveUploadStatus: 'idle',
    };

    setCapturedPhoto(newPhoto);
    await savePhoto(newPhoto);
    setScreen('result');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header - Gerigi membuka Admin Panel Khusus Client */}
      <Header
        config={config}
        onOpenClientAdmin={handleOpenClientAdmin}
        onLogoClick={() => setScreen('welcome')}
      />

      {/* Screen Router */}
      <main className="flex-1 flex flex-col">
        {screen === 'welcome' && (
          <WelcomeScreen
            config={config}
            onStart={() => setScreen('frame-select')}
            onOpenSuperAdmin={handleOpenSuperAdmin}
            onOpenClientAdmin={handleOpenClientAdmin}
          />
        )}

        {screen === 'frame-select' && (
          <FrameSelectionScreen
            frames={frames}
            config={config}
            selectedFrameId={activeFrame.id}
            onSelectFrame={(frame) => setSelectedFrameId(frame.id)}
            onProceedToCamera={() => setScreen('camera')}
            onBack={() => setScreen('welcome')}
          />
        )}

        {screen === 'camera' && (
          <CameraCaptureScreen
            frame={activeFrame}
            availableFrames={frames}
            config={config}
            onPhotoCaptured={handlePhotoCaptured}
            onBack={() => setScreen('frame-select')}
            onSwitchFrame={(frame) => setSelectedFrameId(frame.id)}
          />
        )}

        {screen === 'result' && capturedPhoto && (
          <ResultScreen
            photo={capturedPhoto}
            config={config}
            onRetake={() => setScreen('camera')}
            onFinish={() => {
              setCapturedPhoto(null);
              setScreen('welcome');
            }}
            onOpenAdmin={handleOpenSuperAdmin}
          />
        )}
      </main>

      {/* Admin Panel Modal (Super Admin vs Client Admin) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        frames={frames}
        onConfigChange={handleConfigChange}
        onFramesChange={handleFramesChange}
        currentUser={currentUser}
        onAuthChange={setCurrentUser}
        adminRole={adminRole}
      />
    </div>
  );
}
