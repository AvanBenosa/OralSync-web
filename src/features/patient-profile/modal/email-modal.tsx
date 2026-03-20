import { FunctionComponent, JSX, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { HandleSendPatientEmail, HandleSendPatientSms } from '../api/handlers';
import { PatientProfileStateProps } from '../api/types';
import { patientEmailValidationSchema, patientSmsValidationSchema } from '../api/validation';

type MessageChannel = 'email' | 'sms';

type PatientMessageFormValues = {
  patientId?: string;
  recipientEmail: string;
  recipientNumber: string;
  subject: string;
  body: string;
};

const createInitialValues = (props: PatientProfileStateProps): PatientMessageFormValues => ({
  patientId: props.state.patientId ?? props.state.profile?.id,
  recipientEmail: props.state.profile?.emailAddress?.trim() || '',
  recipientNumber: props.state.profile?.contactNumber?.trim() || '',
  subject: props.state.profile?.firstName
    ? `Message for ${props.state.profile.firstName}`
    : 'Patient message',
  body: '',
});

const PatientProfileEmailModal: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [channel, setChannel] = useState<MessageChannel>('email');

  const validationSchema = useMemo(
    () => (channel === 'email' ? patientEmailValidationSchema : patientSmsValidationSchema),
    [channel]
  );

  const handleClose = (): void => {
    setChannel('email');
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
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Send Patient Message</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={createInitialValues(props)}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            if (channel === 'email') {
              await HandleSendPatientEmail(
                {
                  patientId: values.patientId,
                  recipientEmail: values.recipientEmail,
                  subject: values.subject,
                  body: values.body,
                },
                state,
                setState
              );
            } else {
              await HandleSendPatientSms(
                {
                  patientId: values.patientId,
                  recipientNumber: values.recipientNumber,
                  message: values.body,
                  senderName: '',
                  usePriority: false,
                },
                state,
                setState
              );
            }
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus(
                channel === 'email'
                  ? 'Unable to queue patient email.'
                  : 'Unable to queue patient sms.'
              );
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
              <ToggleButtonGroup
                exclusive
                value={channel}
                onChange={(_, nextValue: MessageChannel | null) => {
                  if (!nextValue) {
                    return;
                  }

                  setChannel(nextValue);
                }}
                size="small"
                sx={{
                  mb: 2,
                  p: 0.5,
                  borderRadius: 3,
                  background: 'rgba(235, 243, 250, 0.92)',
                }}
              >
                <ToggleButton value="email" sx={{ px: 2.2, fontWeight: 700 }}>
                  Email
                </ToggleButton>
                <ToggleButton value="sms" sx={{ px: 2.2, fontWeight: 700 }}>
                  SMS
                </ToggleButton>
              </ToggleButtonGroup>

              {status ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {status}
                </Alert>
              ) : null}

              {channel === 'email' ? (
                <>
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
                </>
              ) : (
                <TextField
                  fullWidth
                  label="Recipient Number"
                  name="recipientNumber"
                  value={values.recipientNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.recipientNumber && errors.recipientNumber)}
                  helperText={
                    (touched.recipientNumber && errors.recipientNumber) ||
                    'Use 09XXXXXXXXX, 9XXXXXXXXX, or 639XXXXXXXXX.'
                  }
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}

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
                {isSubmitting ? 'Sending...' : channel === 'email' ? 'Send Email' : 'Send SMS'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientProfileEmailModal;
