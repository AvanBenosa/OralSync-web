import * as yup from 'yup';

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const medicalHistoryValidationSchema = yup.object({
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
});
