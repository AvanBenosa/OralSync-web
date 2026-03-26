import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    if (error.response?.status === 423) {
      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().updateUser(
        currentUser
          ? {
              ...currentUser,
              isLocked: true,
            }
          : currentUser
      );
    }

    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => API_BASE_URL;

export const resolveApiAssetUrl = (path?: string): string => {
  if (!path?.trim()) {
    return '';
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${getApiBaseUrl()}${path}`;
  }

  return `${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`;
};

export const isProtectedStoragePath = (path?: string): boolean =>
  Boolean(path?.trim() && path.trim().startsWith('/storage/'));

export const resolveProtectedApiAssetUrl = (path?: string): string => {
  if (!path?.trim()) {
    return '';
  }

  if (path.startsWith('/storage/')) {
    return `${getApiBaseUrl()}/api/dmd${path}`;
  }

  return resolveApiAssetUrl(path);
};

export const loadProtectedAssetObjectUrl = async (path: string): Promise<string> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(resolveProtectedApiAssetUrl(path), {
    method: 'GET',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`Unable to load protected asset. Status: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
