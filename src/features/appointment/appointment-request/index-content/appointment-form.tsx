import { FunctionComponent, JSX, useMemo, useState } from 'react';
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

import PatientList from '../../../PatientList';
import { PatientModel } from '../../../patient/api/types';
import { HandleCreateAppointment, HandleUpdateAppointment } from '../api/handlers';
import { appointmentValidationSchema } from '../api/validation';
import { AppointmentModel, AppointmentStateProps } from '../api/types';

const APPOINTMENT_STATUS_OPTIONS = ['Pending', 'Scheduled', 'Completed', 'Cancelled', 'NoShow'];

type AppointmentFormValues = {
  id: string;
  patientInfoId: string;
  patientName: string;
  appointmentDateFrom: string;
  appointmentDateTo: string;
  reasonForVisit: string;
  status: string;
  remarks: string;
};

const formatPatientName = (patient: PatientModel): string => {
  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (lastName && givenNames) {
    return `${lastName}, ${givenNames}`;
  }

  return lastName || givenNames || patient.patientNumber || '';
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

const createInitialValues = (selectedItem?: AppointmentModel): AppointmentFormValues => ({
  id: selectedItem?.id || '',
  patientInfoId: selectedItem?.patientInfoId || '',
  patientName: selectedItem?.patientName || '',
  appointmentDateFrom: toDatetimeLocalValue(selectedItem?.appointmentDateFrom),
  appointmentDateTo: selectedItem?.appointmentDateTo
    ? toDatetimeLocalValue(selectedItem?.appointmentDateTo).slice(11, 16)
    : '',
  reasonForVisit: selectedItem?.reasonForVisit || '',
  status: selectedItem?.status || 'Scheduled',
  remarks: selectedItem?.remarks || '',
});

const AppointmentForm: FunctionComponent<AppointmentStateProps> = (
  props: AppointmentStateProps
): JSX.Element => {
  const { state, setState, clinicId } = props;
  const [patientSelectionError, setPatientSelectionError] = useState<string>('');

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Appointment' : 'Add Appointment'),
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

  const handleSubmitForm = async (values: AppointmentFormValues): Promise<void> => {
    const appointmentDateFrom = values.appointmentDateFrom
      ? `${values.appointmentDateFrom}${values.appointmentDateFrom.length === 16 ? ':00' : ''}`
      : '';

    const appointmentDateTo =
      values.appointmentDateFrom && values.appointmentDateTo
        ? `${values.appointmentDateFrom.slice(0, 10)}T${values.appointmentDateTo}:00`
        : '';

    const payload: AppointmentModel = {
      id: values.id.trim() || undefined,
      patientInfoId: values.patientInfoId.trim(),
      appointmentDateFrom: appointmentDateFrom || undefined,
      appointmentDateTo: appointmentDateTo || undefined,
      reasonForVisit: values.reasonForVisit.trim(),
      status: values.status.trim(),
      remarks: values.remarks.trim(),
    };

    if (state.isUpdate) {
      await HandleUpdateAppointment(payload, state, setState);
      return;
    }

    await HandleCreateAppointment(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={appointmentValidationSchema}
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
          const shouldShowError = (fieldName: keyof AppointmentFormValues): boolean =>
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
                  {patientSelectionError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {patientSelectionError}
                    </Alert>
                  ) : null}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <PatientList
                        clinicId={clinicId}
                        selectedPatientId={values.patientInfoId}
                        selectedPatientName={values.patientName}
                        error={shouldShowError('patientInfoId')}
                        helperText={
                          shouldShowError('patientInfoId') ? errors.patientInfoId : undefined
                        }
                        onSelect={(patient: PatientModel) => {
                          setPatientSelectionError('');
                          setFieldValue('patientInfoId', String(patient.id ?? ''));
                          setFieldValue('patientName', formatPatientName(patient));
                        }}
                        onClearSelection={() => {
                          setPatientSelectionError('');
                          setFieldValue('patientInfoId', '');
                          setFieldValue('patientName', '');
                        }}
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
                        {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} />
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
                <Button
                  onClick={() => {
                    if (!values.patientInfoId.trim()) {
                      setPatientSelectionError('Please select a patient before saving.');
                    }

                    handleSubmit();
                  }}
                  variant="contained"
                  disabled={isSubmitting}
                >
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

export default AppointmentForm;
