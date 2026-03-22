import { FunctionComponent, JSX, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  // MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { isAxiosError } from 'axios';
import { Formik } from 'formik';
import {
  registerClinic,
  requestClinicRegistrationCode,
  type AuthResponse,
} from '../../common/services/auth-api';
import { authPalette, authPrimaryGradient, authSoftSurfaceGradient } from './auth-palette';
import {
  // REGISTER_EMPLOYMENT_OPTIONS,
  // REGISTER_PREFIX_OPTIONS,
  // REGISTER_SUFFIX_OPTIONS,
  RegisterEmploymentType,
  RegisterPrefix,
  RegisterSuffix,
  type PublicClinicRegistrationFormValues,
} from '../register/api/types';
import { publicClinicRegistrationValidationSchema } from '../register/api/validation';

type ClinicRegistrationFormProps = {
  onSuccess: (response: AuthResponse) => void | Promise<void>;
};

const sectionCardSx = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 3,
  border: `1px solid ${authPalette.border}`,
  background: authSoftSurfaceGradient,
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
};

const createInitialValues = (): PublicClinicRegistrationFormValues => ({
  verificationCode: '',
  userName: '',
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  birthDate: '',
  contactNumber: '',
  address: '',
  suffix: RegisterSuffix.None,
  preffix: RegisterPrefix.None,
  religion: '',
  startDate: '',
  employmentType: RegisterEmploymentType.None,
  bio: '',
  clinicName: '',
  clinicAddress: '',
  clinicEmailAddress: '',
  clinicContactNumber: '',
  password: '',
  confirmPassword: '',
});

