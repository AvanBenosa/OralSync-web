import type { AdminClinicModel } from '../api/types';
import {
  formatSubscriptionValidityDate,
  parseSubscriptionDate,
} from '../../../common/utils/subscription';

export const SUBSCRIPTION_OPTIONS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Premium', label: 'Premium' },
] as const;

export const formatClinicSubscriptionType = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  return value
    .replace(/^Premuim$/i, 'Premium')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
};

export const formatClinicValidityDate = (value?: string): string =>
  formatSubscriptionValidityDate(value, 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const toClinicDateInputValue = (value?: string | Date): string => {
  const parsedDate =
    value instanceof Date
      ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
      : parseSubscriptionDate(value);

  if (!parsedDate) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getClinicContactValue = (item?: Partial<AdminClinicModel> | null): string =>
  item?.contactNumber?.trim() || item?.emailAddress?.trim() || '--';
