import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';

import { GetClinicUsers } from '../../../settings/create-user/api/api';
import { SettingsUserModel } from '../../../settings/create-user/api/types';
import { GetCurrentClinicProfile } from '../../../settings/clinic-profile/api/api';
import { ClinicProfileModel } from '../../../settings/clinic-profile/api/types';
import { GetTemplateForms } from '../../../settings/template-form/api/api';
import TemplateFormEditor from '../../../settings/template-form/index-content/template-form-editor';
import {
  isTemplateOfType,
  TemplateFormModel,
  TemplateType,
} from '../../../settings/template-form/api/types';
import { resolvePatientFormTemplateContent } from '../api/template-content';
import { HandleCreatePatientFormItem, HandleUpdatePatientFormItem } from '../api/handlers';
import { PatientFormModel, PatientFormStateProps } from '../api/types';
import { useAuthStore } from '../../../../common/store/authStore';

type PatientFormsFormValues = {
  id: string;
  templateFormId: string;
  formType: string;
  assignedDoctor: string;
  date: string;
  reportTemplate: string;
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

const getTodayDateInputValue = (): string => toDateInputValue(new Date());

const createInitialValues = (selectedItem?: PatientFormModel): PatientFormsFormValues => ({
  id: selectedItem?.id || '',
  templateFormId: selectedItem?.templateFormId || '',
  formType: selectedItem?.formType || '',
  assignedDoctor: selectedItem?.assignedDoctor || '',
  date: toDateInputValue(selectedItem?.date) || getTodayDateInputValue(),
  reportTemplate: selectedItem?.reportTemplate || '',
});

const getDoctorValue = (item: SettingsUserModel): string =>
  [item.firstName, item.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ') ||
  item.userName?.trim() ||
  item.emailAddress?.trim() ||
  '';

const getDoctorDisplayName = (item: SettingsUserModel): string => {
  const doctorName = [item.firstName, item.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  return doctorName ? `Dr. ${doctorName}` : item.userName || item.emailAddress || 'Unnamed user';
};

const isEditorContentEquivalent = (leftValue?: string, rightValue?: string): boolean =>
  (leftValue || '').trim() === (rightValue || '').trim();

const PatientFormsForm: FunctionComponent<PatientFormStateProps> = (
  props: PatientFormStateProps
): JSX.Element => {
  const { state, setState, patientLabel, patientProfile } = props;
  const [formValues, setFormValues] = useState<PatientFormsFormValues>(
    createInitialValues(state.selectedItem)
  );
  const [submitError, setSubmitError] = useState<string>('');
  const [templateOptions, setTemplateOptions] = useState<TemplateFormModel[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<SettingsUserModel[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [reportTemplateSource, setReportTemplateSource] = useState<string>('');
  const [isReportTemplateTouched, setIsReportTemplateTouched] = useState<boolean>(false);
  const authClinicName = useAuthStore((store) => store.user?.clinicName?.trim() || '');
  const authBannerImagePath = useAuthStore((store) => store.user?.bannerImagePath?.trim() || '');

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Form' : 'Add Form'),
    [state.isUpdate]
  );

  useEffect(() => {
    setFormValues(createInitialValues(state.selectedItem));
    setSubmitError('');
    setReportTemplateSource(state.selectedItem?.reportTemplate || '');
    setIsReportTemplateTouched(false);
  }, [state.selectedItem, state.isUpdate, state.openModal]);

  useEffect(() => {
    let isMounted = true;

    void GetTemplateForms()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const options = (response.items || []).filter((item) =>
          isTemplateOfType(item, TemplateType.Form)
        );
        setTemplateOptions(options);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setTemplateOptions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void GetClinicUsers()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const filteredUsers = (response.items || []).filter((item) => {
          const normalizedUserName = (item.userName || '').trim().toLowerCase();
          const normalizedEmail = (item.emailAddress || '').trim().toLowerCase();
          const isBootstrapSeed =
            normalizedUserName === 'admin@email.com' || normalizedEmail === 'admin@email.com';

          return !isBootstrapSeed;
        });

        setDoctorOptions(filteredUsers);
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

  useEffect(() => {
    let isMounted = true;

    void GetCurrentClinicProfile()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(response);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableTemplateOptions = useMemo(() => {
    if (
      formValues.templateFormId &&
      !templateOptions.some((option) => option.id === formValues.templateFormId)
    ) {
      return [
        {
          id: formValues.templateFormId,
          templateName: formValues.formType || 'Current template',
          templateContent: formValues.reportTemplate,
        },
        ...templateOptions,
      ];
    }

    return templateOptions;
  }, [formValues.formType, formValues.reportTemplate, formValues.templateFormId, templateOptions]);

  const availableDoctorOptions = useMemo(() => {
    if (
      formValues.assignedDoctor &&
      !doctorOptions.some((option) => getDoctorValue(option) === formValues.assignedDoctor)
    ) {
      return [
        {
          label: `Dr. ${formValues.assignedDoctor}`,
          value: formValues.assignedDoctor,
        },
        ...doctorOptions.map((option) => ({
          label: getDoctorDisplayName(option),
          value: getDoctorValue(option),
        })),
      ];
    }

    return doctorOptions.map((option) => ({
      label: getDoctorDisplayName(option),
      value: getDoctorValue(option),
    }));
  }, [doctorOptions, formValues.assignedDoctor]);

  const resolvedClinicProfile = useMemo<ClinicProfileModel | null>(() => {
    if (!clinicProfile && !authClinicName && !authBannerImagePath) {
      return null;
    }

    return {
      ...(clinicProfile || {}),
      clinicName: clinicProfile?.clinicName?.trim() || authClinicName,
      bannerImagePath: clinicProfile?.bannerImagePath?.trim() || authBannerImagePath,
    };
  }, [authBannerImagePath, authClinicName, clinicProfile]);

  const resolvedReportTemplate = useMemo(
    () =>
      resolvePatientFormTemplateContent(reportTemplateSource, {
        patientProfile,
        clinicProfile: resolvedClinicProfile,
        assignedDoctor: formValues.assignedDoctor,
        date: formValues.date,
      }),
    [
      formValues.assignedDoctor,
      formValues.date,
      patientProfile,
      reportTemplateSource,
      resolvedClinicProfile,
    ]
  );

  useEffect(() => {
    if (!reportTemplateSource.trim() || isReportTemplateTouched) {
      return;
    }

    setFormValues((prev) =>
      isEditorContentEquivalent(prev.reportTemplate, resolvedReportTemplate)
        ? prev
        : {
            ...prev,
            reportTemplate: resolvedReportTemplate,
          }
    );
  }, [isReportTemplateTouched, reportTemplateSource, resolvedReportTemplate]);

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      isView: false,
      selectedItem: undefined,
    });
  };

  const handleTemplateChange = (templateId: string): void => {
    const selectedTemplate = availableTemplateOptions.find((option) => option.id === templateId);
    const templateContent = selectedTemplate?.templateContent || '';
    const nextResolvedTemplate = resolvePatientFormTemplateContent(templateContent, {
      patientProfile,
      clinicProfile: resolvedClinicProfile,
      assignedDoctor: formValues.assignedDoctor,
      date: formValues.date,
    });

    setReportTemplateSource(templateContent);
    setIsReportTemplateTouched(false);
    setFormValues((prev) => ({
      ...prev,
      templateFormId: templateId,
      formType: selectedTemplate?.templateName || '',
      reportTemplate: nextResolvedTemplate,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitError('');

    if (!formValues.date.trim()) {
      setSubmitError('Date is required.');
      return;
    }

    if (!formValues.formType.trim()) {
      setSubmitError('Form type is required.');
      return;
    }

    if (!formValues.reportTemplate.trim()) {
      setSubmitError('Report template is required.');
      return;
    }

    const payload: PatientFormModel = {
      id: formValues.id.trim() || undefined,
      patientInfoId: state.patientId,
      templateFormId: formValues.templateFormId.trim() || undefined,
      formType: formValues.formType.trim(),
      assignedDoctor: formValues.assignedDoctor.trim() || undefined,
      date: `${formValues.date}T00:00:00`,
      reportTemplate: formValues.reportTemplate.trim(),
    };

    try {
      if (state.isUpdate) {
        await HandleUpdatePatientFormItem(payload, state, setState);
        return;
      }

      await HandleCreatePatientFormItem(payload, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update patient form.' : 'Unable to save patient form.'
        );
      }
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}
        {!submitError && templateOptions.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No form templates were found. Create one first in Settings &gt; Build Up &gt; Form
            Template.
          </Alert>
        ) : null}

        <div style={{ display: 'grid', gap: 16 }}>
          <TextField
            label="Patient"
            value={patientLabel || 'Selected patient'}
            fullWidth
            size="small"
            disabled
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <TextField
              label="Date"
              type="date"
              value={formValues.date}
              onChange={(event) =>
                setFormValues((prev) => {
                  const nextDate = event.target.value;
                  const nextReportTemplate = isReportTemplateTouched
                    ? prev.reportTemplate
                    : resolvePatientFormTemplateContent(reportTemplateSource, {
                        patientProfile,
                        clinicProfile: resolvedClinicProfile,
                        assignedDoctor: prev.assignedDoctor,
                        date: nextDate,
                      });

                  return {
                    ...prev,
                    date: nextDate,
                    reportTemplate: nextReportTemplate,
                  };
                })
              }
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Form Type"
              value={formValues.templateFormId}
              onChange={(event) => handleTemplateChange(event.target.value)}
              select
              fullWidth
              size="small"
            >
              <MenuItem value="">Select template</MenuItem>
              {availableTemplateOptions.map((option) => (
                <MenuItem key={option.id || option.templateName} value={option.id || ''}>
                  {option.templateName || 'Untitled template'}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Assigned Dentist"
              value={formValues.assignedDoctor}
              onChange={(event) =>
                setFormValues((prev) => {
                  const nextAssignedDoctor = event.target.value;
                  const nextReportTemplate = isReportTemplateTouched
                    ? prev.reportTemplate
                    : resolvePatientFormTemplateContent(reportTemplateSource, {
                        patientProfile,
                        clinicProfile: resolvedClinicProfile,
                        assignedDoctor: nextAssignedDoctor,
                        date: prev.date,
                      });

                  return {
                    ...prev,
                    assignedDoctor: nextAssignedDoctor,
                    reportTemplate: nextReportTemplate,
                  };
                })
              }
              select
              fullWidth
              size="small"
            >
              <MenuItem value="">Select assigned doctor</MenuItem>
              {availableDoctorOptions.map((option) => (
                <MenuItem key={option.value || option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <TemplateFormEditor
            label="Report Template"
            value={formValues.reportTemplate}
            onChange={(value) => {
              const nextResolvedValue = resolvePatientFormTemplateContent(value, {
                patientProfile,
                clinicProfile: resolvedClinicProfile,
                assignedDoctor: formValues.assignedDoctor,
                date: formValues.date,
              });

              setIsReportTemplateTouched(
                !isEditorContentEquivalent(nextResolvedValue, resolvedReportTemplate)
              );
              setFormValues((prev) => ({
                ...prev,
                reportTemplate: nextResolvedValue,
              }));
            }}
            onFocus={() => setSubmitError('')}
            placeholder="Write or adjust the report template here..."
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()}>
          {state.isUpdate ? 'Update Form' : 'Save Form'}
        </Button>
      </DialogActions>
    </>
  );
};

export default PatientFormsForm;
