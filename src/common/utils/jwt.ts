export interface DecodedToken {
  exp?: number;
  unique_name?: string;
  nameid?: string;
  [key: string]: unknown;
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return window.atob(padded);
};

export const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(decodeBase64Url(parts[1])) as DecodedToken;
  } catch {
    return null;
  }
};

export const getUsernameFromToken = (token: string) => {
  const decoded = decodeJwt(token);
  const username = decoded?.nameid || decoded?.unique_name;
  return typeof username === 'string' ? username : '';
};

export const isTokenExpired = (token: string) => {
  const decoded = decodeJwt(token);

  if (!decoded?.exp) {
    return false;
  }

  return decoded.exp * 1000 <= Date.now();
};
