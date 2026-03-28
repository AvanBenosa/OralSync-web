import { FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
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

type PatientAppointmentRecordsFormProps = PatientAppointmentRecordStateProps & {
  patientLabel?: string;
};

type PatientAppointmentRecordFormValues = {
  id: string;
  appointmentDateFrom: string;
  appointmentDateTo: string;
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

const createInitialValues = (
  selectedItem?: PatientAppointmentRecordModel
): PatientAppointmentRecordFormValues => ({
  id: selectedItem?.id || '',
  appointmentDateFrom: toDatetimeLocalValue(selectedItem?.appointmentDateFrom),
  appointmentDateTo: selectedItem?.appointmentDateTo
    ? toDatetimeLocalValue(selectedItem?.appointmentDateTo).slice(11, 16)
    : '',
  reasonForVisit: selectedItem?.reasonForVisit || '',
  status: selectedItem?.status || 'Scheduled',
  appointmentType: selectedItem?.appointmentType || 'WalkIn',
  remarks: selectedItem?.remarks || '',
});

const PatientAppointmentRecordsForm: FunctionComponent<PatientAppointmentRecordsFormProps> = (
  props: PatientAppointmentRecordsFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Appointment Record' : 'Add Appointment Record'),
    [state.isUpdate]
  );

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
    const appointmentDateFrom = values.appointmentDateFrom
      ? `${values.appointmentDateFrom}${values.appointmentDateFrom.length === 16 ? ':00' : ''}`
      : '';

    const appointmentDateTo =
      values.appointmentDateFrom && values.appointmentDateTo
        ? `${values.appointmentDateFrom.slice(0, 10)}T${values.appointmentDateTo}:00`
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
        }): JSX.Element => {
          const shouldShowError = (fieldName: keyof PatientAppointmentRecordFormValues): boolean =>
            Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

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
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                        inputProps={{ step: 300 }}
                        error={shouldShowError('appointmentDateTo')}
                        helperText={
                          shouldShowError('appointmentDateTo')
                            ? errors.appointmentDateTo
                            : 'Uses the same date as Appointment Date From.'
                        }
                      />
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
