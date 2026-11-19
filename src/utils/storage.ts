import { CapturedPhoto, EventConfig, FrameTemplate } from '../types';

const CONFIG_KEY = 'v_photobooth_config';
const FRAMES_KEY = 'v_photobooth_frames';
const DB_NAME = 'VirtualPhotoboothDB';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';
const ASSET_STORE = 'assets';

// Default Event Banner - Elegant wedding floral aesthetic vector background (SVG data URL)
export const DEFAULT_BANNER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141c2e" />
      <stop offset="40%" stop-color="#1a233a" />
      <stop offset="100%" stop-color="#0b0f19" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#c59b27" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#aa7c11" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <circle cx="600" cy="280" r="380" fill="url(#glow)" />
  
  <!-- Subtle geometric background arch -->
  <path d="M 300 630 L 300 320 A 300 300 0 0 1 900 320 L 900 630" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="4 6" />
  <path d="M 330 630 L 330 335 A 270 270 0 0 1 870 335 L 870 630" fill="none" stroke="#d4af37" stroke-width="1" stroke-opacity="0.2" />

  <!-- Floral botanical branch left -->
  <g transform="translate(180, 260) scale(0.9)" stroke="url(#gold)" stroke-width="1.8" fill="none" opacity="0.75">
    <path d="M 0 150 Q 60 50 160 0" />
    <path d="M 30 115 Q 15 90 35 85 Q 50 100 30 115 Z" fill="#d4af37" fill-opacity="0.2" />
    <path d="M 75 80 Q 65 50 90 50 Q 95 75 75 80 Z" fill="#d4af37" fill-opacity="0.2" />
    <path d="M 120 40 Q 120 10 145 18 Q 140 45 120 40 Z" fill="#d4af37" fill-opacity="0.2" />
  </g>

  <!-- Floral botanical branch right -->
  <g transform="translate(1020, 260) scale(-0.9, 0.9)" stroke="url(#gold)" stroke-width="1.8" fill="none" opacity="0.75">
    <path d="M 0 150 Q 60 50 160 0" />
    <path d="M 30 115 Q 15 90 35 85 Q 50 100 30 115 Z" fill="#d4af37" fill-opacity="0.2" />
    <path d="M 75 80 Q 65 50 90 50 Q 95 75 75 80 Z" fill="#d4af37" fill-opacity="0.2" />
    <path d="M 120 40 Q 120 10 145 18 Q 140 45 120 40 Z" fill="#d4af37" fill-opacity="0.2" />
  </g>

  <!-- Center sparkles -->
  <circle cx="600" cy="110" r="3" fill="#fef08a" opacity="0.8" />
  <circle cx="540" cy="150" r="2" fill="#d4af37" opacity="0.6" />
  <circle cx="660" cy="150" r="2.5" fill="#d4af37" opacity="0.7" />
  <polygon points="600,90 603,105 618,108 603,111 600,126 597,111 582,108 597,105" fill="url(#gold)" opacity="0.85" />
</svg>
`)}`;

export const DEFAULT_CONFIG: EventConfig = {
  category: 'WEDDING MEMORIES',
  title: 'Fatimah & Naufal',
  date: '13 AGUSTUS 2026',
  quote: 'Dua jiwa yang bersatu dalam ikatan suci, mengukir janji cinta abadi penuh berkah dan bahagia selamanya.',
  vendorName: 'PutraTechno',
  bannerUrl: DEFAULT_BANNER,
  logoUrl: '',
  themeColor: 'gold',
  adminPin: 'putrajamal',
  clientPin: 'user123',
  autoUploadDrive: true,
  driveFolderName: 'virtual moment',
};

export const DEFAULT_FRAMES: FrameTemplate[] = [
  {
    id: 'frame-floral-wedding',
    name: 'Royal Floral Gold',
    theme: 'floral',
    description: 'Bingkai elegan bertabur ornamen floral emas klasik dan aksen monogram mewah.',
    badge: 'Paling Populer',
    enabled: true,
    aspectRatio: '4:5',
    primaryColor: '#d4af37',
    secondaryColor: '#1e293b',
  },
  {
    id: 'frame-polaroid-minimalist',
    name: 'Modern Polaroid Clean',
    theme: 'polaroid',
    description: 'Gaya aesthetic polaroid kekinian dengan bingkai putih bersih dan typography hangat.',
    badge: 'Trendy Aesthetic',
    enabled: true,
    aspectRatio: '4:5',
    primaryColor: '#ffffff',
    secondaryColor: '#0f172a',
  },
  {
    id: 'frame-celebration-gold',
    name: 'Celebration Gold Sparkle',
    theme: 'celebration',
    description: 'Nuansa pesta meriah dengan kilau sparkle emas dan pita selebrasi bergengsi.',
    badge: 'Party Glamour',
    enabled: true,
    aspectRatio: '4:5',
    primaryColor: '#fbbf24',
    secondaryColor: '#451a03',
  },
];

// Open IndexedDB instance
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage helpers for Config
export function loadEventConfig(): EventConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveEventConfig(config: EventConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save event config', e);
  }
}

// LocalStorage helpers for Frames
export function loadFrameTemplates(): FrameTemplate[] {
  try {
    const raw = localStorage.getItem(FRAMES_KEY);
    if (!raw) return DEFAULT_FRAMES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_FRAMES;
    return parsed;
  } catch {
    return DEFAULT_FRAMES;
  }
}

export function saveFrameTemplates(frames: FrameTemplate[]): void {
  try {
    localStorage.setItem(FRAMES_KEY, JSON.stringify(frames));
  } catch (e) {
    console.error('Failed to save frames', e);
  }
}

// IndexedDB helpers for Photos
export async function savePhoto(photo: CapturedPhoto): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllPhotos(): Promise<CapturedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const photos = (req.result as CapturedPhoto[]) || [];
      // Sort newest first
      photos.sort((a, b) => b.timestamp - a.timestamp);
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.delete(photoId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updatePhoto(photo: CapturedPhoto): Promise<void> {
  return savePhoto(photo);
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
