import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUsernameFromToken, isTokenExpired } from '../../common/utils/jwt';
import { isClinicWideRole } from '../../common/utils/branch-access';
import { useThemeStore } from './themeStore';
import type { AuthUser } from '../services/auth-api';

const resolveSessionBranchId = (
  user?: AuthUser | null,
  currentBranchId?: string | null
): string | null => {
  const userDefaultBranchId = user?.defaultBranchId?.trim() || null;
  const currentScope = user?.currentScope?.trim().toLowerCase() || '';

  if (!user) {
    return null;
  }

  if (currentScope === 'branch') {
    return userDefaultBranchId;
  }

  if (currentScope === 'clinic') {
    return currentBranchId?.trim() || null;
  }

  if (!isClinicWideRole(user.role)) {
    return userDefaultBranchId;
  }

  return currentBranchId?.trim() || null;
};

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  token: string | null;
  user: AuthUser | null;
  role: string;
  branchId: string | null;
  requiresRegistration: boolean;
  setSession: (
    token: string,
    username?: string,
    requiresRegistration?: boolean,
    user?: AuthUser | null
  ) => void;
  setRequiresRegistration: (requiresRegistration: boolean) => void;
  updateUser: (user: AuthUser | null) => void;
  setBranchId: (branchId: string | null) => void;
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
      role: '',
      branchId: null,
      requiresRegistration: false,
      setSession: (token, username, requiresRegistration = false, user = null) =>
        set({
          isLoggedIn: true,
          token,
          username: username || getUsernameFromToken(token),
          user,
          role: user?.role || '',
          branchId: resolveSessionBranchId(user),
          requiresRegistration,
        }),
      setRequiresRegistration: (requiresRegistration) => set({ requiresRegistration }),
      updateUser: (user) =>
        set((state) => ({
          user,
          role: user?.role || '',
          branchId: resolveSessionBranchId(user, state.branchId),
        })),
      setBranchId: (branchId) =>
        set((state) => ({
          branchId: resolveSessionBranchId(state.user, branchId),
        })),
      logout: () => {
        useThemeStore.getState().resetColorMode();
        set({
          isLoggedIn: false,
          username: '',
          token: null,
          user: null,
          role: '',
          branchId: null,
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
            role: '',
            branchId: null,
            requiresRegistration: false,
          });
          return;
        }

        set({
          isLoggedIn: true,
          username: get().username || getUsernameFromToken(token),
          user: get().user,
          role: get().user?.role || '',
          branchId: resolveSessionBranchId(get().user, get().branchId),
          requiresRegistration: get().requiresRegistration,
        });
      },
    }),
    {
      name: 'dmd-auth',
    }
  )
);
