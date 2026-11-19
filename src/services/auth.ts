import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class AuthError extends Error {
  code: string;
  hostname: string;

  constructor(message: string, code: string, hostname = '') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.hostname = hostname;
  }
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
          revoke?: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

// Reuse existing app if initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const provider = new GoogleAuthProvider();
// Workspace Drive scope
provider.addScope(DRIVE_SCOPE);

// In-memory access token & GIS user cache (CRITICAL: never persist in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGisUser: AuthUser | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: AuthUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (cachedGisUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(cachedGisUser, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      cachedGisUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')));
      // In case it already loaded
      setTimeout(() => {
        if (window.google?.accounts?.oauth2) resolve();
      }, 800);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
    document.head.appendChild(script);
  });
}

async function signInWithGisFallback(): Promise<{ user: AuthUser; accessToken: string }> {
  const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId;
  if (!clientId) {
    throw new AuthError(
      'Konfigurasi OAuth Client ID tidak ditemukan.',
      'auth/unauthorized-domain',
      window.location.hostname
    );
  }

  await loadGisScript();

  if (!window.google?.accounts?.oauth2) {
    throw new AuthError(
      'Layanan Google Sign-In tidak tersedia.',
      'auth/unauthorized-domain',
      window.location.hostname
    );
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: clientId,
      scope: `${DRIVE_SCOPE} https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`,
      callback: (response) => {
        if (response.error) {
          reject(
            new AuthError(
              response.error_description || response.error,
              response.error === 'access_denied' ? 'auth/popup-closed-by-user' : 'auth/unauthorized-domain',
              window.location.hostname
            )
          );
          return;
        }
        if (!response.access_token) {
          reject(
            new AuthError(
              'Token akses Google tidak diterima.',
              'auth/no-token',
              window.location.hostname
            )
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (err) => {
        const type = err?.type || 'unknown';
        if (type === 'popup_closed') {
          reject(new AuthError('Jendela login ditutup sebelum selesai.', 'auth/popup-closed-by-user'));
        } else if (type === 'popup_failed_to_open') {
          reject(new AuthError('Popup login diblokir oleh browser.', 'auth/popup-blocked'));
        } else {
          reject(
            new AuthError(
              err?.message || 'Domain belum diotorisasi untuk login Google.',
              'auth/unauthorized-domain',
              window.location.hostname
            )
          );
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });

  // Fetch user profile
  let userProfile: AuthUser = {
    uid: `gis-${Date.now()}`,
    email: null,
    displayName: 'Pengguna Google Drive',
    photoURL: null,
  };

  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const info = await profileRes.json();
      userProfile = {
        uid: info.sub || userProfile.uid,
        email: info.email || null,
        displayName: info.name || info.email || userProfile.displayName,
        photoURL: info.picture || null,
      };
    }
  } catch {
    // Non-fatal: Drive upload still works with the token
  }

  cachedAccessToken = accessToken;
  cachedGisUser = userProfile;
  return { user: userProfile, accessToken };
}

export const googleSignIn = async (): Promise<{ user: AuthUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    cachedGisUser = null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = error?.code || '';

    // Fallback to Google Identity Services when Firebase reports unauthorized-domain
    if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        return await signInWithGisFallback();
      } catch (gisErr: any) {
        if (gisErr instanceof AuthError) {
          throw gisErr;
        }
        throw new AuthError(
          error?.message || 'Domain belum terdaftar pada Authorized Domains Firebase.',
          'auth/unauthorized-domain',
          window.location.hostname
        );
      }
    }

    if (code === 'auth/popup-blocked') {
      throw new AuthError('Popup login diblokir oleh browser. Izinkan popup untuk situs ini.', code);
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new AuthError('Login dibatalkan karena jendela popup ditutup.', 'auth/popup-closed-by-user');
    }

    console.error('Sign in error:', error);
    throw new AuthError(
      error?.message || 'Gagal menghubungkan ke Google Drive.',
      code || 'auth/unknown',
      window.location.hostname
    );
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): AuthUser | null => {
  return auth.currentUser || cachedGisUser;
};

export const logout = async (): Promise<void> => {
  if (cachedAccessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(cachedAccessToken);
    } catch {
      // ignore revoke error
    }
  }
  await signOut(auth);
  cachedAccessToken = null;
  cachedGisUser = null;
};
