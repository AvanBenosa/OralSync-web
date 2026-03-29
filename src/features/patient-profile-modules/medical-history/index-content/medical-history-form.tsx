import { FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import {
  normalizeMedicalHistoryConditions,
  MedicalHistoryCondition,
  MEDICAL_HISTORY_CONDITION_OPTIONS,
  PatientMedicalHistoryModel,
  PatientMedicalHistoryStateProps,
} from '../api/types';
import {
  HandleCreatePatientMedicalHistoryItem,
  HandleUpdatePatientMedicalHistoryItem,
} from '../api/handlers';
import { medicalHistoryValidationSchema } from '../api/validation';

type PatientMedicalHistoryFormProps = PatientMedicalHistoryStateProps & {
  patientLabel?: string;
};

type YesNoValue = 'yes' | 'no' | '';

type PatientMedicalHistoryFormValues = {
  id: string;
  date: string;
  q1: YesNoValue;
  q2: YesNoValue;
  q3: YesNoValue;
  q4: YesNoValue;
  q5: YesNoValue;
  q6: YesNoValue;
  q7: YesNoValue;
  q8: YesNoValue;
  q9: YesNoValue;
  q10Nursing: YesNoValue;
  q10Pregnant: YesNoValue;
  q11Conditions: MedicalHistoryCondition[];
  others: string;
  remarks: string;
};

type questionItem = {
  key: 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9';
  number: number;
  label: string;
};

const YES_NO_qUESTIONS: questionItem[] = [
  { key: 'q1', number: 1, label: 'Are you in good health?' },
  { key: 'q2', number: 2, label: 'Are you under medical treatment now?' },
  {
    key: 'q3',
    number: 3,
    label: 'Have you ever had serious illness or surgical operation?',
  },
  { key: 'q4', number: 4, label: 'Have you ever been hospitalized?' },
  { key: 'q5', number: 5, label: 'Are you taking any medication?' },
  { key: 'q6', number: 6, label: 'Do you use tobacco products?' },
  { key: 'q7', number: 7, label: 'Do you drink alcoholic beverages?' },
  {
    key: 'q8',
    number: 8,
    label: 'Do you use cocaine or other dangerous drugs?',
  },
  { key: 'q9', number: 9, label: 'Are you allergic to anything?' },
];

const toRadioValue = (value?: boolean): YesNoValue => {
  if (value === true) {
    return 'yes';
  }

  if (value === false) {
    return 'no';
  }

  return '';
};

const toBooleanValue = (value: YesNoValue): boolean | undefined => {
  if (value === 'yes') {
    return true;
  }

  if (value === 'no') {
    return false;
  }

  return undefined;
};

const createInitialValues = (
  selectedItem?: PatientMedicalHistoryModel
): PatientMedicalHistoryFormValues => ({
  id: selectedItem?.id || '',
  date: selectedItem?.date ? new Date(selectedItem.date).toISOString().split('T')[0] : '',
  q1: toRadioValue(selectedItem?.q1),
  q2: toRadioValue(selectedItem?.q2),
  q3: toRadioValue(selectedItem?.q3),
  q4: toRadioValue(selectedItem?.q4),
  q5: toRadioValue(selectedItem?.q5),
  q6: toRadioValue(selectedItem?.q6),
  q7: toRadioValue(selectedItem?.q7),
  q8: toRadioValue(selectedItem?.q8),
  q9: toRadioValue(selectedItem?.q9),
  q10Nursing: toRadioValue(selectedItem?.q10Nursing),
  q10Pregnant: toRadioValue(selectedItem?.q10Pregnant),
  q11Conditions: normalizeMedicalHistoryConditions(selectedItem?.q11Conditions),
  others: selectedItem?.others ?? '',
  remarks: selectedItem?.remarks ?? '',
});

const questionBadgeSx = {
  width: 28,
  height: 28,
  borderRadius: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#e7f1fb',
  color: '#2d6fa7',
  fontSize: '13px',
  fontWeight: 800,
  flexShrink: 0,
};

const questionRowSx = {
  display: 'flex',
  gap: 1.5,
  alignItems: { xs: 'flex-start', md: 'center' },
  justifyContent: 'space-between',
  py: 1,
  borderBottom: '1px solid rgba(226, 234, 242, 0.9)',
  flexDirection: { xs: 'column', md: 'row' },
};

const yesNoControlSx = {
  '.MuiFormControlLabel-label': {
    fontSize: '14px',
    color: '#1f4467',
    fontWeight: 500,
  },
};

const PatientMedicalHistoryForm: FunctionComponent<PatientMedicalHistoryFormProps> = (
  props: PatientMedicalHistoryFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Medical History' : 'Add Medical History'),
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

  const handleSubmit = async (values: PatientMedicalHistoryFormValues): Promise<void> => {
    const payload: PatientMedicalHistoryModel = {
      id: values.id.trim() || undefined,
      patientInfoId: state.patientId,
      date: values.date ? new Date(values.date) : undefined,
      q1: toBooleanValue(values.q1),
      q2: toBooleanValue(values.q2),
      q3: toBooleanValue(values.q3),
      q4: toBooleanValue(values.q4),
      q5: toBooleanValue(values.q5),
      q6: toBooleanValue(values.q6),
      q7: toBooleanValue(values.q7),
      q8: toBooleanValue(values.q8),
      q9: toBooleanValue(values.q9),
      q10Nursing: toBooleanValue(values.q10Nursing),
      q10Pregnant: toBooleanValue(values.q10Pregnant),
      q11Conditions: normalizeMedicalHistoryConditions(values.q11Conditions),
      others: values.others.trim() || '',
      remarks: values.remarks.trim() || '',
    };

    if (state.isUpdate) {
      await HandleUpdatePatientMedicalHistoryItem(payload, state, setState);
      return;
    }

    await HandleCreatePatientMedicalHistoryItem(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={medicalHistoryValidationSchema}
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
              setStatus('Unable to save medical history.');
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
          const shouldShowDateError =
            Boolean(touched.date || submitCount > 0) && Boolean(errors.date);

          const toggleCondition = (condition: MedicalHistoryCondition): void => {
            const nextConditions = values.q11Conditions.includes(condition)
              ? values.q11Conditions.filter((item) => item !== condition)
              : [...values.q11Conditions, condition];

            setFieldValue('q11Conditions', nextConditions);
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
                        error={shouldShowDateError}
                        helperText={shouldShowDateError ? errors.date : undefined}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    {YES_NO_qUESTIONS.map((question) => (
                      <Box key={question.key} sx={questionRowSx}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
                          <Box component="span" sx={questionBadgeSx}>
                            {question.number}
                          </Box>
                          <Typography
                            sx={{
                              color: '#1f4467',
                              fontSize: '15px',
                              fontWeight: 500,
                              lineHeight: 1.45,
                            }}
                          >
                            {question.label}
                          </Typography>
                        </Box>
                        <RadioGroup
                          row
                          name={question.key}
                          value={values[question.key]}
                          onChange={handleChange}
                          sx={{ mr: { md: 1 } }}
                        >
                          <FormControlLabel
                            value="yes"
                            control={<Radio size="small" />}
                            label="Yes"
                            sx={yesNoControlSx}
                          />
                          <FormControlLabel
                            value="no"
                            control={<Radio size="small" />}
                            label="No"
                            sx={yesNoControlSx}
                          />
                        </RadioGroup>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ ...questionRowSx, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flex: 1 }}>
                      <Box component="span" sx={questionBadgeSx}>
                        10
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
                        <Typography
                          sx={{
                            color: '#1f4467',
                            fontSize: '15px',
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          For women only
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 1.5,
                              flexDirection: { xs: 'column', md: 'row' },
                            }}
                          >
                            <Typography
                              sx={{
                                color: '#365675',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.45,
                              }}
                            >
                              Are you nursing or breastfeeding?
                            </Typography>
                            <RadioGroup
                              row
                              name="q10Nursing"
                              value={values.q10Nursing}
                              onChange={handleChange}
                            >
                              <FormControlLabel
                                value="yes"
                                control={<Radio size="small" />}
                                label="Yes"
                                sx={yesNoControlSx}
                              />
                              <FormControlLabel
                                value="no"
                                control={<Radio size="small" />}
                                label="No"
                                sx={yesNoControlSx}
                              />
                            </RadioGroup>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 1.5,
                              flexDirection: { xs: 'column', md: 'row' },
                            }}
                          >
                            <Typography
                              sx={{
                                color: '#365675',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.45,
                              }}
                            >
                              Are you pregnant?
                            </Typography>
                            <RadioGroup
                              row
                              name="q10Pregnant"
                              value={values.q10Pregnant}
                              onChange={handleChange}
                            >
                              <FormControlLabel
                                value="yes"
                                control={<Radio size="small" />}
                                label="Yes"
                                sx={yesNoControlSx}
                              />
                              <FormControlLabel
                                value="no"
                                control={<Radio size="small" />}
                                label="No"
                                sx={yesNoControlSx}
                              />
                            </RadioGroup>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: '#425e79', mb: 1.25 }}
                    >
                      Medical Conditions
                    </Typography>
                    <Divider />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
                    <Box component="span" sx={questionBadgeSx}>
                      11
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          color: '#1f4467',
                          fontSize: '15px',
                          fontWeight: 500,
                          lineHeight: 1.45,
                          mb: 1.5,
                        }}
                      >
                        Do you have any of the following? Please check all that applies.
                      </Typography>
                      <Grid container spacing={0.75}>
                        {MEDICAL_HISTORY_CONDITION_OPTIONS.map((condition) => (
                          <Grid key={condition} size={{ xs: 12, sm: 6, md: 4 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={values.q11Conditions.includes(condition)}
                                  onChange={(): void => toggleCondition(condition)}
                                />
                              }
                              label={condition}
                              sx={{
                                alignItems: 'flex-start',
                                mr: 0,
                                '.MuiFormControlLabel-label': {
                                  color: '#284764',
                                  fontSize: '14px',
                                  lineHeight: 1.4,
                                },
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Others"
                        name="others"
                        value={values.others}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        placeholder="Specify other medical conditions if needed"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Remarks"
                        name="remarks"
                        value={values.remarks}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        multiline
                        minRows={3}
                        placeholder="Add relevant notes for this medical history record"
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

export default PatientMedicalHistoryForm;
