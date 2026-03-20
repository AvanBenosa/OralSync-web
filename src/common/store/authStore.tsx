import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUsernameFromToken, isTokenExpired } from '../../common/utils/jwt';
import { useThemeStore } from './themeStore';
import type { AuthUser } from '../services/auth-api';

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  token: string | null;
  user: AuthUser | null;
  requiresRegistration: boolean;
  setSession: (
    token: string,
    username?: string,
    requiresRegistration?: boolean,
    user?: AuthUser | null
  ) => void;
  setRequiresRegistration: (requiresRegistration: boolean) => void;
  updateUser: (user: AuthUser | null) => void;
  logout: () => void;
  hydrateSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: '',
      token: null,
      user: null,
      requiresRegistration: false,
      setSession: (token, username, requiresRegistration = false, user = null) =>
        set({
          isLoggedIn: true,
          token,
          username: username || getUsernameFromToken(token),
          user,
          requiresRegistration,
        }),
      setRequiresRegistration: (requiresRegistration) => set({ requiresRegistration }),
      updateUser: (user) => set({ user }),
      logout: () => {
        useThemeStore.getState().resetColorMode();
        set({
          isLoggedIn: false,
          username: '',
          token: null,
          user: null,
          requiresRegistration: false,
        });
      },
      hydrateSession: () => {
        const { token } = get();

        if (!token || isTokenExpired(token)) {
          set({
            isLoggedIn: false,
            username: '',
            token: null,
            user: null,
            requiresRegistration: false,
          });
          return;
        }

        set({
          isLoggedIn: true,
          username: get().username || getUsernameFromToken(token),
          user: get().user,
          requiresRegistration: get().requiresRegistration,
        });
      },
    }),
    {
      name: 'dmd-auth',
    }
  )
);
