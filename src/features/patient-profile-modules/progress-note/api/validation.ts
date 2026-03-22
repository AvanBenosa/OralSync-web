import * as yup from 'yup';

import {
  PROGRESS_NOTE_ACCOUNT_OPTIONS,
  PROGRESS_NOTE_CATEGORY_OPTIONS,
  ProgressNoteAccount,
  ProgressNoteCategory,
} from './types';

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const progressNoteValidationSchema = yup.object({
  id: yup.string().default(''),
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
  nextVisit: yup
    .string()
    .test('valid-date', 'Next visit must be a valid date.', (value?: string) => {
      if (!value) {
        return true;
      }

      return isValidDateString(value);
    })
    .test('four-digit-year', 'Next visit year must be exactly 4 digits.', (value?: string) => {
      if (!value) {
        return true;
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
  clinicalFinding: yup
    .string()
    .trim()
    .max(1000, 'Clinical finding must not exceed 1000 characters.'),
  assessment: yup.string().trim().max(1000, 'Assessment must not exceed 1000 characters.'),
  toothNumber: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .notRequired()
    .nullable()
    .integer('Tooth number must be a whole number.')
    .min(1, 'Tooth number must be at least 1.')
    .max(32, 'Tooth number must not be greater than 32.'),
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
    .min(0, 'Discount cannot be negative.'),
  totalAmountDue: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable(),
  amountPaid: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable()
    .min(0, 'Amount paid cannot be negative.'),
  balance: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .nullable(),
});

export type ProgressNoteValidationSchema = yup.InferType<typeof progressNoteValidationSchema>;
