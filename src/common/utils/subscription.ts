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
