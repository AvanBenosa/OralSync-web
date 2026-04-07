import { FunctionComponent, JSX } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { registerBootstrapUser } from '../../common/services/auth-api';
import { useAuthStore } from '../../common/store/authStore';
import {
  REGISTER_EMPLOYMENT_OPTIONS,
  REGISTER_PREFIX_OPTIONS,
  REGISTER_ROLE_OPTIONS,
  REGISTER_SUFFIX_OPTIONS,
  RegisterEmploymentType,
  RegisterFormValues,
  RegisterPrefix,
  RegisterSuffix,
  RegisterUserRole,
} from './api/types';
import { registerValidationSchema } from './api/validation';
import FormValidationFocus from './form-validation-focus';

type RegisterBootstrapModalProps = {
  open: boolean;
};

const createInitialValues = (): RegisterFormValues => ({
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
  role: RegisterUserRole.SuperAdmin,
  clinicName: '',
  clinicAddress: '',
  clinicEmailAddress: '',
  clinicContactNumber: '',
  password: '',
  confirmPassword: '',
});

const REGISTER_FIELD_ORDER: Array<keyof RegisterFormValues> = [
  'clinicName',
  'clinicEmailAddress',
  'clinicContactNumber',
  'clinicAddress',
  'userName',
  'email',
  'firstName',
  'middleName',
  'lastName',
  'contactNumber',
  'religion',
  'address',
  'bio',
  'password',
  'confirmPassword',
];

const RegisterBootstrapModal: FunctionComponent<RegisterBootstrapModalProps> = (
  props: RegisterBootstrapModalProps
): JSX.Element => {
  const { open } = props;
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = (): void => {
    logout();
    navigate('/logout-success', { replace: true });
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" disableEscapeKeyDown>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues()}
        validationSchema={registerValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            const response = await registerBootstrapUser({
              ...values,
              birthDate: values.birthDate || undefined,
              startDate: values.startDate || undefined,
              suffix: Number(values.suffix),
              preffix: Number(values.preffix),
              employmentType: Number(values.employmentType),
              role: Number(values.role),
            });

            setSession(
              response.token,
              response.user?.name || response.user?.userName || response.user?.email,
              response.requiresRegistration,
              response.user
            );

            toast.success('Registration completed. The temporary seed account has been replaced.');
            window.location.reload();
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
          handleChange,
          handleBlur,
          handleSubmit,
          status,
          errors,
          touched,
          submitCount,
          isSubmitting,
        }): JSX.Element => {
          const shouldShowError = (fieldName: keyof RegisterFormValues): boolean =>
            Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

          return (
            <>
              <FormValidationFocus
                errors={errors}
                submitCount={submitCount}
                isSubmitting={isSubmitting}
                fieldOrder={REGISTER_FIELD_ORDER}
              />
              <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>Complete Registration</DialogTitle>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                <Typography sx={{ color: '#50677d', mb: 2 }}>
                  You signed in with the temporary seeded account. Create your real account now.
                  After registration, the seeded account will be removed.
                </Typography>

                {status ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {status}
                  </Alert>
                ) : null}

                <Grid container spacing={2} component="form" onSubmit={handleSubmit}>
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontWeight: 800, color: '#24415c', mb: 0.5 }}>
                      Clinic Information
                    </Typography>
                  </Grid>
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
                        shouldShowError('clinicEmailAddress')
                          ? errors.clinicEmailAddress
                          : undefined
                      }
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
                      helperText={
                        shouldShowError('clinicAddress') ? errors.clinicAddress : undefined
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontWeight: 800, color: '#24415c', mt: 1, mb: 0.5 }}>
                      Account Information
                    </Typography>
                  </Grid>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Email Address"
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
                    />
                  </Grid>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Contact Number"
                      name="contactNumber"
                      value={values.contactNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      size="small"
                      error={shouldShowError('contactNumber')}
                      helperText={
                        shouldShowError('contactNumber') ? errors.contactNumber : undefined
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
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
                    >
                      {REGISTER_SUFFIX_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Role"
                      name="role"
                      select
                      value={values.role}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      size="small"
                    >
                      {REGISTER_ROLE_OPTIONS.map((option) => (
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
                    >
                      {REGISTER_EMPLOYMENT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Password"
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      fullWidth
                      size="small"
                      required
                      error={shouldShowError('password')}
                      helperText={shouldShowError('password') ? errors.password : undefined}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
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
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleLogout} color="inherit" disabled={isSubmitting}>
                  Logout
                </Button>
                <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                  Complete Registration
                </Button>
              </DialogActions>
            </>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default RegisterBootstrapModal;
