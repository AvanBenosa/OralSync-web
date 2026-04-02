import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
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

import {
  HandleCreatePatientAppointmentRecordItem,
  HandleUpdatePatientAppointmentRecordItem,
} from '../api/handlers';
import {
  PATIENT_APPOINTMENT_STATUS_OPTIONS,
  PATIENT_APPOINTMENT_TYPE_OPTIONS,
  PatientAppointmentRecordModel,
  PatientAppointmentRecordStateProps,
} from '../api/types';
import { patientAppointmentRecordValidationSchema } from '../api/validation';
import { GetCurrentClinicProfile } from '../../../settings/clinic-profile/api/api';

const DEFAULT_CLINIC_OPENING_TIME = '09:00';
const DEFAULT_CLINIC_CLOSING_TIME = '18:00';
const HOUR_PICKER_COLUMNS = {
  xs: 'repeat(2, minmax(0, 1fr))',
  sm: 'repeat(4, minmax(0, 1fr))',
  md: 'repeat(5, minmax(0, 1fr))',
};

type PatientAppointmentRecordsFormProps = PatientAppointmentRecordStateProps & {
  patientLabel?: string;
};

type PatientAppointmentRecordFormValues = {
  id: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  reasonForVisit: string;
  status: string;
  appointmentType: string;
  remarks: string;
};

const toDatetimeLocalValue = (value?: string | Date): string => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const toDateInputValue = (value?: string | Date): string => {
  const dateValue = toDatetimeLocalValue(value);
  return dateValue ? dateValue.slice(0, 10) : '';
};

