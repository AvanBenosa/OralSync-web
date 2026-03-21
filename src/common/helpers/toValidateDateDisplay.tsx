import { FunctionComponent, JSX } from 'react';
import moment from 'moment';

export type DateDisplayValue = string | Date | null | undefined;

export type ToValidateDateDisplayProps = {
  value?: DateDisplayValue;
  format?: string;
  fallback?: string;
  utc?: boolean;
};

const getMomentValue = (value?: DateDisplayValue, utc: boolean = false): moment.Moment | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const parsedValue = utc ? moment.utc(value) : moment(value);
  return parsedValue.isValid() ? parsedValue : null;
};

export const toValidDateDisplay = (
  value?: DateDisplayValue,
  format: string = 'YYYY-MM-DD',
  fallback: string = '---',
  utc: boolean = false
): string => {
  const parsedValue = getMomentValue(value, utc);
  return parsedValue ? parsedValue.format(format) : fallback;
};

const ToValidateDateDisplay: FunctionComponent<ToValidateDateDisplayProps> = (
  props: ToValidateDateDisplayProps
): JSX.Element => {
  const { value, format = 'YYYY-MM-DD', fallback = '---', utc = false } = props;

  return <>{toValidDateDisplay(value, format, fallback, utc)}</>;
};

export default ToValidateDateDisplay;
