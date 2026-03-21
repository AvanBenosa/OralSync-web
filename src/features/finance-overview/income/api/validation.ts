import * as yup from 'yup';

import {
  PROGRESS_NOTE_ACCOUNT_OPTIONS,
  PROGRESS_NOTE_CATEGORY_OPTIONS,
  ProgressNoteAccount,
  ProgressNoteCategory,
} from '../../../patient-profile-modules/progress-note/api/types';

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const financeIncomeValidationSchema = yup.object({
  patientInfoId: yup.string().trim().required('Patient is required.'),
  date: yup
    .string()
    .required('Date is required.')
    .test('valid-date', 'Date must be a valid date.', (value?: string) => {
      if (!value) {
        return false;
      }

      return isValidDateString(value);
    })
    .test('four-digit-year', 'Date year must be exactly 4 digits.', (value?: string) => {
      if (!value) {
        return false;
      }

      return hasFourDigitYear(value);
    }),
  procedure: yup
    .string()
    .trim()
    .required('Procedure is required.')
    .max(150, 'Procedure must not exceed 150 characters.'),
  category: yup
    .mixed<ProgressNoteCategory | ''>()
    .oneOf(['', ...PROGRESS_NOTE_CATEGORY_OPTIONS], 'Select a valid category.'),
  remarks: yup.string().trim().max(1000, 'Remarks must not exceed 1000 characters.'),
  account: yup
    .mixed<ProgressNoteAccount | ''>()
    .oneOf(['', ...PROGRESS_NOTE_ACCOUNT_OPTIONS], 'Select a valid account.'),
  amount: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable()
    .min(0, 'Cost cannot be negative.'),
  discount: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable()
    .min(0, 'Discount cannot be negative.')
    .test(
      'discount-not-greater-than-amount',
      'Discount cannot be greater than cost.',
      function (value?: number | null) {
        if (value === undefined || value === null) {
          return true;
        }

        const { amount } = this.parent as { amount?: number };

        if (amount === undefined || amount === null) {
          return true;
        }

        return value <= amount;
      }
    ),
  totalAmountDue: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable(),
  amountPaid: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable()
    .min(0, 'Amount paid cannot be negative.')
    .test(
      'amount-paid-not-greater-than-total',
      'Amount paid cannot be greater than total amount due.',
      function (value?: number | null) {
        if (value === undefined || value === null) {
          return true;
        }

        const { amount, discount } = this.parent as {
          amount?: number;
          discount?: number;
        };

        if (amount === undefined || amount === null) {
          return true;
        }

        const totalAmountDue = amount - (discount ?? 0);

        return value <= totalAmountDue;
      }
    ),
  balance: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable(),
});

export type FinanceIncomeValidationSchema = yup.InferType<typeof financeIncomeValidationSchema>;