const toTimeInputValue = (value?: string | Date): string => {
  const dateValue = toDatetimeLocalValue(value);
  return dateValue ? dateValue.slice(11, 16) : '';
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

const toHourInputValue = (value?: string | Date): string => {
  const parsedTime = parseTimeValue(toTimeInputValue(value));
  return parsedTime ? formatHourValue(parsedTime.hours) : '';
};

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

const createInitialValues = (
  selectedItem?: PatientAppointmentRecordModel
): PatientAppointmentRecordFormValues => {
  const appointmentStartTime = toHourInputValue(selectedItem?.appointmentDateFrom);
  const rawAppointmentEndTime = toHourInputValue(selectedItem?.appointmentDateTo);
  const appointmentEndTime =
    appointmentStartTime && rawAppointmentEndTime <= appointmentStartTime
      ? formatHourValue(Math.min(toHourValue(appointmentStartTime, 9) + 1, 23))
      : rawAppointmentEndTime;

  return {
    id: selectedItem?.id || '',
    appointmentDate: toDateInputValue(selectedItem?.appointmentDateFrom),
    appointmentStartTime,
    appointmentEndTime,
    reasonForVisit: selectedItem?.reasonForVisit || '',
    status: selectedItem?.status || 'Scheduled',
    appointmentType: selectedItem?.appointmentType || 'WalkIn',
    remarks: selectedItem?.remarks || '',
  };
};

const PatientAppointmentRecordsForm: FunctionComponent<PatientAppointmentRecordsFormProps> = (
  props: PatientAppointmentRecordsFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;
  const [clinicOpeningTime, setClinicOpeningTime] = useState<string>(DEFAULT_CLINIC_OPENING_TIME);
  const [clinicClosingTime, setClinicClosingTime] = useState<string>(DEFAULT_CLINIC_CLOSING_TIME);
  const [hourRangeAnchor, setHourRangeAnchor] = useState<string | null>(null);

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Appointment Record' : 'Add Appointment Record'),
    [state.isUpdate]
  );

  useEffect(() => {
    void GetCurrentClinicProfile()
      .then((response) => {
        setClinicOpeningTime(response.openingTime || DEFAULT_CLINIC_OPENING_TIME);
        setClinicClosingTime(response.closingTime || DEFAULT_CLINIC_CLOSING_TIME);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setHourRangeAnchor(null);
  }, [
    state.openModal,
    state.selectedItem?.appointmentDateFrom,
    state.selectedItem?.appointmentDateTo,
  ]);

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmitForm = async (values: PatientAppointmentRecordFormValues): Promise<void> => {
    const appointmentDateFrom =
      values.appointmentDate && values.appointmentStartTime
        ? `${values.appointmentDate}T${values.appointmentStartTime}:00`
        : '';

    const appointmentDateTo =
      values.appointmentDate && values.appointmentEndTime
        ? `${values.appointmentDate}T${values.appointmentEndTime}:00`
        : '';

    const payload: PatientAppointmentRecordModel = {
      id: values.id.trim() || undefined,
      patientInfoId: state.patientId,
      appointmentDateFrom: appointmentDateFrom || undefined,
      appointmentDateTo: appointmentDateTo || undefined,
      reasonForVisit: values.reasonForVisit.trim(),
      status: values.status.trim(),
      appointmentType: values.appointmentType.trim(),
      remarks: values.remarks.trim(),
    };

    if (state.isUpdate) {
      await HandleUpdatePatientAppointmentRecordItem(payload, state, setState);
      return;
    }

    await HandleCreatePatientAppointmentRecordItem(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={patientAppointmentRecordValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmitForm(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save appointment record.');
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
          setFieldValue,
        }): JSX.Element => {
          const shouldShowError = (fieldName: keyof PatientAppointmentRecordFormValues): boolean =>
            Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

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
              : `Clinic hours: ${formatHourLabel(clinicOpeningTime)} - ${formatHourLabel(
                  clinicClosingTime
                )}`
            : 'Choose the appointment date first to enable the hour range picker.';
          const hourRangeError =
            (shouldShowError('appointmentStartTime') && errors.appointmentStartTime) ||
            (shouldShowError('appointmentEndTime') && errors.appointmentEndTime);

          const handleAppointmentDateChange = (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ): void => {
            const nextDate = event.target.value;

            setFieldValue('appointmentDate', nextDate);
            setHourRangeAnchor(null);

            if (!nextDate) {
              setFieldValue('appointmentStartTime', '');
              setFieldValue('appointmentEndTime', '');
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

              setFieldValue('appointmentStartTime', timeValue);
              setFieldValue('appointmentEndTime', hourOptions[selectedIndex + 1]);
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

              setFieldValue('appointmentStartTime', timeValue);
              setFieldValue('appointmentEndTime', hourOptions[selectedIndex + 1]);
              setHourRangeAnchor(timeValue);
              return;
            }

            setFieldValue('appointmentStartTime', hourOptions[anchorIndex]);
            setFieldValue('appointmentEndTime', timeValue);
            setHourRangeAnchor(null);
          };

          return (
            <>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
                  {status ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {status}
                    </Alert>
                  ) : null}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Patient"
                        name="patient"
                        value={patientLabel || 'Selected patient'}
                        fullWidth
                        size="small"
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                          shouldShowError('appointmentDate') ? errors.appointmentDate : undefined
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} />
                    <Grid size={{ xs: 12 }}>
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: hourRangeError ? 'error.main' : 'rgba(92, 108, 234, 0.18)',
                          borderRadius: 2.5,
                          p: { xs: 1.5, sm: 1.75 },
                          bgcolor: hourRangeError ? 'rgba(211, 47, 47, 0.04)' : '#fcfcff',
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
                              sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#1b3553' }}
                            >
                              Appointment Hours
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#6f7c8f', display: 'block', mt: 0.35 }}
                            >
                              Pick a start hour, then choose the end hour on the same day.
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
                                values.appointmentStartTime && values.appointmentEndTime
                                  ? 'rgba(92, 108, 234, 0.2)'
                                  : 'rgba(27, 53, 83, 0.08)',
                              bgcolor:
                                values.appointmentStartTime && values.appointmentEndTime
                                  ? 'rgba(92, 108, 234, 0.1)'
                                  : 'rgba(27, 53, 83, 0.04)',
                            }}
                          >
                            <AccessTimeRoundedIcon sx={{ fontSize: 15, color: '#4b5fd6' }} />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, color: '#1f3d63', lineHeight: 1 }}
                            >
                              {selectedRangeText}
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
                              !values.appointmentDate || (isLastBoundary && !isAnchor);

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
                                    isSelected || isAnchor ? '#8a83ff' : 'rgba(27, 53, 83, 0.12)',
                                  bgcolor: isSelected
                                    ? 'rgba(138, 131, 255, 0.16)'
                                    : 'rgba(255, 255, 255, 0.94)',
                                  color:
                                    values.appointmentStartTime === timeValue ||
                                    values.appointmentEndTime === timeValue
                                      ? '#1d4264'
                                      : '#647287',
                                  fontSize: '0.84rem',
                                  fontWeight:
                                    values.appointmentStartTime === timeValue ||
                                    values.appointmentEndTime === timeValue
                                      ? 700
                                      : 500,
                                  minHeight: 40,
                                  opacity: isDisabled ? 0.45 : 1,
                                  transition:
                                    'background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
                                  boxShadow:
                                    isSelected || isAnchor
                                      ? '0 8px 16px rgba(138, 131, 255, 0.14)'
                                      : 'none',
                                  '&:hover': {
                                    bgcolor: isSelected
                                      ? 'rgba(138, 131, 255, 0.2)'
                                      : 'rgba(246, 243, 255, 0.96)',
                                    transform: isDisabled ? 'none' : 'translateY(-1px)',
                                  },
                                }}
                              >
                                {formatHourLabel(timeValue)}
                              </ButtonBase>
                            );
                          })}
                        </Box>
                        <Typography
                          variant="caption"
                          color={hourRangeError ? 'error.main' : 'text.secondary'}
                          sx={{
                            display: 'block',
                            mt: 1,
                            px: 0.25,
                            color: hourRangeError ? undefined : '#6f7c8f',
                          }}
                        >
                          {hourRangeError || hourPickerHint}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="Status"
                        name="status"
                        value={values.status}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('status')}
                        helperText={shouldShowError('status') ? errors.status : undefined}
                      >
                        {PATIENT_APPOINTMENT_STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="Appointment Type"
                        name="appointmentType"
                        value={values.appointmentType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('appointmentType')}
                        helperText={
                          shouldShowError('appointmentType') ? errors.appointmentType : undefined
                        }
                      >
                        {PATIENT_APPOINTMENT_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option === 'WalkIn' ? 'Walk-In' : option}
                          </MenuItem>
                        ))}
                      </TextField>
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
                          shouldShowError('reasonForVisit') ? errors.reasonForVisit : undefined
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
                        minRows={3}
                        error={shouldShowError('remarks')}
                        helperText={shouldShowError('remarks') ? errors.remarks : undefined}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                  {state.isUpdate ? 'Update' : 'Save'}
                </Button>
              </DialogActions>
            </>
          );
        }}
      </Formik>
    </>
  );
};

export default PatientAppointmentRecordsForm;
