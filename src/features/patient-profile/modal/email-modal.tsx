import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { GetCurrentClinicProfile } from '../../settings/clinic-profile/api/api';
import { ClinicProfileModel } from '../../settings/clinic-profile/api/types';
import { GetTemplateForms } from '../../settings/template-form/api/api';
import {
  isTemplateOfType,
  TemplateFormModel,
  TemplateType,
} from '../../settings/template-form/api/types';
import TemplateFormEditor from '../../settings/template-form/index-content/template-form-editor';
import { resolvePatientFormTemplateContent } from '../../patient-profile-modules/patient-forms/api/template-content';
import { useAuthStore } from '../../../common/store/authStore';
import { HandleSendPatientEmail, HandleSendPatientSms } from '../api/handlers';
import { PatientProfileStateProps } from '../api/types';
import { patientEmailValidationSchema, patientSmsValidationSchema } from '../api/validation';

type MessageChannel = 'email' | 'sms';

type PatientMessageFormValues = {
  patientId?: string;
  recipientEmail: string;
  recipientNumber: string;
  templateFormId: string;
  subject: string;
  body: string;
};

const EMPTY_EDITOR_HTML = '<p></p>';
const MAX_EMAIL_ATTACHMENT_COUNT = 5;
const MAX_EMAIL_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const EMAIL_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf,application/vnd.oasis.opendocument.text';
const ALLOWED_EMAIL_ATTACHMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']);

const createInitialValues = (props: PatientProfileStateProps): PatientMessageFormValues => ({
  patientId: props.state.patientId ?? props.state.profile?.id,
  recipientEmail: props.state.profile?.emailAddress?.trim() || '',
  recipientNumber: props.state.profile?.contactNumber?.trim() || '',
  templateFormId: '',
  subject: props.state.profile?.firstName
    ? `Message for ${props.state.profile.firstName}`
    : 'Patient message',
  body: EMPTY_EDITOR_HTML,
});

const formatFileSize = (size: number): string => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
};

const getFileExtension = (fileName: string): string =>
  fileName.includes('.') ? fileName.split('.').pop()?.trim().toLowerCase() || '' : '';

const toBase64Content = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64Content = result.includes(',') ? result.split(',')[1] || '' : result;

      resolve(base64Content);
    };

    reader.onerror = () => {
      reject(reader.error || new Error(`Unable to read file "${file.name}".`));
    };

    reader.readAsDataURL(file);
  });