const ClinicRegistrationForm: FunctionComponent<ClinicRegistrationFormProps> = ({
  onSuccess,
}): JSX.Element => {
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = useMemo(() => createInitialValues(), []);

  return (
    <Formik
      enableReinitialize
      validateOnChange={false}
      initialValues={initialValues}
      validationSchema={publicClinicRegistrationValidationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
        setStatus(undefined);

        try {
          const response = await registerClinic({
            ...values,
            birthDate: values.birthDate || undefined,
            startDate: values.startDate || undefined,
            suffix: Number(values.suffix),
            preffix: Number(values.preffix),
            employmentType: Number(values.employmentType),
          });

          onSuccess(response);
        } catch (error) {
          if (isAxiosError(error)) {
            setStatus(
              typeof error.response?.data === 'string' ? error.response.data : error.message
            );
          } else {
            setStatus('Unable to complete registration.');
          }
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        values,
        handleBlur,
        handleChange,
        handleSubmit,
        isSubmitting,
        errors,
        touched,
        submitCount,
        setFieldTouched,
        status,
      }): JSX.Element => {
        const shouldShowError = (fieldName: keyof PublicClinicRegistrationFormValues): boolean =>
          Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

        const handleSendVerificationCode = async (): Promise<void> => {
          setVerificationMessage('');
          setVerificationError('');
          setFieldTouched('email', true, false);

          if (!values.email.trim()) {
            setVerificationError('Enter the super admin email address first.');
            return;
          }

          setIsSendingCode(true);

          try {
            const response = await requestClinicRegistrationCode({ email: values.email.trim() });
            setVerificationMessage(
              `Verification code sent to ${response.email}. It expires in ${response.expiresInMinutes} minutes.`
            );
          } catch (error) {
            if (isAxiosError(error)) {
              setVerificationError(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setVerificationError('Unable to send verification code.');
            }
          } finally {
            setIsSendingCode(false);
          }
        };

        return (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}
          >
            {status ? <Alert severity="error">{status}</Alert> : null}
            {verificationError ? <Alert severity="error">{verificationError}</Alert> : null}
            {verificationMessage ? <Alert severity="success">{verificationMessage}</Alert> : null}

            <Box sx={sectionCardSx}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  color: authPalette.primary,
                  fontWeight: 800,
                  letterSpacing: 1.6,
                }}
              >
                Step 1
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: authPalette.text, mb: 0.5 }}>
                Verify Email
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Use the super admin email to receive a 6-digit verification code before creating the
                clinic.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Super Admin Email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('email')}
                    helperText={shouldShowError('email') ? errors.email : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    onClick={() => void handleSendVerificationCode()}
                    disabled={isSendingCode}
                    sx={{
                      height: '100%',
                      minHeight: 40,
                      borderRadius: 2,
                      color: authPalette.primary,
                      borderColor: authPalette.borderStrong,
                      '&:hover': {
                        borderColor: authPalette.primary,
                        backgroundColor: 'rgba(104, 186, 127, 0.08)',
                      },
                    }}
                  >
                    {isSendingCode ? <CircularProgress size={20} color="inherit" /> : 'Send Code'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Verification Code"
                    name="verificationCode"
                    value={values.verificationCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('verificationCode')}
                    helperText={
                      shouldShowError('verificationCode')
                        ? errors.verificationCode
                        : 'Enter the 6-digit code from the email.'
                    }
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={sectionCardSx}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  color: authPalette.primary,
                  fontWeight: 800,
                  letterSpacing: 1.6,
                }}
              >
                Step 2
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: authPalette.text, mb: 0.5 }}>
                Clinic Information
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                These details identify the clinic workspace that will own patients, appointments,
                and staff accounts.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Clinic Name"
                    name="clinicName"
                    value={values.clinicName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('clinicName')}
                    helperText={shouldShowError('clinicName') ? errors.clinicName : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Clinic Email Address"
                    name="clinicEmailAddress"
                    type="email"
                    value={values.clinicEmailAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('clinicEmailAddress')}
                    helperText={
                      shouldShowError('clinicEmailAddress') ? errors.clinicEmailAddress : undefined
                    }
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Clinic Contact Number"
                    name="clinicContactNumber"
                    value={values.clinicContactNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('clinicContactNumber')}
                    helperText={
                      shouldShowError('clinicContactNumber')
                        ? errors.clinicContactNumber
                        : undefined
                    }
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Clinic Address"
                    name="clinicAddress"
                    value={values.clinicAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    multiline
                    minRows={2}
                    error={shouldShowError('clinicAddress')}
                    helperText={shouldShowError('clinicAddress') ? errors.clinicAddress : undefined}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={sectionCardSx}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  color: authPalette.primary,
                  fontWeight: 800,
                  letterSpacing: 1.6,
                }}
              >
                Step 3
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: authPalette.text, mb: 0.5 }}>
                Super Admin Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Set up the first account that will manage this clinic after registration.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Username"
                    name="userName"
                    value={values.userName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('userName')}
                    helperText={shouldShowError('userName') ? errors.userName : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Contact Number"
                    name="contactNumber"
                    value={values.contactNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    error={shouldShowError('contactNumber')}
                    helperText={shouldShowError('contactNumber') ? errors.contactNumber : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('firstName')}
                    helperText={shouldShowError('firstName') ? errors.firstName : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Middle Name"
                    name="middleName"
                    value={values.middleName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    error={shouldShowError('middleName')}
                    helperText={shouldShowError('middleName') ? errors.middleName : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('lastName')}
                    helperText={shouldShowError('lastName') ? errors.lastName : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('password')}
                    helperText={shouldShowError('password') ? errors.password : undefined}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setShowPassword((current) => !current)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    required
                    error={shouldShowError('confirmPassword')}
                    helperText={
                      shouldShowError('confirmPassword') ? errors.confirmPassword : undefined
                    }
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              aria-label={
                                showConfirmPassword
                                  ? 'Hide confirm password'
                                  : 'Show confirm password'
                              }
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* <Box
              sx={{
                ...sectionCardSx,
                background:
                  'linear-gradient(180deg, rgba(242,248,252,0.95) 0%, rgba(255,255,255,0.96) 100%)',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#183b56', mb: 0.5 }}>
                Additional Profile Details
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Optional account details you can complete now instead of updating later.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Prefix"
                    name="preffix"
                    select
                    value={values.preffix}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  >
                    {REGISTER_PREFIX_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Suffix"
                    name="suffix"
                    select
                    value={values.suffix}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  >
                    {REGISTER_SUFFIX_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={values.startDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Employment Type"
                    name="employmentType"
                    select
                    value={values.employmentType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  >
                    {REGISTER_EMPLOYMENT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Religion"
                    name="religion"
                    value={values.religion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    error={shouldShowError('religion')}
                    helperText={shouldShowError('religion') ? errors.religion : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Address"
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    error={shouldShowError('address')}
                    helperText={shouldShowError('address') ? errors.address : undefined}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Bio"
                    name="bio"
                    value={values.bio}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    error={shouldShowError('bio')}
                    helperText={shouldShowError('bio') ? errors.bio : undefined}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Box> */}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                fontWeight: 800,
                letterSpacing: 0.5,
                background: authPrimaryGradient,
                boxShadow: authPalette.buttonShadow,
                '&:hover': {
                  background: authPrimaryGradient,
                  boxShadow: authPalette.buttonShadow,
                },
              }}
            >
              {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Create Clinic'}
            </Button>
          </Box>
        );
      }}
    </Formik>
  );
};

export default ClinicRegistrationForm;
