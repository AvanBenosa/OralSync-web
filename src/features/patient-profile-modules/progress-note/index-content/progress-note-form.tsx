import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import {
  PatientProgressNoteModel,
  PatientProgressNoteStateProps,
  PROGRESS_NOTE_ACCOUNT_OPTIONS,
  PROGRESS_NOTE_CATEGORY_OPTIONS,
  ProgressNoteAccount,
  ProgressNoteCategory,
} from '../api/types';
import {
  HandleCreatePatientProgressNoteItem,
  HandleUpdatePatientProgressNoteItem,
} from '../api/handlers';
import { progressNoteValidationSchema } from '../api/validation';
import { GetEmployees } from '../../../settings/employee/api/api';
import { EmployeeModel, EmployeeRole } from '../../../settings/employee/api/types';

type PatientProgressNoteFormProps = PatientProgressNoteStateProps & {
  patientLabel?: string;
};

type PatientProgressNoteFormValues = {
  id: string;
  assignedDoctor: string;
  date: string;
  nextVisit: string;
  procedure: string;
  category: ProgressNoteCategory | '';
  clinicalFinding: string;
  assessment: string;
  toothNumber: number | '';
  remarks: string;
  account: ProgressNoteAccount | '';
  amount: number | '';
  discount: number | '';
  totalAmountDue: number | '';
  amountPaid: number | '';
  balance: number | '';
};

type DoctorOption = {
  label: string;
  value: string;
};

