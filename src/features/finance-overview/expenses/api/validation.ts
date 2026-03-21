import * as yup from 'yup';

import {
  CLINIC_EXPENSE_CATEGORY_OPTIONS,
  ClinicExpenseCategory,
} from './types';

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const financeExpenseValidationSchema = yup.object({
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
  category: yup
    .mixed<ClinicExpenseCategory | ''>()
    .required('Category is required.')
    .oneOf(CLINIC_EXPENSE_CATEGORY_OPTIONS, 'Select a valid category.'),
  remarks: yup.string().trim().max(1000, 'Remarks must not exceed 1000 characters.'),
  amount: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Amount must be a valid number.')
    .required('Amount is required.')
    .min(0, 'Amount cannot be negative.'),
});

export type FinanceExpenseValidationSchema = yup.InferType<typeof financeExpenseValidationSchema>;
