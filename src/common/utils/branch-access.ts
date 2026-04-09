export const isClinicWideRole = (role?: string | null): boolean => {
  const normalizedRole = role?.trim().toLowerCase() || '';
  return normalizedRole === 'user' || normalizedRole === 'superadmin';
};

export const canAccessSettingsModule = (role?: string | null): boolean => {
  const normalizedRole = role?.trim().toLowerCase() || '';
  return normalizedRole === 'superadmin' || normalizedRole === 'branchadmin';
};

export const isBranchScopedRole = (role?: string | null): boolean => {
  const normalizedRole = role?.trim().toLowerCase() || '';

  return (
    normalizedRole === 'branchadmin' ||
    normalizedRole === 'dentist' ||
    normalizedRole === 'assistant' ||
    normalizedRole === 'receptionist'
  );
};