const toDateInputValue = (value?: string | Date): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const dateOnlyValue = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (dateOnlyValue) {
      return dateOnlyValue;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDatePayloadValue = (value?: string): string | undefined => {
  if (!value?.trim()) {
    return undefined;
  }

  return `${value}T00:00:00`;
};

const getTodayDateInputValue = (): string => toDateInputValue(new Date());

const createInitialValues = (
  selectedItem?: PatientProgressNoteModel
): PatientProgressNoteFormValues => ({
  id: selectedItem?.id || '',
  assignedDoctor: selectedItem?.assignedDoctor || '',
  date: toDateInputValue(selectedItem?.date) || getTodayDateInputValue(),
  nextVisit: toDateInputValue(selectedItem?.nextVisit),
  procedure: selectedItem?.procedure || '',
  category: selectedItem?.category || '',
  clinicalFinding: selectedItem?.clinicalFinding || '',
  assessment: selectedItem?.assessment || '',
  toothNumber: selectedItem?.toothNumber ?? '',
  remarks: selectedItem?.remarks || '',
  account: selectedItem?.account || '',
  amount: selectedItem?.amount ?? '',
  discount: selectedItem?.discount ?? '',
  totalAmountDue: selectedItem?.totalAmountDue ?? '',
  amountPaid: selectedItem?.amountPaid ?? '',
  balance: selectedItem?.balance ?? '',
});

const parseNumberInput = (value: string): number | '' => {
  if (value.trim() === '') {
    return '';
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

const getNumericValue = (value: number | ''): number | undefined =>
  value === '' ? undefined : value;

const getComputedTotalAmountDue = (amount: number | '', discount: number | ''): number | '' => {
  if (amount === '' && discount === '') {
    return '';
  }

  return (amount === '' ? 0 : amount) - (discount === '' ? 0 : discount);
};

const getComputedBalance = (
  amount: number | '',
  discount: number | '',
  amountPaid: number | ''
): number | '' => {
  const totalAmountDue = getComputedTotalAmountDue(amount, discount);

  if (totalAmountDue === '' && amountPaid === '') {
    return '';
  }

  return (totalAmountDue === '' ? 0 : totalAmountDue) - (amountPaid === '' ? 0 : amountPaid);
};

const buildDoctorName = (employee?: EmployeeModel | null): string =>
  [employee?.firstName, employee?.middleName, employee?.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

const buildDoctorOption = (employee?: EmployeeModel | null): DoctorOption | null => {
  if (!employee) {
    return null;
  }

  const doctorName = buildDoctorName(employee);
  const doctorValue = doctorName || employee.emailAddress?.trim() || '';

  if (!doctorValue) {
    return null;
  }

  return {
    value: doctorValue,
    label: doctorName ? `Dr. ${doctorName}` : employee.emailAddress?.trim() || 'Unnamed doctor',
  };
};

const PatientProgressNoteForm: FunctionComponent<PatientProgressNoteFormProps> = (
  props: PatientProgressNoteFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Progress Note' : 'Add Progress Note'),
    [state.isUpdate]
  );

  const mergedDoctorOptions = useMemo(() => {
    const selectedDoctor = state.selectedItem?.assignedDoctor?.trim();
    if (!selectedDoctor) {
      return doctorOptions;
    }

    if (doctorOptions.some((option) => option.value === selectedDoctor)) {
      return doctorOptions;
    }

    return [
      {
        value: selectedDoctor,
        label: selectedDoctor.startsWith('Dr.') ? selectedDoctor : `Dr. ${selectedDoctor}`,
      },
      ...doctorOptions,
    ];
  }, [doctorOptions, state.selectedItem?.assignedDoctor]);

  useEffect(() => {
    let isMounted = true;

    void GetEmployees()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const filteredDoctors = (response.items || [])
          .filter((item) => item.role === EmployeeRole.Doctor)
          .map((item) => buildDoctorOption(item))
          .filter((item): item is DoctorOption => Boolean(item));

        setDoctorOptions(filteredDoctors);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setDoctorOptions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmit = async (values: PatientProgressNoteFormValues): Promise<void> => {
    const computedTotalAmountDue = getComputedTotalAmountDue(values.amount, values.discount);
    const computedBalance = getComputedBalance(values.amount, values.discount, values.amountPaid);

    const payload: PatientProgressNoteModel = {
      id: values.id.trim() || undefined,
      patientInfoId: state.patientId,
      assignedDoctor: values.assignedDoctor || undefined,
      date: toDatePayloadValue(values.date),
      nextVisit: toDatePayloadValue(values.nextVisit),
      procedure: values.procedure.trim(),
      category: values.category || undefined,
      clinicalFinding: values.clinicalFinding.trim(),
      assessment: values.assessment.trim(),
      toothNumber: getNumericValue(values.toothNumber),
      remarks: values.remarks.trim(),
      account: values.account || undefined,
      amount: getNumericValue(values.amount),
      discount: getNumericValue(values.discount),
      totalAmountDue: getNumericValue(computedTotalAmountDue),
      amountPaid: getNumericValue(values.amountPaid),
      balance: getNumericValue(computedBalance),
    };

    if (state.isUpdate) {
      await HandleUpdatePatientProgressNoteItem(payload, state, setState);
      return;
    }

    await HandleCreatePatientProgressNoteItem(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={progressNoteValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmit(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save progress note.');
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
          setFieldValue,
        }): JSX.Element => {
          const resolvedPatientLabel = patientLabel || 'Selected patient';
          const computedTotalAmountDue = getComputedTotalAmountDue(values.amount, values.discount);
          const computedBalance = getComputedBalance(
            values.amount,
            values.discount,
            values.amountPaid
          );
          const shouldShowError = (fieldName: keyof PatientProgressNoteFormValues): boolean =>
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
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Patient"
                        name="patient"
                        value={resolvedPatientLabel}
                        fullWidth
                        size="small"
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Date"
                        name="date"
                        type="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
                        error={shouldShowError('date')}
                        helperText={shouldShowError('date') ? errors.date : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Procedure"
                        name="procedure"
                        value={values.procedure}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('procedure')}
                        helperText={shouldShowError('procedure') ? errors.procedure : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Tooth Number"
                        name="toothNumber"
                        type="number"
                        value={values.toothNumber}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('toothNumber', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        inputProps={{ min: 1, max: 32, step: 1 }}
                        error={shouldShowError('toothNumber')}
                        helperText={shouldShowError('toothNumber') ? errors.toothNumber : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Attending Dentist"
                        name="assignedDoctor"
                        value={values.assignedDoctor}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="">Select attending Doctor</MenuItem>
                        {mergedDoctorOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Category"
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                        error={shouldShowError('category')}
                        helperText={shouldShowError('category') ? errors.category : undefined}
                      >
                        <MenuItem value="">Select category</MenuItem>
                        {PROGRESS_NOTE_CATEGORY_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Next Visit"
                        name="nextVisit"
                        type="date"
                        value={values.nextVisit}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
                        error={shouldShowError('nextVisit')}
                        helperText={shouldShowError('nextVisit') ? errors.nextVisit : undefined}
                      />
                    </Grid>
                    {/* <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Clinical Finding"
                        name="clinicalFinding"
                        value={values.clinicalFinding}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        multiline
                        minRows={3}
                        placeholder="Document the tooth condition, symptoms, and relevant clinical observations."
                        error={shouldShowError('clinicalFinding')}
                        helperText={
                          shouldShowError('clinicalFinding') ? errors.clinicalFinding : undefined
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Assessment"
                        name="assessment"
                        value={values.assessment}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        multiline
                        minRows={3}
                        placeholder="Summarize the diagnosis, impression, or working assessment."
                        error={shouldShowError('assessment')}
                        helperText={shouldShowError('assessment') ? errors.assessment : undefined}
                      />
                    </Grid> */}
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
                        placeholder="Example: Tooth number, severity, medication, material used, next visit procedure or schedule."
                        error={shouldShowError('remarks')}
                        helperText={shouldShowError('remarks') ? errors.remarks : undefined}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: '#425e79', mb: 1.25 }}
                    >
                      Payment Details
                    </Typography>
                    <Divider />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Account"
                        name="account"
                        value={values.account}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                        error={shouldShowError('account')}
                        helperText={shouldShowError('account') ? errors.account : undefined}
                      >
                        <MenuItem value="">Select account</MenuItem>
                        {PROGRESS_NOTE_ACCOUNT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Cost"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amount', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('amount')}
                        helperText={shouldShowError('amount') ? errors.amount : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Discount"
                        name="discount"
                        type="number"
                        value={values.discount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('discount', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('discount')}
                        helperText={shouldShowError('discount') ? errors.discount : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Total Amount Due"
                        name="totalAmountDue"
                        type="number"
                        value={computedTotalAmountDue}
                        fullWidth
                        size="small"
                        disabled
                        helperText="Auto-calculated from Cost - Discount"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Amount Paid"
                        name="amountPaid"
                        type="number"
                        value={values.amountPaid}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amountPaid', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('amountPaid')}
                        helperText={shouldShowError('amountPaid') ? errors.amountPaid : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Balance"
                        name="balance"
                        type="number"
                        value={computedBalance}
                        fullWidth
                        size="small"
                        disabled
                        helperText="Auto-calculated from Total Amount Due - Amount Paid"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button onClick={() => handleSubmit()} variant="contained">
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

export default PatientProgressNoteForm;
