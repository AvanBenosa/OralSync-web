import { ChangeEvent, FunctionComponent, JSX, useMemo, useState } from 'react';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';

import { GetPatients, UploadPatientXlsx } from '../api/api';
import { PatientStateProps, PatientUploadResultModel } from '../api/types';
import { UploadPatientProgressNoteXlsx } from '../../patient-profile-modules/progress-note/api/api';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];

type ImportSlotId = 'patient' | 'progress';

type PatientUploadModalProps = PatientStateProps & {
  clinicId?: string | null;
};

const isSupportedFile = (file: File): boolean => {
  const normalizedName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

const toErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === 'string' ? error.response.data : undefined;
    return responseMessage || error.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

const PatientUploadModal: FunctionComponent<PatientUploadModalProps> = (
  props: PatientUploadModalProps
): JSX.Element => {
  const { state, setState, clinicId } = props;
  const [selectedPatientFile, setSelectedPatientFile] = useState<File | undefined>();
  const [selectedProgressFile, setSelectedProgressFile] = useState<File | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [patientUploadResult, setPatientUploadResult] = useState<
    PatientUploadResultModel | undefined
  >();
  const [progressUploadResult, setProgressUploadResult] = useState<
    PatientUploadResultModel | undefined
  >();

  const patientFileLabel = useMemo(
    () => selectedPatientFile?.name || 'No file selected.',
    [selectedPatientFile]
  );
  const progressFileLabel = useMemo(
    () => selectedProgressFile?.name || 'No file selected.',
    [selectedProgressFile]
  );
  const hasSelectedFiles = Boolean(selectedPatientFile || selectedProgressFile);

  const handleClose = (): void => {
    setSelectedPatientFile(undefined);
    setSelectedProgressFile(undefined);
    setErrorMessage('');
    setStatusMessage('');
    setPatientUploadResult(undefined);
    setProgressUploadResult(undefined);
    setState({
      ...state,
      openModal: false,
      upload: false,
    });
  };

  const handleFileChange =
    (slot: ImportSlotId) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) {
        if (slot === 'patient') {
          setSelectedPatientFile(undefined);
        } else {
          setSelectedProgressFile(undefined);
        }
        setErrorMessage('');
        return;
      }

      if (!isSupportedFile(file)) {
        setErrorMessage('Only .xlsx and .csv files are allowed.');
        return;
      }

      if (slot === 'patient') {
        setSelectedPatientFile(file);
      } else {
        setSelectedProgressFile(file);
      }

      setErrorMessage('');
      setStatusMessage('');
      setPatientUploadResult(undefined);
      setProgressUploadResult(undefined);
    };

  const refreshPatientTable = async (): Promise<void> => {
    const response = await GetPatients(
      {
        ...state,
        load: true,
        openModal: true,
        upload: true,
        isUpdate: false,
        isDelete: false,
        selectedItem: undefined,
        clinicProfileId: clinicId,
      },
      clinicId,
      true
    );

    setState({
      ...state,
      load: false,
      items: response.items || [],
      pageStart:
        response.pageStart && response.totalCount && response.pageStart === response.totalCount
          ? response.pageStart - response.pageEnd
          : response.pageStart,
      pageEnd: response.pageEnd,
      totalItem: response.totalCount,
      openModal: true,
      upload: true,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
      clinicProfileId: clinicId,
    });
  };

  const handleUpload = async (): Promise<void> => {
    if (!hasSelectedFiles) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);
    setPatientUploadResult(undefined);
    setProgressUploadResult(undefined);

    try {
      if (selectedPatientFile) {
        setStatusMessage('Uploading PatientInfo file...');
        const patientResult = await UploadPatientXlsx(selectedPatientFile);
        setPatientUploadResult(patientResult);
      }

      if (selectedProgressFile) {
        setStatusMessage('Uploading Patient Progress Note file...');
        const progressResult = await UploadPatientProgressNoteXlsx(selectedProgressFile);
        setProgressUploadResult(progressResult);
      }

      if (selectedPatientFile) {
        setStatusMessage('Refreshing patient list...');
        await refreshPatientTable();
      }

      setSelectedPatientFile(undefined);
      setSelectedProgressFile(undefined);
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to upload import files.'));
    } finally {
      setStatusMessage('');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Upload Import Files</DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {patientUploadResult ? (
          <Alert
            severity={patientUploadResult.skippedCount > 0 ? 'warning' : 'success'}
            sx={{ mb: 2 }}
          >
            PatientInfo Imported: {patientUploadResult.importedCount} | Skipped:{' '}
            {patientUploadResult.skippedCount} | Rows: {patientUploadResult.totalRows}
          </Alert>
        ) : null}

        {progressUploadResult ? (
          <Alert
            severity={progressUploadResult.skippedCount > 0 ? 'warning' : 'success'}
            sx={{ mb: 2 }}
          >
            Patient Progress Note Imported: {progressUploadResult.importedCount} | Skipped:{' '}
            {progressUploadResult.skippedCount} | Rows: {progressUploadResult.totalRows}
          </Alert>
        ) : null}

        {isSubmitting ? (
          <Alert
            severity="info"
            icon={<CircularProgress size={18} color="inherit" />}
            sx={{ mb: 2 }}
          >
            {statusMessage || 'Uploading import files. Please wait...'}
          </Alert>
        ) : null}

        <Box
          sx={{
            border: '1px dashed rgba(22, 119, 168, 0.35)',
            borderRadius: 2,
            backgroundColor: 'rgba(22, 119, 168, 0.03)',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                backgroundColor: '#e9f4fb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e6f9f',
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 34 }} />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, color: '#284764', mb: 0.5 }}>
                Select one or two import files
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                `PatientInfo` uploads first. `Patient Progress Note` upload now validates on the
                backend that `LastName` and `FirstName` already exist in `PatientInfo`. Unmatched
                rows are skipped, and matched rows are saved with the correct `PatientInfoId`.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  border: '1px solid rgba(22, 119, 168, 0.2)',
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  p: 2,
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#284764' }}>PatientInfo</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Import patient records into the clinic patient list.
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      px: 1.1,
                      py: 0.35,
                      borderRadius: 999,
                      backgroundColor: 'rgba(47, 109, 179, 0.1)',
                      color: '#2f6db3',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Primary
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.25,
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadOutlinedIcon />}
                    disabled={isSubmitting}
                  >
                    Choose XLSX/CSV File
                    <input
                      hidden
                      type="file"
                      accept=".xlsx,.csv,text/csv"
                      onChange={handleFileChange('patient')}
                    />
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#415c74', wordBreak: 'break-word', textAlign: 'center' }}
                >
                  {patientFileLabel}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  border: '1px solid rgba(22, 119, 168, 0.2)',
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  p: 2,
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#284764' }}>
                      Patient Progress Note
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Upload progress notes and let the backend match them to PatientInfo records.
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      px: 1.1,
                      py: 0.35,
                      borderRadius: 999,
                      backgroundColor: 'rgba(114, 132, 151, 0.12)',
                      color: '#5f7387',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Optional
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.25,
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadOutlinedIcon />}
                    disabled={isSubmitting}
                  >
                    Choose XLSX/CSV File
                    <input
                      hidden
                      type="file"
                      accept=".xlsx,.csv,text/csv"
                      onChange={handleFileChange('progress')}
                    />
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: '#415c74', wordBreak: 'break-word', textAlign: 'center' }}
                >
                  {progressFileLabel}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {patientUploadResult?.errors?.length ? (
          <Box
            sx={{
              mt: 2,
              border: '1px solid rgba(217, 119, 6, 0.28)',
              borderRadius: 2,
              backgroundColor: '#fffaf2',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            <Typography
              sx={{
                px: 2,
                pt: 1.5,
                fontWeight: 700,
                color: '#9a5b00',
              }}
            >
              PatientInfo Upload Errors
            </Typography>
            <List dense sx={{ pt: 0.5, pb: 1 }}>
              {patientUploadResult.errors.map((error, index) => (
                <ListItem key={`patient-error-${index}`} sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={error}
                    primaryTypographyProps={{
                      fontSize: 13,
                      color: '#7c4a03',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : null}

        {progressUploadResult?.errors?.length ? (
          <Box
            sx={{
              mt: 2,
              border: '1px solid rgba(217, 119, 6, 0.28)',
              borderRadius: 2,
              backgroundColor: '#fffaf2',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            <Typography
              sx={{
                px: 2,
                pt: 1.5,
                fontWeight: 700,
                color: '#9a5b00',
              }}
            >
              Patient Progress Note Upload Errors
            </Typography>
            <List dense sx={{ pt: 0.5, pb: 1 }}>
              {progressUploadResult.errors.map((error, index) => (
                <ListItem key={`progress-error-${index}`} sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={error}
                    primaryTypographyProps={{
                      fontSize: 13,
                      color: '#7c4a03',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!hasSelectedFiles || isSubmitting}
          onClick={handleUpload}
        >
          {isSubmitting ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </>
  );
};

export default PatientUploadModal;
