const readEnv = (key, fallback = '') => {
  try {
    // CRA exposes only REACT_APP_* variables
    return process.env[key] ?? fallback;
  } catch {
    return fallback;
  }
};

const parseFlags = (val) => {
  if (!val) return {};
  try {
    // Try JSON object or array
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed) return parsed;
  } catch {
    // comma-separated: "streaming,featureX"
    const out = {};
    val.split(',').map(s => s.trim()).filter(Boolean).forEach(k => { out[k] = true; });
    return out;
  }
  return {};
};

// PUBLIC_INTERFACE
export const isProd = () => readEnv('REACT_APP_NODE_ENV') === 'production';

// PUBLIC_INTERFACE
export const isDev = !isProd();

// PUBLIC_INTERFACE
export const API_BASE = (() => {
  const v = readEnv('REACT_APP_API_BASE') || readEnv('REACT_APP_BACKEND_URL') || '';
  return v;
})();

// PUBLIC_INTERFACE
export const WS_URL = (() => {
  const v = readEnv('REACT_APP_WS_URL') || '';
  return v;
})();

// PUBLIC_INTERFACE
export const flags = {
  featureFlags: parseFlags(readEnv('REACT_APP_FEATURE_FLAGS')),
  experimentsEnabled: ['1', 'true', 'yes', 'on'].includes(String(readEnv('REACT_APP_EXPERIMENTS_ENABLED')).toLowerCase()),
  streamingUsedLast: false,
};

// PUBLIC_INTERFACE
export function getStoredTheme() {
  /** Returns stored theme or null. */
  try {
    return localStorage.getItem('theme') || null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function storeTheme(theme) {
  /** Stores theme preference. */
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function prefersReducedMotion() {
  /** Detects prefers-reduced-motion media query. */
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
