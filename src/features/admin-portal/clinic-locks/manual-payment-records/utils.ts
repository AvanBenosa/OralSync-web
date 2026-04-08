export const formatManualPaymentAmount = (amount?: number): string =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount ?? 0);

export const formatManualPaymentDate = (value?: string | Date | null): string => {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatManualPaymentStatus = (status?: string): string => {
  if (!status?.trim()) {
    return '--';
  }

  return status === 'Failed' ? 'Rejected' : status;
};
