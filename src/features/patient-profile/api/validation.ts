import * as yup from 'yup';

const stripHtmlContent = (value?: string): string =>
  (value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const patientEmailValidationSchema = yup.object({
  recipientEmail: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Recipient email is required.'),
  subject: yup.string().trim().required('Subject is required.').max(150, 'Subject is too long.'),
  body: yup
    .string()
    .required('Message is required.')
    .test('message-required', 'Message is required.', (value) => stripHtmlContent(value).length > 0)
    .test(
      'message-length',
      'Message is too long.',
      (value) => stripHtmlContent(value).length <= 10000
    ),
});

const isValidPhilippineMobileNumber = (value?: string): boolean => {
  const digits = (value || '').replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('09')) {
    return true;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return true;
  }

  if (digits.length === 12 && digits.startsWith('639')) {
    return true;
  }

  return false;
};

export const patientSmsValidationSchema = yup.object({
  recipientNumber: yup
    .string()
    .trim()
    .required('Recipient mobile number is required.')
    .test('valid-ph-mobile', 'Enter a valid Philippine mobile number.', (value) =>
      isValidPhilippineMobileNumber(value)
    ),
  body: yup.string().trim().required('Message is required.').max(1000, 'Message is too long.'),
});
