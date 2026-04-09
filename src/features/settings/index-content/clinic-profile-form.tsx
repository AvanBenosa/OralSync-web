import { ChangeEvent, FormEvent, FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../../../common/services/api-client';
import { useAuthStore } from '../../../common/store/authStore';
import { HandleUpdateClinicProfile } from '../clinic-profile/api/handlers';
import { UploadClinicBanner } from '../clinic-profile/api/api';
import { ClinicProfileStateProps } from '../clinic-profile/api/types';
import ClinicBranchManagement from './clinic-branch-management';
import styles from '../style.scss.module.scss';

const workingDayOptions = [
  { label: 'Monday', field: 'isMondayOpen' },
  { label: 'Tuesday', field: 'isTuesdayOpen' },
  { label: 'Wednesday', field: 'isWednesdayOpen' },
  { label: 'Thursday', field: 'isThursdayOpen' },
  { label: 'Friday', field: 'isFridayOpen' },
  { label: 'Saturday', field: 'isSaturdayOpen' },
  { label: 'Sunday', field: 'isSundayOpen' },
] as const;

const resolveClinicBannerSrc = (bannerImagePath?: string): string => {
  if (!bannerImagePath?.trim()) {
    return '';
  }

  if (
    bannerImagePath.startsWith('http://') ||
    bannerImagePath.startsWith('https://') ||
    bannerImagePath.startsWith('blob:') ||
    bannerImagePath.startsWith('data:')
  ) {
    return bannerImagePath;
  }

  if (bannerImagePath.startsWith('/')) {
    return `${getApiBaseUrl()}${bannerImagePath}`;
  }

  return `${getApiBaseUrl()}/uploads/clinics/${bannerImagePath}`;
};

const ClinicProfileForm: FunctionComponent<ClinicProfileStateProps> = (
  props: ClinicProfileStateProps
): JSX.Element => {
  const { state, setState } = props;
  const navigate = useNavigate();
  const logout = useAuthStore((store) => store.logout);
  const currentClinicName = useAuthStore((store) => store.user?.clinicName?.trim() || '');
  const currentUserRole = useAuthStore((store) => store.user?.role?.trim().toLowerCase() || '');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [selectedBannerFileName, setSelectedBannerFileName] = useState('');
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
  const [confirmClinicNameDialogOpen, setConfirmClinicNameDialogOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;

    setState((prev: any) => ({
      ...prev,
      item: {
        ...prev.item,
        [name]: value,
      },
    }));
    setStatusMessage('');
    setSubmitError('');
  };

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return Promise.resolve();
    }

    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
    }

    setBannerPreviewUrl(URL.createObjectURL(file));
    setSelectedBannerFileName(file.name);
    setBannerUploadError('');
    setSubmitError('');
    setStatusMessage('');
    setIsUploadingBanner(true);

    return UploadClinicBanner(file, state.item?.bannerImagePath)
      .then((response) => {
        setState((prev: any) => ({
          ...prev,
          item: {
            ...prev.item,
            bannerImagePath: response.filePath,
          },
        }));
      })
      .catch(() => {
        setBannerUploadError('Unable to upload clinic banner.');
      })
      .finally(() => {
        setIsUploadingBanner(false);
      });
  };

  const handleToggleWorkingDay = (field: (typeof workingDayOptions)[number]['field']): void => {
    setState((prev: any) => {
      return {
        ...prev,
        item: {
          ...prev.item,
          [field]: !Boolean(prev.item?.[field]),
        },
      };
    });
  };

  const handleScheduleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setState((prev: any) => ({
      ...prev,
      item: {
        ...prev.item,
        [name]: value,
      },
    }));
  };

  const persistClinicProfile = async (shouldLogoutAfterSave: boolean): Promise<void> => {
    setStatusMessage('');
    setSubmitError('');

    try {
      const request = {
        id: state.item?.id,
        clinicName: state.item?.clinicName?.trim() || '',
        bannerImagePath: state.item?.bannerImagePath?.trim() || '',
        qrCodeValue: state.item?.qrCodeValue?.trim() || state.item?.id?.trim() || '',
        address: state.item?.address?.trim() || '',
        emailAddress: state.item?.emailAddress?.trim() || '',
        contactNumber: state.item?.contactNumber?.trim() || '',
        isDataPrivacyAccepted: Boolean(state.item?.isDataPrivacyAccepted),
        forBetaTestingAccepted: Boolean(state.item?.forBetaTestingAccepted),
        isContractPolicyAccepted: Boolean(state.item?.isContractPolicyAccepted),
        openingTime: state.item?.openingTime || '09:00',
        closingTime: state.item?.closingTime || '18:00',
        lunchStartTime: state.item?.lunchStartTime || '12:00',
        lunchEndTime: state.item?.lunchEndTime || '13:00',
        isMondayOpen: Boolean(state.item?.isMondayOpen),
        isTuesdayOpen: Boolean(state.item?.isTuesdayOpen),
        isWednesdayOpen: Boolean(state.item?.isWednesdayOpen),
        isThursdayOpen: Boolean(state.item?.isThursdayOpen),
        isFridayOpen: Boolean(state.item?.isFridayOpen),
        isSaturdayOpen: Boolean(state.item?.isSaturdayOpen),
        isSundayOpen: Boolean(state.item?.isSundayOpen),

        workingDays: workingDayOptions
          .filter(({ field }) => Boolean(state.item?.[field]))
          .map(({ label }) => label),
      };

      await HandleUpdateClinicProfile(request, state, setState);

      if (shouldLogoutAfterSave) {
        logout();
        navigate('/logout-success', { replace: true });
        return;
      }

      setStatusMessage('Clinic profile has been updated successfully.');
    } catch (error: any) {
      setSubmitError(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to update clinic profile.'
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextClinicName = state.item?.clinicName?.trim() || '';
    const hasClinicNameChanged =
      currentClinicName !== '' && nextClinicName !== '' && nextClinicName !== currentClinicName;

    if (hasClinicNameChanged) {
      setConfirmClinicNameDialogOpen(true);
      return;
    }

    await persistClinicProfile(false);
  };

  const handleConfirmClinicNameChange = async (): Promise<void> => {
    setConfirmClinicNameDialogOpen(false);
    await persistClinicProfile(true);
  };

  const bannerSrc = bannerPreviewUrl || resolveClinicBannerSrc(state.item?.bannerImagePath);
  const qrCodeValue = state.item?.qrCodeValue?.trim() || state.item?.id?.trim() || '';
  const registrationLink = qrCodeValue
    ? `${window.location.origin}/register-appointment?clinicId=${encodeURIComponent(qrCodeValue)}`
    : '';
  const isBranchAdmin = currentUserRole === 'branchadmin';

  if (isBranchAdmin) {
    return (
      <>
        <Alert severity="info" sx={{ mb: 2 }}>
          Clinic profile access for this account is limited to the branch assigned to you.
        </Alert>
        <ClinicBranchManagement
          clinicId={state.item?.id ?? state.clinicProfileId}
          mode="assigned-branch"
        />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.dualPanelGrid}>
        <section className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <div className={styles.formPanelIcon} aria-hidden="true">
              <BusinessRoundedIcon />
            </div>
            <div>
              <h3 className={styles.formPanelTitle}>Clinic Profile</h3>
              <p className={styles.formPanelDescription}>
                Update the clinic information based on the current `ClinicProfiles` entity.
              </p>
            </div>
          </div>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Clinic Name"
                name="clinicName"
                value={state.item?.clinicName ?? ''}
                onChange={handleFieldChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                name="address"
                value={state.item?.address ?? ''}
                onChange={handleFieldChange}
                fullWidth
                size="small"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email Address"
                name="emailAddress"
                type="email"
                value={state.item?.emailAddress ?? ''}
                onChange={handleFieldChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Contact Number"
                name="contactNumber"
                value={state.item?.contactNumber ?? ''}
                onChange={handleFieldChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box className={styles.inlineCheckboxCard}>
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(state.item?.isDataPrivacyAccepted)} disabled />
                  }
                  label="Data privacy consent already accepted"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box className={styles.inlineCheckboxCard}>
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(state.item?.isContractPolicyAccepted)} disabled />
                  }
                  label="Contract Policy consent already accepted"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box className={styles.inlineCheckboxCard}>
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(state.item?.forBetaTestingAccepted)} disabled />
                  }
                  label="Data Beta testing already accepted"
                />
              </Box>
            </Grid>
          </Grid>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <div className={styles.formPanelIcon} aria-hidden="true">
              <ScheduleRoundedIcon />
            </div>
            <div>
              <h3 className={styles.formPanelTitle}>Clinic Schedule</h3>
              <p className={styles.formPanelDescription}>
                Configure working days and clinic operating hours for this branch.
              </p>
            </div>
          </div>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <div className={styles.daySelectorGroup}>
                {workingDayOptions.map(({ label, field }) => {
                  const isActive = Boolean(state.item?.[field]);

                  return (
                    <button
                      key={label}
                      type="button"
                      className={`${styles.dayChipButton} ${
                        isActive ? styles.dayChipButtonActive : ''
                      }`}
                      onClick={() => handleToggleWorkingDay(field)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Opening Time"
                name="openingTime"
                type="time"
                value={state.item?.openingTime ?? '09:00'}
                onChange={handleScheduleFieldChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Closing Time"
                name="closingTime"
                type="time"
                value={state.item?.closingTime ?? '18:00'}
                onChange={handleScheduleFieldChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Lunch Start"
                name="lunchStartTime"
                type="time"
                value={state.item?.lunchStartTime ?? '12:00'}
                onChange={handleScheduleFieldChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Lunch End"
                name="lunchEndTime"
                type="time"
                value={state.item?.lunchEndTime ?? '13:00'}
                onChange={handleScheduleFieldChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box className={styles.mediaCard}>
                <Box
                  className={styles.bannerPreview}
                  sx={
                    bannerSrc
                      ? {
                          backgroundImage: `linear-gradient(rgba(18, 42, 64, 0.18), rgba(18, 42, 64, 0.18)), url(${bannerSrc})`,
                        }
                      : undefined
                  }
                >
                  {bannerSrc ? null : (
                    <Typography className={styles.bannerPreviewPlaceholder}>
                      Uploading of Clinic Banner
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography className={styles.mediaCardTitle}>Clinic Banner</Typography>
                  <Typography className={styles.mediaCardText}>
                    Upload a branch banner image for the clinic profile. Supported formats: JPG,
                    PNG, GIF, WEBP.
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadOutlinedIcon />}
                  >
                    Upload Banner
                    <input hidden accept="image/*" type="file" onChange={handleBannerChange} />
                  </Button>
                  <Typography variant="caption" className={styles.mediaCardCaption}>
                    {isUploadingBanner
                      ? 'Uploading banner...'
                      : selectedBannerFileName ||
                        state.item?.bannerImagePath ||
                        'No banner selected yet'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box className={`${styles.mediaCard} ${styles.qrCard}`}>
                <Box className={styles.qrCardHeader}>
                  <QrCode2RoundedIcon sx={{ color: '#2f6db3' }} />
                  <Typography className={styles.mediaCardTitle}>QR Code</Typography>
                </Box>
                <Box className={styles.qrCanvas}>
                  {qrCodeValue ? (
                    <QRCodeSVG value={registrationLink} size={156} includeMargin />
                  ) : (
                    <Typography className={styles.bannerPreviewPlaceholder}>QR Code</Typography>
                  )}
                </Box>
                {registrationLink ? (
                  <Button
                    component="a"
                    href={registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    fullWidth
                  >
                    Open Registration Form
                  </Button>
                ) : null}
              </Box>
            </Grid>
          </Grid>
        </section>
      </div>

      <ClinicBranchManagement clinicId={state.item?.id ?? state.clinicProfileId} />

      <div className={styles.formActions}>
        {bannerUploadError ? (
          <Alert severity="error" sx={{ flex: 1, minWidth: 0 }}>
            {bannerUploadError}
          </Alert>
        ) : null}
        {submitError ? (
          <Alert severity="error" sx={{ flex: 1, minWidth: 0 }}>
            {submitError}
          </Alert>
        ) : null}
        {statusMessage ? (
          <Alert severity="info" sx={{ flex: 1, minWidth: 0 }}>
            {statusMessage}
          </Alert>
        ) : null}
        <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />}>
          Save Changes
        </Button>
      </div>

      <Dialog
        open={confirmClinicNameDialogOpen}
        onClose={() => setConfirmClinicNameDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#16324f' }}>
          Confirm Clinic Name Change
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff8e1',
                color: '#f57c00',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#415c74', lineHeight: 1.6 }}>
                You changed the clinic name from the current side navigation value.
              </Typography>
              <Typography sx={{ color: '#415c74', lineHeight: 1.6, mt: 1 }}>
                After saving this change, your account will be logged out and you will need to sign
                in again.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setConfirmClinicNameDialogOpen(false)}
            color="inherit"
            variant="text"
            sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirmClinicNameChange()}
            variant="contained"
            color="warning"
            sx={{ borderRadius: '10px', px: 2.25, textTransform: 'none', fontWeight: 700 }}
          >
            Save And Logout
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
};

export default ClinicProfileForm;
