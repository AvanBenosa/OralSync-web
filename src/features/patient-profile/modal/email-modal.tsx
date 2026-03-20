import { FunctionComponent, JSX } from 'react';
import { Alert, Button, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { HandleSendPatientEmail } from '../api/handlers';
import { PatientEmailRequestModel, PatientProfileStateProps } from '../api/types';
import { patientEmailValidationSchema } from '../api/validation';

type PatientEmailFormValues = PatientEmailRequestModel;

const createInitialValues = (props: PatientProfileStateProps): PatientEmailFormValues => ({
  patientId: props.state.patientId ?? props.state.profile?.id,
  recipientEmail: props.state.profile?.emailAddress?.trim() || '',
  subject: props.state.profile?.firstName
    ? `Message for ${props.state.profile.firstName}`
    : 'Patient message',
  body: '',
});

const PatientProfileEmailModal: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, setState } = props;

  const handleClose = (): void => {
    setState((prev: any) => ({
      ...prev,
      openModal: false,
      isEmail: false,
      isDelete: false,
      isUpdate: false,
    }));
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Send Patient Email</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={createInitialValues(props)}
        validationSchema={patientEmailValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await HandleSendPatientEmail(values, state, setState);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to queue patient email.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          status,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
        }): JSX.Element => (
          <>
            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              {status ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {status}
                </Alert>
              ) : null}
              <TextField
                fullWidth
                label="Recipient Email"
                name="recipientEmail"
                type="email"
                value={values.recipientEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.recipientEmail && errors.recipientEmail)}
                helperText={touched.recipientEmail && errors.recipientEmail}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={values.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.subject && errors.subject)}
                helperText={touched.subject && errors.subject}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Message"
                name="body"
                value={values.body}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.body && errors.body)}
                helperText={touched.body && errors.body}
                multiline
                minRows={6}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientProfileEmailModal;
