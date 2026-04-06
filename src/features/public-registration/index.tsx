import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
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
  noEmailAddress: boolean;
  birthDate: string;
  contactNumber: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  reasonForVisit: string;
  remarks: string;
  emailVerificationCode: string;
};

const initialValues: PublicRegistrationFormValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  emailAddress: '',
  noEmailAddress: false,
  birthDate: '',
  contactNumber: '',
  appointmentDate: '',
  appointmentStartTime: '',
  appointmentEndTime: '',
  reasonForVisit: '',
  remarks: '',
  emailVerificationCode: '',
};

const DEFAULT_CLINIC_OPENING_TIME = '09:00';
const DEFAULT_CLINIC_CLOSING_TIME = '18:00';
const HOUR_PICKER_COLUMNS = {
  xs: 'repeat(2, minmax(0, 1fr))',
  sm: 'repeat(3, minmax(0, 1fr))',
  md: 'repeat(5, minmax(0, 1fr))',
};

type ClinicOpenDayKey =
  | 'isMondayOpen'
  | 'isTuesdayOpen'
  | 'isWednesdayOpen'
  | 'isThursdayOpen'
  | 'isFridayOpen'
  | 'isSaturdayOpen'
  | 'isSundayOpen';

const clinicDayDefinitions: Array<{ key: ClinicOpenDayKey; label: string }> = [
  { key: 'isMondayOpen', label: 'Monday' },
  { key: 'isTuesdayOpen', label: 'Tuesday' },
  { key: 'isWednesdayOpen', label: 'Wednesday' },
  { key: 'isThursdayOpen', label: 'Thursday' },
  { key: 'isFridayOpen', label: 'Friday' },
  { key: 'isSaturdayOpen', label: 'Saturday' },
  { key: 'isSundayOpen', label: 'Sunday' },
];

