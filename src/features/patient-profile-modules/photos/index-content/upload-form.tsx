import { ChangeEvent, FunctionComponent, JSX, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import localStyles from '../style.scss.module.scss';
import {
  HandleCreatePatientUploadItem,
  HandleUpdatePatientUploadItem,
} from '../api/uploads-handlers';
import { UploadPatientUploadFile } from '../api/uploads-api';
import { PatientUploadFileType, PatientUploadModel, PatientUploadStateProps } from '../api/types';

type PatientUploadFormProps = PatientUploadStateProps & {
  patientLabel?: string;
};

type PatientUploadFormValues = {
  remarks: string;
};

const UPLOAD_ACCEPT_VALUE =
  '.jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';

const resolveFileType = (file: File): PatientUploadFileType => {
  const extension = `.${file.name.split('.').pop() || ''}`.toLowerCase();

  if (file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)) {
    return PatientUploadFileType.Image;
  }

  if (extension === '.pdf') {
    return PatientUploadFileType.Pdf;
  }

  if (['.xls', '.xlsx', '.csv'].includes(extension)) {
    return PatientUploadFileType.Excel;
  }

  if (['.doc', '.docx'].includes(extension)) {
    return PatientUploadFileType.Word;
  }

  return PatientUploadFileType.None;
};

const PatientUploadForm: FunctionComponent<PatientUploadFormProps> = (
  props: PatientUploadFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileLabel, setSelectedFileLabel] = useState('');
  const isUpdateMode = Boolean(state.isUpdate);

  const dialogTitle = useMemo(
    () => (isUpdateMode ? 'Edit Upload Remarks' : 'Add Patient Upload'),
    [isUpdateMode]
  );

  const handleClose = (): void => {
    setSelectedFile(null);
    setSelectedFileLabel('');
    setState((prev: typeof state) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleSubmit = async (values: PatientUploadFormValues): Promise<void> => {
    if (!state.patientId?.trim()) {
      throw new Error('Patient is required.');
    }

    if (isUpdateMode) {
      if (!state.selectedItem?.id?.trim()) {
        throw new Error('Unable to update upload remarks.');
      }

      await HandleUpdatePatientUploadItem(
        {
          id: state.selectedItem.id,
          patientInfoId: state.patientId,
          remarks: values.remarks.trim(),
        },
        state,
        setState
      );
      return;
    }

    if (!selectedFile) {
      throw new Error('Please choose one image or document to upload.');
    }

    const extension = `.${selectedFile.name.split('.').pop() || ''}`.replace(/\.$/, '');
    const uploadResponse = await UploadPatientUploadFile(selectedFile, state.patientId);

    const payload: PatientUploadModel = {
      patientInfoId: state.patientId,
      fileName: uploadResponse.fileName,
      originalFileName: uploadResponse.originalFileName || selectedFile.name,
      filePath: uploadResponse.filePath,
      fileType: uploadResponse.fileType || resolveFileType(selectedFile),
      fileMediaType: selectedFile.type,
      fileExtension: extension,
      remarks: values.remarks.trim(),
    };

    await HandleCreatePatientUploadItem(payload, state, setState);
    setSelectedFile(null);
    setSelectedFileLabel('');
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={{ remarks: isUpdateMode ? state.selectedItem?.remarks?.trim() || '' : '' }}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmit(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else if (error instanceof Error) {
              setStatus(error.message);
            } else {
              setStatus('Unable to save patient upload.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleBlur, handleSubmit, isSubmitting, status }): JSX.Element => (
          <>
            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <Box component="form" onSubmit={handleSubmit} className={localStyles.uploadFormSection}>
                {status ? <Alert severity="error">{status}</Alert> : null}

                <TextField
                  label="Patient"
                  value={patientLabel || 'Selected patient'}
                  fullWidth
                  size="small"
                  disabled
                />

                <div className={localStyles.uploadPickerCard}>
                  <div className={localStyles.uploadPickerMeta}>
                    <div className={localStyles.uploadPickerIconWrap}>
                      <InsertDriveFileOutlinedIcon className={localStyles.uploadPickerIcon} />
                    </div>
                    <div>
                      <Typography className={localStyles.panelTitle}>
                        {isUpdateMode ? 'Uploaded File' : 'Choose File'}
                      </Typography>
                      <Typography className={localStyles.panelText}>
                        {isUpdateMode
                          ? 'The uploaded file cannot be replaced here. Only the remarks can be updated.'
                          : 'Upload one image or document with optional remarks.'}
                      </Typography>
                    </div>
                  </div>

                  <div className={localStyles.uploadPickerActions}>
                    {!isUpdateMode ? (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadOutlinedIcon />}
                      >
                        Select File
                        <input
                          type="file"
                          hidden
                          accept={UPLOAD_ACCEPT_VALUE}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const nextFile = event.target.files?.[0] || null;
                            setSelectedFile(nextFile);
                            setSelectedFileLabel(nextFile?.name || '');
                          }}
                        />
                      </Button>
                    ) : null}
                    <Typography className={localStyles.uploadPickerValue}>
                      {isUpdateMode
                        ? state.selectedItem?.originalFileName ||
                          state.selectedItem?.fileName ||
                          'No file selected'
                        : selectedFileLabel || 'No file selected'}
                    </Typography>
                  </div>
                </div>

                <TextField
                  label="Remarks"
                  name="remarks"
                  value={values.remarks}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Add notes about this uploaded image or document."
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
                Cancel
              </Button>
              <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                {isUpdateMode ? 'Update Remarks' : 'Save Upload'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientUploadForm;
