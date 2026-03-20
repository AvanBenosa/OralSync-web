import * as yup from 'yup';

export const patientEmailValidationSchema = yup.object({
  recipientEmail: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Recipient email is required.'),
  subject: yup.string().trim().required('Subject is required.').max(150, 'Subject is too long.'),
  body: yup.string().trim().required('Message is required.').max(5000, 'Message is too long.'),
});
