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

export const isBasicSubscription = (value?: string | null): boolean =>
  normalizeSubscriptionType(value) === 'basic';

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
