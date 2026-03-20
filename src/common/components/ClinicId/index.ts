import { useAuthStore } from '../../store/authStore';

export type ClinicIdValue = string | null | undefined;

export const resolveClinicId = (
  clinicId?: ClinicIdValue,
  fallbackClinicId?: ClinicIdValue
): string | null => {
  const candidate =
    clinicId !== undefined && clinicId !== null && clinicId !== ''
      ? clinicId
      : fallbackClinicId !== undefined && fallbackClinicId !== null && fallbackClinicId !== ''
        ? fallbackClinicId
        : null;

  return candidate?.trim() || null;
};

export const useClinicId = (clinicId?: ClinicIdValue): string | null => {
  const userClinicId = useAuthStore((state) => state.user?.clinicId ?? null);

  return resolveClinicId(clinicId, userClinicId);
};