const PatientProfileEmailModal: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [channel, setChannel] = useState<MessageChannel>('email');
  const [templateOptions, setTemplateOptions] = useState<TemplateFormModel[]>([]);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const authClinicName = useAuthStore((store) => store.user?.clinicName?.trim() || '');
  const authBannerImagePath = useAuthStore((store) => store.user?.bannerImagePath?.trim() || '');

  const validationSchema = useMemo(
    () => (channel === 'email' ? patientEmailValidationSchema : patientSmsValidationSchema),
    [channel]
  );

  useEffect(() => {
    let isMounted = true;

    void GetTemplateForms()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setTemplateOptions(
          (response.items || []).filter((item) => isTemplateOfType(item, TemplateType.Email))
        );
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

  useEffect(() => {
    if (state.openModal && channel === 'email') {
      return;
    }

    setAttachmentFiles([]);
    setAttachmentError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [channel, state.openModal]);

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

  const handleClose = (): void => {
    setChannel('email');
    setAttachmentFiles([]);
    setAttachmentError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setState((prev: any) => ({
      ...prev,
      openModal: false,
      isEmail: false,
      isDelete: false,
      isUpdate: false,
    }));
  };

  const handleAttachmentSelection = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextFiles = [...attachmentFiles];

    for (const file of selectedFiles) {
      const extension = getFileExtension(file.name);
      const isSupportedExtension = ALLOWED_EMAIL_ATTACHMENT_EXTENSIONS.has(extension);

      if (!isSupportedExtension) {
        setAttachmentError(`"${file.name}" is not a supported attachment type.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (file.size > MAX_EMAIL_ATTACHMENT_SIZE_BYTES) {
        setAttachmentError(`"${file.name}" exceeds the 10 MB attachment limit.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const alreadyAdded = nextFiles.some(
        (existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      );

      if (!alreadyAdded) {
        nextFiles.push(file);
      }
    }

    if (nextFiles.length > MAX_EMAIL_ATTACHMENT_COUNT) {
      setAttachmentError(`You can attach up to ${MAX_EMAIL_ATTACHMENT_COUNT} files only.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setAttachmentError('');
    setAttachmentFiles(nextFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (fileToRemove: File): void => {
    setAttachmentFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
    setAttachmentError('');
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Send Patient Message</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={createInitialValues(props)}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);
          setAttachmentError('');

          try {
            if (channel === 'email') {
              const attachments = await Promise.all(
                attachmentFiles.map(async (file) => ({
                  fileName: file.name,
                  contentType: file.type || 'application/octet-stream',
                  base64Content: await toBase64Content(file),
                }))
              );

              await HandleSendPatientEmail(
                {
                  patientId: values.patientId,
                  templateFormId: values.templateFormId.trim() || undefined,
                  recipientEmail: values.recipientEmail.trim(),
                  subject: values.subject.trim(),
                  body: values.body.trim(),
                  isBodyHtml: true,
                  attachments,
                },
                state,
                setState
              );
            } else {
              await HandleSendPatientSms(
                {
                  patientId: values.patientId,
                  recipientNumber: values.recipientNumber,
                  message: values.body,
                  senderName: '',
                  usePriority: false,
                },
                state,
                setState
              );
            }
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus(
                channel === 'email'
                  ? 'Unable to queue patient email.'
                  : 'Unable to queue patient sms.'
              );
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          status,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          setFieldTouched,
          setFieldValue,
        }): JSX.Element => (
          <>
            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <ToggleButtonGroup
                exclusive
                value={channel}
                onChange={(_, nextValue: MessageChannel | null) => {
                  if (!nextValue) {
                    return;
                  }

                  setChannel(nextValue);
                }}
                size="small"
                sx={{
                  mb: 2,
                  p: 0.5,
                  borderRadius: 3,
                  background: 'rgba(235, 243, 250, 0.92)',
                }}
              >
                <ToggleButton value="email" sx={{ px: 2.2, fontWeight: 700 }}>
                  Email
                </ToggleButton>
                <ToggleButton value="sms" sx={{ px: 2.2, fontWeight: 700 }}>
                  SMS
                </ToggleButton>
              </ToggleButtonGroup>

              {status ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {status}
                </Alert>
              ) : null}

              {channel === 'email' ? (
                <>
                  {!status && templateOptions.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No email templates were found. Create one first in Settings &gt; Build Up &gt;
                      Email Template.
                    </Alert>
                  ) : null}

                  <TextField
                    fullWidth
                    label="Recipient Email"
                    name="recipientEmail"
                    type="email"
                    value={values.recipientEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.recipientEmail && errors.recipientEmail)}
                    helperText={touched.recipientEmail && errors.recipientEmail}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Email Template"
                    name="templateFormId"
                    value={values.templateFormId}
                    onChange={(event) => {
                      const templateId = event.target.value;

                      if (!templateId) {
                        void setFieldValue('templateFormId', '');
                        return;
                      }

                      const selectedTemplate = templateOptions.find(
                        (option) => option.id === templateId
                      );
                      const templateContent =
                        selectedTemplate?.templateContent?.trim() || EMPTY_EDITOR_HTML;
                      const resolvedBody = resolvePatientFormTemplateContent(templateContent, {
                        patientProfile: state.profile,
                        clinicProfile: resolvedClinicProfile,
                        date: new Date(),
                      });

                      void setFieldValue('templateFormId', templateId);
                      void setFieldValue(
                        'subject',
                        selectedTemplate?.templateName?.trim() || values.subject
                      );
                      void setFieldValue('body', resolvedBody);
                      void setFieldTouched('body', true, false);
                    }}
                    select
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="">Select template</MenuItem>
                    {templateOptions.map((option) => (
                      <MenuItem key={option.id || option.templateName} value={option.id || ''}>
                        {option.templateName || 'Untitled template'}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={values.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.subject && errors.subject)}
                    helperText={touched.subject && errors.subject}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    <input
                      ref={fileInputRef}
                      hidden
                      type="file"
                      multiple
                      accept={EMAIL_ATTACHMENT_ACCEPT}
                      onChange={handleAttachmentSelection}
                    />

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
                        Upload Attachment
                      </Button>
                      <span style={{ color: '#58708a', fontSize: 12 }}>
                        PDF, DOC, DOCX, TXT, RTF, or ODT up to 10 MB each.
                      </span>
                    </div>

                    {attachmentError ? <Alert severity="error">{attachmentError}</Alert> : null}

                    {attachmentFiles.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          padding: 12,
                          border: '1px solid rgba(201, 214, 227, 0.95)',
                          borderRadius: 10,
                          background: '#f8fbfe',
                        }}
                      >
                        {attachmentFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ color: '#31475f', fontSize: 13 }}>
                              {file.name} ({formatFileSize(file.size)})
                            </span>
                            <Button
                              size="small"
                              color="inherit"
                              onClick={() => handleRemoveAttachment(file)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <TemplateFormEditor
                    label="Email Message"
                    value={values.body}
                    onChange={(value) => {
                      const resolvedValue = resolvePatientFormTemplateContent(value, {
                        patientProfile: state.profile,
                        clinicProfile: resolvedClinicProfile,
                        date: new Date(),
                      });

                      void setFieldValue('body', resolvedValue);
                    }}
                    onFocus={() => {
                      void setFieldTouched('body', true, false);
                    }}
                    placeholder="Write or adjust the email template here..."
                  />

                  {touched.body && errors.body ? (
                    <div
                      style={{
                        color: '#d32f2f',
                        fontSize: 12,
                        marginTop: -8,
                      }}
                    >
                      {errors.body}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Recipient Number"
                    name="recipientNumber"
                    disabled
                    value={values.recipientNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.recipientNumber && errors.recipientNumber)}
                    helperText={
                      (touched.recipientNumber && errors.recipientNumber) ||
                      'Use 09XXXXXXXXX, 9XXXXXXXXX, or 639XXXXXXXXX.'
                    }
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Message"
                    name="body"
                    value={values.body}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.body && errors.body)}
                    helperText={touched.body && errors.body}
                    multiline
                    minRows={6}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : channel === 'email' ? 'Send Email' : 'Send SMS'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientProfileEmailModal;
