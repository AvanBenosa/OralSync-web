import * as yup from 'yup';

const CONTACT_NUMBER_PATTERN = /^[0-9+\-()\s]*$/;

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

export const patientValidationSchema = yup.object({
  //id: yup.number().default(0),
  //patientNumber: yup.string().trim().max(30, 'Patient number must not exceed 30 characters.'),
  //profilePicture: yup.string().trim(),
  firstName: yup
    .string()
    .trim()
    .required('First name is required.')
    .max(100, 'First name must not exceed 100 characters.'),
  lastName: yup
    .string()
    .trim()
    .required('Last name is required.')
    .max(100, 'Last name must not exceed 100 characters.'),
  //middleName: yup.string().trim().max(100, 'Middle name must not exceed 100 characters.'),
  emailAddress: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(150, 'Email address must not exceed 150 characters.'),
  birthDate: yup
    .string()
    .test('valid-date', 'Birth date must be a valid date.', (value?: string) => {
      if (!value) {
        return true;
      }

      return isValidDateString(value);
    })
    .test('four-digit-year', 'Birth date year must be exactly 4 digits.', (value?: string) => {
      if (!value) {
        return true;
      }

      return hasFourDigitYear(value);
    })
    .test('not-in-future', 'Birth date cannot be in the future.', (value?: string) => {
      if (!value) {
        return true;
      }

      return value <= getTodayDateString();
    }),
  contactNumber: yup
    .string()
    .trim()
    .matches(CONTACT_NUMBER_PATTERN, {
      message: 'Contact number can only contain numbers, spaces, and + - ( ).',
      excludeEmptyString: true,
    })
    .max(20, 'Contact number must not exceed 20 characters.'),
  //address: yup.string().trim().max(255, 'Address must not exceed 255 characters.'),
  //occupation: yup.string().trim().max(100, 'Occupation must not exceed 100 characters.'),
  //religion: yup.string().trim().max(100, 'Religion must not exceed 100 characters.'),
});

export type PatientValidationSchema = yup.InferType<typeof patientValidationSchema>;
