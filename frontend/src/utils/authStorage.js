const TOKEN_KEY = 'sqms-token:v1';
const REMEMBER_COOKIE = 'sqms-remember:v1';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const setCookie = (name, value, maxAgeMs) => {
  if (typeof document === 'undefined') return;

  const expires = new Date(Date.now() + maxAgeMs).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const getPersistedToken = () => {
  if (typeof window === 'undefined') return null;

  return getCookie(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

export const getRememberedLogin = () => {
  if (typeof window === 'undefined') return false;

  return getCookie(REMEMBER_COOKIE) === '1';
};

export const persistAuthToken = (token, rememberMe) => {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  deleteCookie(TOKEN_KEY);

  if (rememberMe) {
    setCookie(TOKEN_KEY, token, THIRTY_DAYS_MS);
    setCookie(REMEMBER_COOKIE, '1', THIRTY_DAYS_MS);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    deleteCookie(REMEMBER_COOKIE);
  }
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  deleteCookie(TOKEN_KEY);
  deleteCookie(REMEMBER_COOKIE);
};

export { TOKEN_KEY };