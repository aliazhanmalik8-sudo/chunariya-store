import { fileToDataUrl } from './format';

const ADMIN_TOKEN_KEY = 'chunariya_admin_token';
let memoryAdminToken: string | null = null;

export function getAdminToken(): string | null {
  if (memoryAdminToken) return memoryAdminToken;
  try {
    const fromSession = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (fromSession) {
      memoryAdminToken = fromSession;
      return fromSession;
    }
  } catch {
    // Ignore restricted iframe storage errors
  }
  try {
    const fromLocal = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (fromLocal) {
      memoryAdminToken = fromLocal;
      return fromLocal;
    }
  } catch {
    // Ignore restricted iframe storage errors
  }
  return null;
}

export function setAdminToken(token: string): void {
  memoryAdminToken = token;
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminToken(): void {
  memoryAdminToken = null;
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function adminFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}). Please try again.`);
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
    }
    const msg =
      typeof parsed.error === 'string'
        ? parsed.error
        : `Request failed with status ${res.status}.`;
    throw new Error(msg);
  }

  return parsed as T;
}

async function compressImageIfNeeded(file: File): Promise<string> {
  const rawDataUrl = await fileToDataUrl(file);
  if (file.type === 'image/gif' || file.size <= 750 * 1024) {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outMime, 0.88));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

export async function uploadAdminImage(file: File): Promise<string> {
  const dataUrl = await compressImageIfNeeded(file);
  const res = await adminFetch<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, fileName: file.name }),
  });
  return res.url;
}
