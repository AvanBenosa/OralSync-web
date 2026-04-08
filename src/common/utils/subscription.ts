export const normalizeSubscriptionType = (value?: string | null): string => {
  const normalizedValue = value?.trim().toLowerCase() || '';

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue === 'premium' || normalizedValue === 'premuim') {
    return 'pro';
  }

  return normalizedValue;
};

export const normalizeClinicStatus = (value?: string | null): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const parseSubscriptionDate = (value?: string | null): Date | null => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

    if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
      return null;
    }

    return parsedDate;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return null;
  }

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
};

export const formatSubscriptionValidityDate = (
  value?: string | null,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const parsedDate = parseSubscriptionDate(value);

  if (!parsedDate) {
    return '--';
  }

  return parsedDate.toLocaleDateString(locale, options);
};

export const getSubscriptionDaysRemaining = (value?: string | null): number | null => {
  const parsedDate = parseSubscriptionDate(value);

  if (!parsedDate) {
    return null;
  }

  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((parsedDate.getTime() - currentDate.getTime()) / ONE_DAY_IN_MS);
};

export const isBasicSubscription = (value?: string | null): boolean =>
  normalizeSubscriptionType(value) === 'basic';

export const isPendingClinicStatus = (value?: string | null): boolean =>
  ['pending', 'pendingpayment'].includes(normalizeClinicStatus(value));

export const isActiveClinicStatus = (value?: string | null): boolean =>
  normalizeClinicStatus(value) === 'active';

export const getSubscriptionUserLimit = (value?: string | null): number | null => {
  const normalizedValue = normalizeSubscriptionType(value);

  if (normalizedValue === 'basic') {
    return 2;
  }

  if (normalizedValue === 'standard') {
    return 10;
  }

  return null;
};
