import type { AuthUser } from '../services/auth-api';

export type PortalType = 'clinic' | 'admin';

export const getUserPortalType = (user?: AuthUser | null): PortalType =>
  user?.portalType === 'admin' ? 'admin' : 'clinic';

export const getPortalHomePath = (portalType: PortalType): string =>
  portalType === 'admin' ? '/admin/dashboard' : '/dashboard';
