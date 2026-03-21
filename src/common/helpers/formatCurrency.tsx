import { FunctionComponent, JSX } from 'react';

export type CurrencyValue = number | string | null | undefined;

export type FormatCurrencyOptions = {
  locale?: string;
  currency?: string;
  fallback?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export type FormatCurrencyProps = {
  value?: CurrencyValue;
} & FormatCurrencyOptions;

const toNumber = (value?: CurrencyValue): number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const parsedValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const formatCurrency = (
  value?: CurrencyValue,
  options: FormatCurrencyOptions = {}
): string => {
  const {
    locale = 'en-US',
    currency = 'PHP',
    fallback = '--',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const numericValue = toNumber(value);
  if (numericValue === null) {
    return fallback;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
};

const FormatCurrency: FunctionComponent<FormatCurrencyProps> = (
  props: FormatCurrencyProps
): JSX.Element => {
  const {
    value,
    locale = 'en-US',
    currency = 'PHP',
    fallback = '--',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = props;

  return (
    <>
      {formatCurrency(value, {
        locale,
        currency,
        fallback,
        minimumFractionDigits,
        maximumFractionDigits,
      })}
    </>
  );
};

export default FormatCurrency;