const formatTimeLabel = (value?: string): string => {
  if (!value) {
    return '--';
  }

  const [hoursText = '0', minutesText = '0'] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const parseTimeValue = (timeValue?: string): { hours: number; minutes: number } | null => {
  if (!timeValue) {
    return null;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return { hours, minutes };
};

const toHourValue = (timeValue?: string, fallbackHour: number = 9): number => {
  const parsedTime = parseTimeValue(timeValue);
  return parsedTime ? parsedTime.hours : fallbackHour;
};

const formatHourValue = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

const formatHourLabel = (timeValue?: string): string => {
  const parsedTime = parseTimeValue(timeValue);

  if (!parsedTime) {
    return '--';
  }

  const normalizedHours = parsedTime.hours % 12 || 12;
  const suffix = parsedTime.hours >= 12 ? 'PM' : 'AM';
  return `${String(normalizedHours).padStart(2, '0')}:${String(parsedTime.minutes).padStart(
    2,
    '0'
  )} ${suffix}`;
};

const buildHourOptions = (
  openingTime: string,
  closingTime: string,
  selectedStartTime?: string,
  selectedEndTime?: string
): string[] => {
  const openingHour = toHourValue(openingTime, 9);
  const closingHour = toHourValue(closingTime, Math.max(openingHour + 1, 18));
  const selectedStartHour = parseTimeValue(selectedStartTime)?.hours ?? openingHour;
  const selectedEndHour = parseTimeValue(selectedEndTime)?.hours ?? closingHour;

  const firstHour = Math.max(0, Math.min(openingHour, selectedStartHour, selectedEndHour));
  const lastHour = Math.min(23, Math.max(closingHour, selectedStartHour + 1, selectedEndHour));

  return Array.from({ length: lastHour - firstHour + 1 }, (_, index) =>
    formatHourValue(firstHour + index)
  );
};

const isTimeWithinSelectedRange = (
  timeValue: string,
  selectedStartTime?: string,
  selectedEndTime?: string
): boolean => {
  const currentHour = parseTimeValue(timeValue)?.hours;
  const startHour = parseTimeValue(selectedStartTime)?.hours;
  const endHour = parseTimeValue(selectedEndTime)?.hours;

  if (
    !Number.isFinite(currentHour) ||
    !Number.isFinite(startHour) ||
    !Number.isFinite(endHour) ||
    currentHour === undefined ||
    startHour === undefined ||
    endHour === undefined
  ) {
    return false;
  }

  return currentHour >= startHour && currentHour <= endHour;
};

const buildClinicHoursLabel = (clinic: PublicClinicRegistrationContextModel | null): string => {
  if (!clinic?.openingTime || !clinic?.closingTime) {
    return 'Hours available upon contact';
  }

  return `${formatTimeLabel(clinic.openingTime)} - ${formatTimeLabel(clinic.closingTime)}`;
};

const buildLunchBreakLabel = (clinic: PublicClinicRegistrationContextModel | null): string => {
  if (!clinic?.lunchStartTime || !clinic?.lunchEndTime) {
    return 'No lunch break listed';
  }

  return `${formatTimeLabel(clinic.lunchStartTime)} - ${formatTimeLabel(clinic.lunchEndTime)}`;
};

const buildOpenDaysLabel = (clinic: PublicClinicRegistrationContextModel | null): string => {
  const openDays = clinicDayDefinitions
    .filter(({ key }) => Boolean(clinic?.[key]))
    .map(({ label }) => label);

  if (openDays.length === 0) {
    return 'Schedule available upon contact';
  }

  return openDays.join(', ');
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
  const [hourRangeAnchor, setHourRangeAnchor] = useState<string | null>(null);

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
        noEmailAddress: yup.boolean().default(false),
        emailAddress:
          registrationMode === 'existing'
            ? yup
                .string()
                .trim()
                .email('Enter a valid email address.')
                .required('Email address is required.')
            : yup
                .string()
                .trim()
                .email('Enter a valid email address.')
                .when('noEmailAddress', {
                  is: true,
                  then: (schema) => schema.optional(),
                  otherwise: (schema) => schema.required('Email address is required.'),
                }),
        birthDate: yup.string().optional(),
        appointmentDate: yup.string().required('Appointment date is required.'),
        appointmentStartTime: yup.string().required('Choose an appointment start hour.'),
        appointmentEndTime: yup
          .string()
          .required('Choose an appointment end hour.')
          .test('after-start', 'Choose a later end hour.', function validateEndTime(value) {
            const { appointmentStartTime } = this.parent as PublicRegistrationFormValues;
            const startTime = parseTimeValue(appointmentStartTime);
            const endTime = parseTimeValue(value);

            if (!startTime || !endTime) {
              return true;
            }

            return endTime.hours > startTime.hours;
          }),
        reasonForVisit: yup.string().trim().required('Reason for visit is required.'),
      }),
    [registrationMode]
  );

  const clinicHoursLabel = useMemo(() => buildClinicHoursLabel(clinic), [clinic]);
  const lunchBreakLabel = useMemo(() => buildLunchBreakLabel(clinic), [clinic]);
  const clinicDaysLabel = useMemo(() => buildOpenDaysLabel(clinic), [clinic]);
  const clinicAddress = clinic?.address?.trim() || 'Address available upon request';
  const clinicEmail = clinic?.emailAddress?.trim() || 'Email address not listed';
  const clinicContactNumber = clinic?.contactNumber?.trim() || 'Contact number not listed';
  const clinicDetailItems = [
    {
      icon: <PlaceRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Clinic Address',
      value: clinicAddress,
    },
    {
      icon: <CallRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Contact Number',
      value: clinicContactNumber,
    },
    {
      icon: <MailOutlineRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Clinic Email',
      value: clinicEmail,
    },
    {
      icon: <AccessTimeRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Clinic Hours',
      value: clinicHoursLabel,
    },
    {
      icon: <CalendarMonthRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Open Days',
      value: clinicDaysLabel,
    },
    {
      icon: <AccessTimeRoundedIcon sx={{ color: '#2f6db3', fontSize: 20 }} />,
      label: 'Lunch Break',
      value: lunchBreakLabel,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at top left, rgba(79, 130, 176, 0.16), transparent 32%), linear-gradient(180deg, #f7fafc 0%, #ebf2f7 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 2.5, lg: 3.5 }} alignItems="flex-start">
          <Grid size={{ xs: 12, lg: 3 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.75,
                  borderRadius: 4,
                  border: '1px solid rgba(194, 208, 220, 0.92)',
                  background:
                    'linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(243, 248, 252, 0.99))',
                  boxShadow: '0 18px 44px rgba(28, 56, 86, 0.08)',
                }}
              >
                <Typography sx={{ color: '#143a63', fontWeight: 900, fontSize: 28 }}>
                  Clinic Details
                </Typography>
                <Typography sx={{ color: '#5e7891', fontSize: 14, mt: 1.25, lineHeight: 1.7 }}>
                  Review the clinic contact details and schedule before submitting your
                  registration.
                </Typography>

                {isLoading ? (
                  <Box
                    sx={{
                      minHeight: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : loadError ? (
                  <Alert severity="error" sx={{ mt: 2.5 }}>
                    {loadError}
                  </Alert>
                ) : (
                  <Box sx={{ mt: 2.5, display: 'grid', gap: 1.35 }}>
                    {clinicDetailItems.map((detail) => (
                      <Box
                        key={detail.label}
                        sx={{
                          p: 1.65,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.25,
                          borderRadius: 3,
                          border: '1px solid rgba(220, 230, 238, 0.95)',
                          background:
                            'linear-gradient(180deg, rgba(248, 251, 253, 0.98), rgba(239, 245, 250, 0.98))',
                        }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            flexShrink: 0,
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(180deg, #f1f7fc 0%, #dbe9f5 100%)',
                            border: '1px solid rgba(174, 198, 218, 0.9)',
                          }}
                        >
                          {detail.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                            {detail.label}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.35,
                              color: '#214868',
                              fontWeight: 700,
                              lineHeight: 1.55,
                            }}
                          >
                            {detail.value}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  mt: 2.5,
                  p: 2.5,
                  borderRadius: 4,
                  border: '1px solid rgba(194, 208, 220, 0.92)',
                  background:
                    'linear-gradient(180deg, rgba(247, 251, 253, 0.98), rgba(237, 244, 249, 0.98))',
                  boxShadow: '0 14px 34px rgba(28, 56, 86, 0.06)',
                }}
              >
                <Typography sx={{ color: '#143a63', fontWeight: 800 }}>
                  Before You Submit
                </Typography>
                <Typography sx={{ color: '#5e7891', fontSize: 13, mt: 1, lineHeight: 1.8 }}>
                  Double-check the appointment date, reason for visit, and contact details so the
                  clinic can reach you quickly.
                </Typography>
                <Typography sx={{ color: '#5e7891', fontSize: 13, mt: 1, lineHeight: 1.8 }}>
                  If the patient does not have an email address, enable the checkbox in Patient
                  Information and provide a working contact number instead.
                </Typography>
                {clinic?.isLocked ? (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    This clinic is not accepting appointment registrations right now.
                  </Alert>
                ) : null}
              </Paper>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 9 }}>
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
                  Appointment Registration
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

                        if (
                          registrationMode === 'new' &&
                          !values.noEmailAddress &&
                          !emailVerified
                        ) {
                          setStatus('Verify the email address before submitting the registration.');
                          return;
                        }

                        const appointmentDateFrom = values.appointmentDate
                          ? `${values.appointmentDate}T${values.appointmentStartTime}:00`
                          : '';
                        const appointmentDateTo = values.appointmentDate
                          ? `${values.appointmentDate}T${values.appointmentEndTime}:00`
                          : '';

                        const response = await createPublicPatientAppointment({
                          clinicId,
                          existingPatientId:
                            registrationMode === 'existing'
                              ? existingPatient?.patientId
                              : undefined,
                          firstName: values.firstName.trim(),
                          lastName: values.lastName.trim(),
                          middleName: values.middleName.trim(),
                          emailAddress: values.noEmailAddress ? '' : values.emailAddress.trim(),
                          emailVerificationCode:
                            registrationMode === 'new' && !values.noEmailAddress
                              ? values.emailVerificationCode.trim()
                              : undefined,
                          birthDate: values.birthDate || undefined,
                          contactNumber: values.contactNumber.trim(),
                          appointmentDateFrom,
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
                        setHourRangeAnchor(null);
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
                      setFieldError,
                      setFieldValue,
                      touched,
                      submitCount,
                    }): JSX.Element => {
                      const shouldShowError = (
                        fieldName: keyof PublicRegistrationFormValues
                      ): boolean =>
                        Boolean(touched[fieldName] || submitCount > 0) &&
                        Boolean(errors[fieldName]);
                      const clinicOpeningTime = clinic?.openingTime || DEFAULT_CLINIC_OPENING_TIME;
                      const clinicClosingTime = clinic?.closingTime || DEFAULT_CLINIC_CLOSING_TIME;
                      const hourOptions = buildHourOptions(
                        clinicOpeningTime,
                        clinicClosingTime,
                        values.appointmentStartTime,
                        values.appointmentEndTime
                      );
                      const selectedRangeText =
                        values.appointmentStartTime && values.appointmentEndTime
                          ? `${formatHourLabel(values.appointmentStartTime)} - ${formatHourLabel(
                              values.appointmentEndTime
                            )}`
                          : 'Choose a start hour, then click a later hour to complete the range.';
                      const hourPickerHint = values.appointmentDate
                        ? hourRangeAnchor
                          ? 'Choose a later hour to finish the range.'
                          : `Clinic hours: ${formatHourLabel(
                              clinicOpeningTime
                            )} - ${formatHourLabel(clinicClosingTime)}`
                        : 'Pick the appointment date first to enable the hour picker.';
                      const hourPickerBadgeText = hourRangeAnchor
                        ? 'Choose a later hour to complete the range.'
                        : selectedRangeText;
                      const hourRangeError =
                        (shouldShowError('appointmentStartTime') && errors.appointmentStartTime) ||
                        (shouldShowError('appointmentEndTime') && errors.appointmentEndTime);

                      const handleAppointmentDateChange = (
                        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                      ): void => {
                        const nextDate = event.target.value;

                        void setFieldValue('appointmentDate', nextDate);
                        setHourRangeAnchor(null);

                        if (!nextDate) {
                          void setFieldValue('appointmentStartTime', '', false);
                          void setFieldValue('appointmentEndTime', '', false);
                        }
                      };

                      const handleHourRangeSelection = (timeValue: string): void => {
                        if (!values.appointmentDate) {
                          return;
                        }

                        const selectedIndex = hourOptions.indexOf(timeValue);

                        if (selectedIndex < 0) {
                          return;
                        }

                        if (!hourRangeAnchor) {
                          if (selectedIndex === hourOptions.length - 1) {
                            return;
                          }

                          void setFieldValue('appointmentStartTime', timeValue, false);
                          void setFieldValue(
                            'appointmentEndTime',
                            hourOptions[selectedIndex + 1],
                            false
                          );
                          setHourRangeAnchor(timeValue);
                          return;
                        }

                        const anchorIndex = hourOptions.indexOf(hourRangeAnchor);

                        if (anchorIndex < 0) {
                          setHourRangeAnchor(null);
                          return;
                        }

                        if (selectedIndex <= anchorIndex) {
                          if (selectedIndex === hourOptions.length - 1) {
                            return;
                          }

                          void setFieldValue('appointmentStartTime', timeValue, false);
                          void setFieldValue(
                            'appointmentEndTime',
                            hourOptions[selectedIndex + 1],
                            false
                          );
                          setHourRangeAnchor(timeValue);
                          return;
                        }

                        void setFieldValue('appointmentStartTime', hourOptions[anchorIndex], false);
                        void setFieldValue('appointmentEndTime', timeValue, false);
                        setHourRangeAnchor(null);
                      };

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
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}
                                >
                                  <Box
                                    sx={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: '14px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background:
                                        'linear-gradient(180deg, #f1f7fc 0%, #dbe9f5 100%)',
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
                                    setFieldError('emailAddress', undefined);
                                    void setFieldValue('noEmailAddress', false, false);
                                    void setFieldValue('emailVerificationCode', '', false);
                                    setHourRangeAnchor(null);
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
                                  <Grid size={{ xs: 12, md: registrationMode === 'new' ? 7 : 6 }}>
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
                                      required={
                                        registrationMode === 'existing' || !values.noEmailAddress
                                      }
                                      disabled={registrationMode === 'new' && values.noEmailAddress}
                                      placeholder={
                                        registrationMode === 'new' && values.noEmailAddress
                                          ? 'Email not provided'
                                          : undefined
                                      }
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
                                      <Grid
                                        size={{ xs: 12, md: 5 }}
                                        sx={{ display: 'flex', alignItems: 'center' }}
                                      >
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={values.noEmailAddress}
                                              onChange={(_, checked) => {
                                                setFieldError('emailAddress', undefined);
                                                void setFieldValue(
                                                  'noEmailAddress',
                                                  checked,
                                                  false
                                                );
                                                resetNewPatientEmailVerification();

                                                if (checked) {
                                                  void setFieldValue('emailAddress', '', false);
                                                  void setFieldValue(
                                                    'emailVerificationCode',
                                                    '',
                                                    false
                                                  );
                                                }
                                              }}
                                              sx={{
                                                color: '#2f6db3',
                                                '&.Mui-checked': {
                                                  color: '#2f6db3',
                                                },
                                              }}
                                            />
                                          }
                                          label="No Email Address"
                                          sx={{
                                            ml: 0,
                                            mr: 0,
                                            '& .MuiFormControlLabel-label': {
                                              color: '#214868',
                                              fontWeight: 700,
                                            },
                                          }}
                                        />
                                      </Grid>
                                      {!values.noEmailAddress ? (
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
                                                <Typography
                                                  sx={{ color: '#214868', fontWeight: 800 }}
                                                >
                                                  Email Verification
                                                </Typography>
                                                <Typography
                                                  sx={{ color: '#6b8196', fontSize: 13, mt: 0.5 }}
                                                >
                                                  Send a code to the patient email and verify it
                                                  before submitting the appointment request.
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
                                                  disabled={
                                                    isVerifyingCode || !emailVerificationSent
                                                  }
                                                >
                                                  {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
                                                </Button>
                                              </Grid>
                                            </Grid>

                                            {emailVerificationSent ? (
                                              <Alert
                                                severity={emailVerified ? 'success' : 'info'}
                                                sx={{ mt: 1.5 }}
                                              >
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
                                      ) : (
                                        <Grid size={{ xs: 12 }}>
                                          <Alert severity="info" sx={{ borderRadius: 3 }}>
                                            Email verification is skipped when the patient has no
                                            email address.
                                          </Alert>
                                        </Grid>
                                      )}
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
                                            shouldShowError('birthDate')
                                              ? errors.birthDate
                                              : undefined
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
                                                <Typography
                                                  sx={{ color: '#214868', fontWeight: 700 }}
                                                >
                                                  {existingPatient.lastName || '--'}
                                                </Typography>
                                              </Grid>
                                              <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                                                  First Name
                                                </Typography>
                                                <Typography
                                                  sx={{ color: '#214868', fontWeight: 700 }}
                                                >
                                                  {existingPatient.firstName || '--'}
                                                </Typography>
                                              </Grid>
                                              <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={{ color: '#5f7890', fontSize: 12 }}>
                                                  Email Address
                                                </Typography>
                                                <Typography
                                                  sx={{ color: '#214868', fontWeight: 700 }}
                                                >
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
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}
                                >
                                  <Box
                                    sx={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: '14px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background:
                                        'linear-gradient(180deg, #f1f7fc 0%, #dbe9f5 100%)',
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
                                      This will be saved to `AppointmentRequests` with appointment
                                      type `Online` and status `Pending`.
                                    </Typography>
                                  </Box>
                                </Box>

                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 12 }}>
                                    <TextField
                                      label="Appointment Date"
                                      name="appointmentDate"
                                      type="date"
                                      value={values.appointmentDate}
                                      onChange={handleAppointmentDateChange}
                                      onBlur={handleBlur}
                                      fullWidth
                                      size="small"
                                      required
                                      InputLabelProps={{ shrink: true }}
                                      error={shouldShowError('appointmentDate')}
                                      helperText={
                                        shouldShowError('appointmentDate')
                                          ? errors.appointmentDate
                                          : undefined
                                      }
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12 }}>
                                    <Box
                                      sx={{
                                        border: '1px solid',
                                        borderColor: hourRangeError
                                          ? 'error.main'
                                          : 'rgba(92, 108, 234, 0.18)',
                                        borderRadius: 2.5,
                                        p: { xs: 1.5, sm: 1.75 },
                                        bgcolor: hourRangeError
                                          ? 'rgba(211, 47, 47, 0.04)'
                                          : '#fcfcff',
                                        boxShadow: hourRangeError
                                          ? 'none'
                                          : '0 10px 24px rgba(93, 108, 234, 0.08)',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: { xs: 'flex-start', sm: 'center' },
                                          justifyContent: 'space-between',
                                          gap: 1,
                                          flexDirection: { xs: 'column', sm: 'row' },
                                          mb: 1.25,
                                        }}
                                      >
                                        <Box>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{
                                              fontWeight: 700,
                                              fontSize: '0.92rem',
                                              color: '#1b3553',
                                            }}
                                          >
                                            Appointment Hours
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{ color: '#6f7c8f', display: 'block', mt: 0.35 }}
                                          >
                                            Pick a start hour, then choose the end hour on the same
                                            day.
                                          </Typography>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            px: 1.1,
                                            py: 0.7,
                                            borderRadius: 999,
                                            border: '1px solid',
                                            borderColor:
                                              values.appointmentStartTime &&
                                              values.appointmentEndTime
                                                ? 'rgba(92, 108, 234, 0.2)'
                                                : 'rgba(27, 53, 83, 0.08)',
                                            bgcolor:
                                              values.appointmentStartTime &&
                                              values.appointmentEndTime
                                                ? 'rgba(92, 108, 234, 0.1)'
                                                : 'rgba(27, 53, 83, 0.04)',
                                          }}
                                        >
                                          <AccessTimeRoundedIcon
                                            sx={{ fontSize: 15, color: '#4b5fd6' }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 700,
                                              color: '#1f3d63',
                                              lineHeight: 1,
                                            }}
                                          >
                                            {hourPickerBadgeText}
                                          </Typography>
                                        </Box>
                                      </Box>

                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: HOUR_PICKER_COLUMNS,
                                          gap: 0.75,
                                        }}
                                      >
                                        {hourOptions.map((timeValue, index) => {
                                          const isSelected = isTimeWithinSelectedRange(
                                            timeValue,
                                            values.appointmentStartTime,
                                            values.appointmentEndTime
                                          );
                                          const isAnchor = timeValue === hourRangeAnchor;
                                          const isLastBoundary = index === hourOptions.length - 1;
                                          const isDisabled =
                                            !values.appointmentDate ||
                                            (isLastBoundary && !isAnchor);

                                          return (
                                            <ButtonBase
                                              key={timeValue}
                                              onClick={() => handleHourRangeSelection(timeValue)}
                                              disabled={isDisabled}
                                              sx={{
                                                justifyContent: 'center',
                                                borderRadius: 999,
                                                px: 1.1,
                                                py: 0.8,
                                                border: '1px solid',
                                                borderColor:
                                                  isSelected || isAnchor
                                                    ? '#8a83ff'
                                                    : 'rgba(27, 53, 83, 0.12)',
                                                bgcolor: isSelected
                                                  ? 'rgba(138, 131, 255, 0.16)'
                                                  : 'rgba(255, 255, 255, 0.94)',
                                                color:
                                                  values.appointmentStartTime === timeValue ||
                                                  values.appointmentEndTime === timeValue
                                                    ? '#1d4264'
                                                    : '#66768a',
                                                fontWeight:
                                                  values.appointmentStartTime === timeValue ||
                                                  values.appointmentEndTime === timeValue
                                                    ? 700
                                                    : 500,
                                                minHeight: 40,
                                                transition:
                                                  'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                                                boxShadow: isSelected
                                                  ? '0 8px 18px rgba(92, 108, 234, 0.15)'
                                                  : 'none',
                                                '&:hover': isDisabled
                                                  ? undefined
                                                  : {
                                                      transform: 'translateY(-1px)',
                                                      borderColor: '#8a83ff',
                                                      boxShadow:
                                                        '0 8px 18px rgba(92, 108, 234, 0.12)',
                                                    },
                                                '&.Mui-disabled': {
                                                  color: 'rgba(102, 118, 138, 0.45)',
                                                  borderColor: 'rgba(27, 53, 83, 0.08)',
                                                  bgcolor: 'rgba(245, 247, 251, 0.7)',
                                                },
                                              }}
                                            >
                                              {formatHourLabel(timeValue)}
                                            </ButtonBase>
                                          );
                                        })}
                                      </Box>

                                      <Typography
                                        sx={{
                                          mt: 1.25,
                                          color: hourRangeError ? 'error.main' : '#6f7c8f',
                                          fontSize: 12,
                                        }}
                                      >
                                        {hourRangeError || hourPickerHint}
                                      </Typography>
                                    </Box>
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PublicRegistrationPage;
