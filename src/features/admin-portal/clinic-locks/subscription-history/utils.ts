import { formatCurrency } from '../../../../common/helpers/formatCurrency';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import {
  formatClinicSubscriptionType,
  SUBSCRIPTION_OPTIONS,
} from '../utils';

export const DEFAULT_SUBSCRIPTION_TYPE = SUBSCRIPTION_OPTIONS[0]?.value || 'Basic';

export const formatSubscriptionHistoryDate = (value?: string | Date): string =>
  toValidDateDisplay(value, 'MMM DD, YYYY');

export const formatSubscriptionHistoryAmount = (value?: number): string =>
  formatCurrency(value, {
    currency: 'PHP',
    fallback: '--',
  });

export const formatSubscriptionHistoryType = (value?: string): string =>
  formatClinicSubscriptionType(value);
