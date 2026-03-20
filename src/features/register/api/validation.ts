import * as yup from 'yup';

const CONTACT_NUMBER_PATTERN = /^[0-9+\-()\s]*$/;

export const registerValidationSchema = yup.object({
  userName: yup
    .string()
    .trim()
    .required('Username is required.')
    .max(100, 'Username must not exceed 100 characters.'),
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
  middleName: yup.string().trim().max(100, 'Middle name must not exceed 100 characters.'),
  email: yup
    .string()
    .trim()
    .required('Email address is required.')
    .email('Enter a valid email address.')
    .max(150, 'Email address must not exceed 150 characters.'),
  birthDate: yup.string(),
  contactNumber: yup
    .string()
    .trim()
    .matches(CONTACT_NUMBER_PATTERN, {
      message: 'Contact number can only contain numbers, spaces, and + - ( ).',
      excludeEmptyString: true,
    })
    .max(20, 'Contact number must not exceed 20 characters.'),
  address: yup.string().trim().max(255, 'Address must not exceed 255 characters.'),
  religion: yup.string().trim().max(100, 'Religion must not exceed 100 characters.'),
  startDate: yup.string(),
  bio: yup.string().trim().max(500, 'Bio must not exceed 500 characters.'),
  clinicName: yup
    .string()
    .trim()
    .required('Clinic name is required.')
    .max(150, 'Clinic name must not exceed 150 characters.'),
  clinicAddress: yup
    .string()
    .trim()
    .required('Clinic address is required.')
    .max(255, 'Clinic address must not exceed 255 characters.'),
  clinicEmailAddress: yup
    .string()
    .trim()
    .required('Clinic email address is required.')
    .email('Enter a valid clinic email address.')
    .max(150, 'Clinic email address must not exceed 150 characters.'),
  clinicContactNumber: yup
    .string()
    .trim()
    .required('Clinic contact number is required.')
    .matches(CONTACT_NUMBER_PATTERN, {
      message: 'Clinic contact number can only contain numbers, spaces, and + - ( ).',
      excludeEmptyString: true,
    })
    .max(20, 'Clinic contact number must not exceed 20 characters.'),
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required.')
    .oneOf([yup.ref('password')], 'Password and confirm password must match.'),
});

export const publicClinicRegistrationValidationSchema = registerValidationSchema.shape({
  verificationCode: yup
    .string()
    .trim()
    .required('Verification code is required.')
    .length(6, 'Verification code must be 6 digits.'),
});
