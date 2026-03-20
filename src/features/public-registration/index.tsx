import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import * as yup from 'yup';
import { useSearchParams } from 'react-router-dom';
import {
  createPublicPatientAppointment,
  findExistingPublicPatient,
  getPublicClinicRegistrationContext,
  requestPublicEmailVerificationCode,
  resolvePublicClinicBannerSrc,
  verifyPublicEmailVerificationCode,
} from './api/api';
import {
  PublicClinicRegistrationContextModel,
  PublicEmailVerificationCodeResponse,
  PublicExistingPatientLookupResponse,
} from './api/types';

type RegistrationMode = 'new' | 'existing';

type PublicRegistrationFormValues = {
  firstName: string;
  lastName: string;
  middleName: string;
  emailAddress: string;
  birthDate: string;
  contactNumber: string;
  appointmentDateFrom: string;
  appointmentDateTo: string;
  reasonForVisit: string;
  remarks: string;
  emailVerificationCode: string;
};

const initialValues: PublicRegistrationFormValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  emailAddress: '',
  birthDate: '',
  contactNumber: '',
  appointmentDateFrom: '',
  appointmentDateTo: '',
  reasonForVisit: '',
  remarks: '',
  emailVerificationCode: '',
};

const PublicRegistrationPage: FunctionComponent = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get('clinicId')?.trim() || '';
  const [clinic, setClinic] = useState<PublicClinicRegistrationContextModel | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('new');
  const [existingPatient, setExistingPatient] =
    useState<PublicExistingPatientLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUpPatient, setIsLookingUpPatient] = useState(false);
  const [isSendingVerificationCode, setIsSendingVerificationCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] =
    useState<PublicEmailVerificationCodeResponse | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState('');

  useEffect(() => {
    if (!clinicId) {
      setClinic(null);
      setIsLoading(false);
      setLoadError('Clinic link is missing or invalid.');
      return;
    }

    setIsLoading(true);
    setLoadError('');

    void getPublicClinicRegistrationContext(clinicId)
      .then((response) => {
        setClinic(response);
      })
      .catch((error) => {
        setClinic(null);
        setLoadError(
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load clinic registration page.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clinicId]);

  const bannerSrc = useMemo(
    () => resolvePublicClinicBannerSrc(clinic?.bannerImagePath),
    [clinic?.bannerImagePath]
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        firstName: yup.string().trim().required('First name is required.'),
        lastName: yup.string().trim().required('Last name is required.'),
        emailAddress:
          registrationMode === 'existing' || registrationMode === 'new'
            ? yup
                .string()
                .trim()
                .email('Enter a valid email address.')
                .required('Email address is required.')
            : yup.string().trim().email('Enter a valid email address.').optional(),
        birthDate: yup.string().optional(),
        appointmentDateFrom: yup.string().required('Appointment date and time is required.'),
        appointmentDateTo: yup.string().required('Appointment end time is required.'),
        reasonForVisit: yup.string().trim().required('Reason for visit is required.'),
      }),
    [registrationMode]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at top left, rgba(79, 130, 176, 0.16), transparent 32%), linear-gradient(180deg, #f7fafc 0%, #ebf2f7 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: 4,
            border: '1px solid rgba(194, 208, 220, 0.92)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(243, 248, 252, 0.99))',
            boxShadow: '0 18px 44px rgba(28, 56, 86, 0.08)',
          }}
        >
          <Box
            sx={{
              minHeight: 220,
              px: { xs: 3, md: 5 },
              py: { xs: 4, md: 5 },
              color: '#fff',
              background: bannerSrc
                ? `linear-gradient(rgba(18, 42, 64, 0.58), rgba(18, 42, 64, 0.66)), url(${bannerSrc}) center/cover no-repeat`
                : 'linear-gradient(135deg, #1d4f7a 0%, #2f6db3 54%, #7bb3df 100%)',
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.84,
              }}
            >
              Public Appointment Registration
            </Typography>
            <Typography sx={{ mt: 1.2, fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>
              {clinic?.clinicName || 'Clinic Registration'}
            </Typography>
            <Typography
              sx={{ mt: 1.4, maxWidth: 680, color: 'rgba(255,255,255,0.86)', lineHeight: 1.7 }}
            >
              Fill out your patient information and preferred appointment schedule. Your
              registration will be saved directly to this clinic.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {isLoading ? (
              <Box
                sx={{
                  minHeight: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress />
              </Box>
            ) : loadError ? (
              <Alert severity="error">{loadError}</Alert>
            ) : clinic?.isLocked ? (
              <Alert severity="warning">
                This clinic is not accepting appointment registrations right now.
              </Alert>
            ) : (
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                validateOnChange={false}
                onSubmit={async (values, { resetForm, setStatus, setSubmitting }) => {
                  setStatus(undefined);
                  setSuccessMessage('');

                  try {
                    if (registrationMode === 'existing' && !existingPatient?.patientId) {
                      setStatus(
                        'Verify the existing patient record before submitting the appointment.'
                      );
                      return;
                    }

                    if (registrationMode === 'new' && !emailVerified) {
                      setStatus('Verify the email address before submitting the registration.');
                      return;
                    }

                    const appointmentDateTo = values.appointmentDateFrom
                      ? `${values.appointmentDateFrom.slice(0, 10)}T${values.appointmentDateTo}:00`
                      : '';

                    const response = await createPublicPatientAppointment({
                      clinicId,
                      existingPatientId:
                        registrationMode === 'existing' ? existingPatient?.patientId : undefined,
                      firstName: values.firstName.trim(),
                      lastName: values.lastName.trim(),
                      middleName: values.middleName.trim(),
                      emailAddress: values.emailAddress.trim(),
                      emailVerificationCode:
                        registrationMode === 'new'
                          ? values.emailVerificationCode.trim()
                          : undefined,
                      birthDate: values.birthDate || undefined,
                      contactNumber: values.contactNumber.trim(),
                      appointmentDateFrom: `${values.appointmentDateFrom}:00`,
                      appointmentDateTo,
                      reasonForVisit: values.reasonForVisit.trim(),
                      remarks: values.remarks.trim(),
                    });

                    setSuccessMessage(
                      `Registration submitted for ${response.clinicName}. Patient No: ${response.patientNumber}.`
                    );
                    resetForm();
                    setExistingPatient(null);
                    setLookupError('');
                    setRegistrationMode('new');
                    setEmailVerificationSent(null);
                    setEmailVerified(false);
                    setEmailVerificationError('');
                  } catch (error) {
                    if (isAxiosError(error)) {
                      setStatus(
                        typeof error.response?.data === 'string'
                          ? error.response.data
                          : error.message
                      );
                    } else {
                      setStatus('Unable to submit registration.');
                    }
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({
                  values,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                  status,
                  errors,
                  touched,
                  submitCount,
                }): JSX.Element => {
                  const shouldShowError = (
                    fieldName: keyof PublicRegistrationFormValues
                  ): boolean =>
                    Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

                  const handleExistingLookup = async (): Promise<void> => {
                    setLookupError('');
                    setExistingPatient(null);

                    try {
                      await yup
                        .object({
                          firstName: yup.string().trim().required('First name is required.'),
                          lastName: yup.string().trim().required('Last name is required.'),
                          emailAddress: yup
                            .string()
                            .trim()
                            .email('Enter a valid email address.')
                            .required('Email address is required.'),
                        })
                        .validate(
                          {
                            firstName: values.firstName,
                            lastName: values.lastName,
                            emailAddress: values.emailAddress,
                          },
                          { abortEarly: false }
                        );
                    } catch {
                      setLookupError(
                        'Enter first name, last name, and email address to check an existing record.'
                      );
                      return;
                    }

                    setIsLookingUpPatient(true);

                    try {
                      const response = await findExistingPublicPatient({
                        clinicId,
                        firstName: values.firstName,
                        lastName: values.lastName,
                        emailAddress: values.emailAddress,
                      });

                      setExistingPatient(response);
                    } catch (error) {
                      setExistingPatient(null);
                      setLookupError(
                        isAxiosError(error) && typeof error.response?.data === 'string'
                          ? error.response.data
                          : 'No patient record matched the provided information.'
                      );
                    } finally {
                      setIsLookingUpPatient(false);
                    }
                  };

                  const resetNewPatientEmailVerification = (): void => {
                    setEmailVerificationSent(null);
                    setEmailVerified(false);
                    setEmailVerificationError('');
                  };

                  const handleRequestEmailVerificationCode = async (): Promise<void> => {
                    setEmailVerificationError('');
                    setEmailVerified(false);

                    try {
                      await yup
                        .object({
                          emailAddress: yup
                            .string()
                            .trim()
                            .email('Enter a valid email address.')
                            .required('Email address is required.'),
                        })
                        .validate(
                          {
                            emailAddress: values.emailAddress,
                          },
                          { abortEarly: false }
                        );
                    } catch {
                      setEmailVerificationError(
                        'Enter a valid email address before requesting a verification code.'
                      );
                      return;
                    }

                    setIsSendingVerificationCode(true);

                    try {
                      const response = await requestPublicEmailVerificationCode({
                        clinicId,
                        emailAddress: values.emailAddress,
                      });

                      setEmailVerificationSent(response);
                    } catch (error) {
                      setEmailVerificationSent(null);
                      setEmailVerificationError(
                        isAxiosError(error) && typeof error.response?.data === 'string'
                          ? error.response.data
                          : 'Unable to send verification code.'
                      );
                    } finally {
                      setIsSendingVerificationCode(false);
                    }
                  };

                  const handleVerifyEmailCode = async (): Promise<void> => {
                    setEmailVerificationError('');

                    try {
                      await yup
                        .object({
                          emailAddress: yup
                            .string()
                            .trim()
                            .email('Enter a valid email address.')
                            .required('Email address is required.'),
                          emailVerificationCode: yup
                            .string()
                            .trim()
                            .required('Verification code is required.'),
                        })
                        .validate(
                          {
                            emailAddress: values.emailAddress,
                            emailVerificationCode: values.emailVerificationCode,
                          },
                          { abortEarly: false }
                        );
                    } catch {
                      setEmailVerificationError(
                        'Enter the email address and verification code to confirm the new patient registration.'
                      );
                      return;
                    }

                    setIsVerifyingCode(true);

                    try {
                      const response = await verifyPublicEmailVerificationCode({
                        clinicId,
                        emailAddress: values.emailAddress,
                        verificationCode: values.emailVerificationCode,
                      });

                      setEmailVerified(Boolean(response.verified));
                    } catch (error) {
                      setEmailVerified(false);
                      setEmailVerificationError(
                        isAxiosError(error) && typeof error.response?.data === 'string'
                          ? error.response.data
                          : 'Unable to verify email code.'
                      );
                    } finally {
                      setIsVerifyingCode(false);
                    }
                  };

                  return (
                    <Box component="form" onSubmit={handleSubmit}>
                      {status ? (
                        <Alert severity="error" sx={{ mb: 2.5 }}>
                          {status}
                        </Alert>
                      ) : null}
                      {successMessage ? (
                        <Alert severity="success" sx={{ mb: 2.5 }}>
                          {successMessage}
                        </Alert>
                      ) : null}

                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 7 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid rgba(206, 218, 229, 0.95)',
                              background: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: '14px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(180deg, #f1f7fc 0%, #dbe9f5 100%)',
                                  border: '1px solid rgba(174, 198, 218, 0.9)',
                                }}
                              >
                                <PersonAddAlt1RoundedIcon sx={{ color: '#2f6db3' }} />
                              </Box>
                              <Box>
                                <Typography sx={{ color: '#143a63', fontWeight: 800 }}>
                                  Patient Information
                                </Typography>
                                <Typography sx={{ color: '#5e7891', fontSize: 13 }}>
                                  {registrationMode === 'existing'
                                    ? 'Check an existing patient record before creating the appointment request.'
                                    : 'Enter the patient details that will be saved to `PatientInfos`.'}
                                </Typography>
                              </Box>
                            </Box>

                            <ToggleButtonGroup
                              exclusive
                              value={registrationMode}
                              onChange={(_, nextValue: RegistrationMode | null) => {
                                if (!nextValue) {
                                  return;
                                }

                                setRegistrationMode(nextValue);
                                setExistingPatient(null);
                                setLookupError('');
                                resetNewPatientEmailVerification();
                              }}
                              size="small"
                              sx={{
                                mb: 2,
                                p: 0.5,
                                borderRadius: 3,
                                background: 'rgba(235, 243, 250, 0.92)',
                              }}
                            >
                              <ToggleButton value="new" sx={{ px: 2.2, fontWeight: 700 }}>
                                New Patient
                              </ToggleButton>
                              <ToggleButton value="existing" sx={{ px: 2.2, fontWeight: 700 }}>
                                Existing Record
                              </ToggleButton>
                            </ToggleButtonGroup>

                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                  label="First Name"
                                  name="firstName"
                                  value={values.firstName}
                                  onChange={(event) => {
                                    handleChange(event);
                                    if (registrationMode === 'existing') {
                                      setExistingPatient(null);
                                      setLookupError('');
                                    } else {
                                      resetNewPatientEmailVerification();
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  required
                                  error={shouldShowError('firstName')}
                                  helperText={
                                    shouldShowError('firstName') ? errors.firstName : undefined
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                  label="Last Name"
                                  name="lastName"
                                  value={values.lastName}
                                  onChange={(event) => {
                                    handleChange(event);
                                    if (registrationMode === 'existing') {
                                      setExistingPatient(null);
                                      setLookupError('');
                                    } else {
                                      resetNewPatientEmailVerification();
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  required
                                  error={shouldShowError('lastName')}
                                  helperText={
                                    shouldShowError('lastName') ? errors.lastName : undefined
                                  }
                                />
                              </Grid>
                              {registrationMode === 'new' ? (
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <TextField
                                    label="Middle Name"
                                    name="middleName"
                                    value={values.middleName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    fullWidth
                                    size="small"
                                  />
                                </Grid>
                              ) : null}
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  label="Email Address"
                                  name="emailAddress"
                                  type="email"
                                  value={values.emailAddress}
                                  onChange={(event) => {
                                    handleChange(event);
                                    if (registrationMode === 'existing') {
                                      setExistingPatient(null);
                                      setLookupError('');
                                    } else {
                                      resetNewPatientEmailVerification();
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  error={shouldShowError('emailAddress')}
                                  helperText={
                                    shouldShowError('emailAddress')
                                      ? errors.emailAddress
                                      : undefined
                                  }
                                />
                              </Grid>
                              {registrationMode === 'new' ? (
                                <>
                                  <Grid size={{ xs: 12 }}>
                                    <Box
                                      sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        border: '1px dashed rgba(180, 201, 219, 0.95)',
                                        background:
                                          'linear-gradient(180deg, rgba(246, 250, 253, 0.98), rgba(238, 245, 250, 0.98))',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: 1.5,
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <Box>
                                          <Typography sx={{ color: '#214868', fontWeight: 800 }}>
                                            Email Verification
                                          </Typography>
                                          <Typography
                                            sx={{ color: '#6b8196', fontSize: 13, mt: 0.5 }}
                                          >
                                            Send a code to the patient email and verify it before
                                            submitting the appointment request.
                                          </Typography>
                                        </Box>
                                        <Button
                                          type="button"
                                          variant="outlined"
                                          onClick={() => {
                                            void handleRequestEmailVerificationCode();
                                          }}
                                          disabled={isSendingVerificationCode}
                                        >
                                          {isSendingVerificationCode
                                            ? 'Sending...'
                                            : emailVerificationSent
                                            ? 'Resend Code'
                                            : 'Send Code'}
                                        </Button>
                                      </Box>

                                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                        <Grid size={{ xs: 12, sm: 8 }}>
                                          <TextField
                                            label="Verification Code"
                                            name="emailVerificationCode"
                                            value={values.emailVerificationCode}
                                            onChange={(event) => {
                                              handleChange(event);
                                              setEmailVerified(false);
                                              setEmailVerificationError('');
                                            }}
                                            onBlur={handleBlur}
                                            fullWidth
                                            size="small"
                                          />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                          <Button
                                            type="button"
                                            variant="contained"
                                            fullWidth
                                            sx={{ height: 40 }}
                                            onClick={() => {
                                              void handleVerifyEmailCode();
                                            }}
                                            disabled={isVerifyingCode || !emailVerificationSent}
                                          >
                                            {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
                                          </Button>
                                        </Grid>
                                      </Grid>

                                      {emailVerificationSent ? (
                                        <Alert severity={emailVerified ? 'success' : 'info'} sx={{ mt: 1.5 }}>
                                          {emailVerified
                                            ? 'Email address verified. You can now submit the new patient appointment.'
                                            : `Verification code sent to ${emailVerificationSent.email}. It expires in ${emailVerificationSent.expiresInMinutes} minutes.`}
                                        </Alert>
                                      ) : null}

                                      {emailVerificationError ? (
                                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                                          {emailVerificationError}
                                        </Alert>
                                      ) : null}
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                      label="Birth Date"
                                      name="birthDate"
                                      type="date"
                                      value={values.birthDate}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="small"
                                      InputLabelProps={{ shrink: true }}
                                      error={shouldShowError('birthDate')}
                                      helperText={
                                        shouldShowError('birthDate') ? errors.birthDate : undefined
                                      }
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                      label="Contact Number"
                                      name="contactNumber"
                                      value={values.contactNumber}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="small"
                                    />
                                  </Grid>
                                </>
                              ) : (
                                <Grid size={{ xs: 12 }}>
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: 3,
                                      border: '1px dashed rgba(180, 201, 219, 0.95)',
                                      background:
                                        'linear-gradient(180deg, rgba(246, 250, 253, 0.98), rgba(238, 245, 250, 0.98))',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <Box>
                                        <Typography sx={{ color: '#214868', fontWeight: 800 }}>
                                          Check Existing Patient Record
                                        </Typography>
                                        <Typography
                                          sx={{ color: '#6b8196', fontSize: 13, mt: 0.5 }}
                                        >
                                          Use first name, last name, and email to confirm a
                                          matching patient.
                                        </Typography>
                                      </Box>
                                      <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={
                                          isLookingUpPatient ? (
                                            <CircularProgress size={16} />
                                          ) : (
                                            <ManageSearchRoundedIcon />
                                          )
                                        }
                                        onClick={() => {
                                          void handleExistingLookup();
                                        }}
                                        disabled={isLookingUpPatient}
                                      >
                                        {isLookingUpPatient ? 'Checking...' : 'Check Record'}
                                      </Button>
                                    </Box>

                                    {lookupError ? (
                                      <Alert severity="warning" sx={{ mt: 1.5 }}>
                                        {lookupError}
                                      </Alert>
                                    ) : null}

                                    {existingPatient ? (
                                      <Box
                                        sx={{
                                          mt: 1.5,
                                          p: 1.75,
                                          borderRadius: 3,
                                          border: '1px solid rgba(157, 198, 167, 0.95)',
                                          background:
                                            'linear-gradient(180deg, rgba(241, 251, 244, 0.98), rgba(230, 245, 235, 0.98))',
                                        }}
                                      >
                                        <Typography sx={{ color: '#1d6844', fontWeight: 800 }}>
                                          Existing patient record found
                                        </Typography>
                                        <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
                                          <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                                              Last Name
                                            </Typography>
                                            <Typography sx={{ color: '#214868', fontWeight: 700 }}>
                                              {existingPatient.lastName || '--'}
                                            </Typography>
                                          </Grid>
                                          <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                                              First Name
                                            </Typography>
                                            <Typography sx={{ color: '#214868', fontWeight: 700 }}>
                                              {existingPatient.firstName || '--'}
                                            </Typography>
                                          </Grid>
                                          <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                                              Email Address
                                            </Typography>
                                            <Typography sx={{ color: '#214868', fontWeight: 700 }}>
                                              {existingPatient.emailAddress || '--'}
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    ) : null}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid rgba(206, 218, 229, 0.95)',
                              background: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: '14px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(180deg, #f1f7fc 0%, #dbe9f5 100%)',
                                  border: '1px solid rgba(174, 198, 218, 0.9)',
                                }}
                              >
                                <EventAvailableRoundedIcon sx={{ color: '#2f6db3' }} />
                              </Box>
                              <Box>
                                <Typography sx={{ color: '#143a63', fontWeight: 800 }}>
                                  Appointment Request
                                </Typography>
                                <Typography sx={{ color: '#5e7891', fontSize: 13 }}>
                                  This will be saved to `AppointmentRequests` with appointment type
                                  `Online` and status `Pending`.
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  label="Appointment Date From"
                                  name="appointmentDateFrom"
                                  type="datetime-local"
                                  value={values.appointmentDateFrom}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  required
                                  InputLabelProps={{ shrink: true }}
                                  error={shouldShowError('appointmentDateFrom')}
                                  helperText={
                                    shouldShowError('appointmentDateFrom')
                                      ? errors.appointmentDateFrom
                                      : undefined
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  label="Appointment Date To"
                                  name="appointmentDateTo"
                                  type="time"
                                  value={values.appointmentDateTo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  required
                                  InputLabelProps={{ shrink: true }}
                                  error={shouldShowError('appointmentDateTo')}
                                  helperText={
                                    shouldShowError('appointmentDateTo')
                                      ? errors.appointmentDateTo
                                      : 'Uses the same date as Appointment Date From.'
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  label="Reason For Visit"
                                  name="reasonForVisit"
                                  value={values.reasonForVisit}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  required
                                  error={shouldShowError('reasonForVisit')}
                                  helperText={
                                    shouldShowError('reasonForVisit')
                                      ? errors.reasonForVisit
                                      : undefined
                                  }
                                />
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <TextField
                                  label="Remarks"
                                  name="remarks"
                                  value={values.remarks}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  fullWidth
                                  size="small"
                                  multiline
                                  minRows={4}
                                />
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                        </Button>
                      </Box>
                    </Box>
                  );
                }}
              </Formik>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicRegistrationPage;
