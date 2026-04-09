import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { isAxiosError } from 'axios';

import { getApiBaseUrl } from '../../../common/services/api-client';
import { useAuthStore } from '../../../common/store/authStore';
import {
  HandleCreateClinicBranch,
  HandleDeleteClinicBranch,
  HandleGetClinicBranches,
  HandleUpdateClinicBranch,
} from '../clinic-branch/api/handlers';
import {
  ClinicBranchFormValues,
  ClinicBranchModel,
  ClinicBranchStateModel,
} from '../clinic-branch/api/types';
import { UploadClinicBranchBanner } from '../clinic-branch/api/api';
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

const createDefaultFormValues = (): ClinicBranchFormValues => ({
  name: '',
  code: '',
  bannerImagePath: '',
  address: '',
  emailAddress: '',
  contactNumber: '',
  openingTime: '09:00',
  closingTime: '18:00',
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
  isMondayOpen: true,
  isTuesdayOpen: true,
  isWednesdayOpen: true,
  isThursdayOpen: true,
  isFridayOpen: true,
  isSaturdayOpen: false,
  isSundayOpen: false,
  isMainBranch: false,
  isActive: true,
});

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

type ClinicBranchManagementProps = {
  clinicId?: string | null;
  mode?: 'all-branches' | 'assigned-branch';
};

const ClinicBranchManagement: FunctionComponent<ClinicBranchManagementProps> = ({
  clinicId,
  mode = 'all-branches',
}: ClinicBranchManagementProps): JSX.Element => {
  const assignedBranchName = useAuthStore((store) => store.user?.defaultBranchName?.trim() || '');
  const [state, setState] = useState<ClinicBranchStateModel>({
    items: [],
    selectedItem: null,
    load: true,
    totalItem: 0,
    clinicId,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
  const [formValues, setFormValues] = useState<ClinicBranchFormValues>(createDefaultFormValues());
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [selectedBannerFileName, setSelectedBannerFileName] = useState('');
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const isAssignedBranchMode = mode === 'assigned-branch';
  const sectionTitle = isAssignedBranchMode ? 'Assigned Branch Profile' : 'Clinic Branches';
  const sectionDescription = isAssignedBranchMode
    ? 'View and update the branch assigned to your account. Branch creation and deletion are not available for Branch Admin.'
    : 'Create and manage the branches under this clinic. Branch contact details, working days, schedule, and banner are maintained here.';

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      clinicId,
    }));
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId?.trim()) {
      setState((prev) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
        selectedItem: null,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      load: true,
    }));

    void HandleGetClinicBranches(
      {
        ...state,
        load: true,
        clinicId,
      },
      setState,
      clinicId
    ).catch(() => {
      setState((prev) => ({
        ...prev,
        load: false,
      }));
    });
    // Fetch only when the resolved clinic changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  const sortedItems = useMemo(
    () =>
      [...state.items].sort((leftItem, rightItem) => {
        if (leftItem.isMainBranch && !rightItem.isMainBranch) return -1;
        if (!leftItem.isMainBranch && rightItem.isMainBranch) return 1;
        return (leftItem.name || '').localeCompare(rightItem.name || '');
      }),
    [state.items]
  );

  const clearMessages = (): void => {
    setStatusMessage('');
    setSubmitError('');
    setBannerUploadError('');
  };

  const closeDialog = (): void => {
    clearMessages();
    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
      setBannerPreviewUrl('');
    }
    setSelectedBannerFileName('');
    setState((prev) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
    setFormValues(createDefaultFormValues());
  };

  const openCreateDialog = (): void => {
    clearMessages();
    setFormValues(createDefaultFormValues());
    setSelectedBannerFileName('');
    setState((prev) => ({
      ...prev,
      selectedItem: null,
      openModal: true,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const openEditDialog = (item: ClinicBranchModel): void => {
    clearMessages();
    setSelectedBannerFileName('');
    setFormValues({
      id: item.id,
      name: item.name || '',
      code: item.code || '',
      bannerImagePath: item.bannerImagePath || '',
      address: item.address || '',
      emailAddress: item.emailAddress || '',
      contactNumber: item.contactNumber || '',
      openingTime: item.openingTime || '09:00',
      closingTime: item.closingTime || '18:00',
      lunchStartTime: item.lunchStartTime || '12:00',
      lunchEndTime: item.lunchEndTime || '13:00',
      isMondayOpen: Boolean(item.isMondayOpen),
      isTuesdayOpen: Boolean(item.isTuesdayOpen),
      isWednesdayOpen: Boolean(item.isWednesdayOpen),
      isThursdayOpen: Boolean(item.isThursdayOpen),
      isFridayOpen: Boolean(item.isFridayOpen),
      isSaturdayOpen: Boolean(item.isSaturdayOpen),
      isSundayOpen: Boolean(item.isSundayOpen),
      isMainBranch: Boolean(item.isMainBranch),
      isActive: item.isActive ?? true,
    });
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: true,
      isDelete: false,
    }));
  };

  const openDeleteDialog = (item: ClinicBranchModel): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: false,
      isDelete: true,
    }));
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearMessages();
  };

  const handleToggleWorkingDay = (field: (typeof workingDayOptions)[number]['field']): void => {
    setFormValues((prev) => ({
      ...prev,
      [field]: !Boolean(prev[field]),
    }));
    clearMessages();
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: checked,
    }));
    clearMessages();
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
    setIsUploadingBanner(true);

    return UploadClinicBranchBanner(file, formValues.bannerImagePath)
      .then((response) => {
        setFormValues((prev) => ({
          ...prev,
          bannerImagePath: response.filePath,
        }));
      })
      .catch(() => {
        setBannerUploadError('Unable to upload branch banner.');
      })
      .finally(() => {
        setIsUploadingBanner(false);
        if (event.target) {
          event.target.value = '';
        }
      });
  };

  const handleSubmit = async (): Promise<void> => {
    clearMessages();

    if (isAssignedBranchMode && !state.isUpdate) {
      setSubmitError('Branch creation is not available for this account.');
      return;
    }

    if (!formValues.name.trim()) {
      setSubmitError('Branch name is required.');
      return;
    }

    const request: ClinicBranchFormValues = {
      ...formValues,
      name: formValues.name.trim(),
      code: formValues.code.trim(),
      bannerImagePath: formValues.bannerImagePath.trim(),
      address: formValues.address.trim(),
      emailAddress: formValues.emailAddress.trim(),
      contactNumber: formValues.contactNumber.trim(),
    };

    try {
      if (state.isUpdate && request.id) {
        await HandleUpdateClinicBranch(request, setState);
        setStatusMessage('Clinic branch has been updated successfully.');
      } else {
        await HandleCreateClinicBranch(request, setState);
        setStatusMessage('Clinic branch has been created successfully.');
      }

      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
        setBannerPreviewUrl('');
      }

      setSelectedBannerFileName('');
      setFormValues(createDefaultFormValues());
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update clinic branch.' : 'Unable to create clinic branch.'
        );
      }
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem?.id) {
      return;
    }

    clearMessages();

    try {
      await HandleDeleteClinicBranch(state.selectedItem.id, state, setState);
      setStatusMessage('Clinic branch has been deleted successfully.');
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError('Unable to delete clinic branch.');
      }
    }
  };

  const dialogBannerSrc = bannerPreviewUrl || resolveClinicBannerSrc(formValues.bannerImagePath);

  return (
    <>
      <section className={styles.formPanel} style={{ marginTop: 20 }}>
        <div className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <StorefrontRoundedIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className={styles.formPanelTitle}>{sectionTitle}</h3>
            <p className={styles.formPanelDescription}>{sectionDescription}</p>
          </div>
          {!isAssignedBranchMode ? (
            <Button
              type="button"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              className={styles.moduleActionButton}
              onClick={openCreateDialog}
            >
              Add Branch
            </Button>
          ) : null}
        </div>

        {isAssignedBranchMode ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {assignedBranchName
              ? `You can only manage your assigned branch: ${assignedBranchName}.`
              : 'You can only manage the branch assigned to your account.'}
          </Alert>
        ) : null}

        {statusMessage ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {statusMessage}
          </Alert>
        ) : null}

        {submitError && !state.openModal ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        {!clinicId?.trim() ? (
          <div className={styles.emptyMiniState}>
            <Typography className={styles.emptyMiniTitle}>Clinic Profile Required</Typography>
            <Typography className={styles.emptyMiniText}>
              Save or load the clinic profile first before managing branch records.
            </Typography>
          </div>
        ) : null}

        {clinicId?.trim() && !state.load && sortedItems.length === 0 ? (
          <div className={styles.emptyMiniState}>
            <Typography className={styles.emptyMiniTitle}>
              {isAssignedBranchMode ? 'Assigned Branch Not Found' : 'No Branches Yet'}
            </Typography>
            <Typography className={styles.emptyMiniText}>
              {isAssignedBranchMode
                ? 'No branch record is currently available for your assigned branch.'
                : 'Add the main branch and any additional clinic locations from this panel.'}
            </Typography>
          </div>
        ) : null}

        {sortedItems.length > 0 ? (
          <div className={styles.userListSurface}>
            {sortedItems.map((item) => (
              <div
                key={item.id || `${item.name}-${item.code}`}
                className={`${styles.userListCard} ${
                  state.selectedItem?.id === item.id ? styles.userListCardActive : ''
                }`}
              >
                <div className={styles.userListRow}>
                  <div className={styles.userListIdentity}>
                    <div className={styles.userListAvatar}>
                      <StorefrontRoundedIcon />
                    </div>
                    <div className={styles.userListContent}>
                      <Typography className={styles.userListName}>
                        {item.name || 'Unnamed Branch'}
                      </Typography>
                      <Typography className={styles.userListMeta}>
                        {[
                          item.code?.trim() ? `Code: ${item.code}` : 'No branch code',
                          item.isMainBranch ? 'Main Branch' : '',
                          item.isActive === false ? 'Inactive' : '',
                        ]
                          .filter(Boolean)
                          .join(' | ')}
                      </Typography>
                      <Typography className={styles.userListEmail}>
                        {item.address?.trim() || 'No branch address'}
                      </Typography>
                      <Typography className={styles.userListEmail}>
                        {[item.contactNumber, item.emailAddress].filter(Boolean).join(' | ') ||
                          'No contact details'}
                      </Typography>
                      <Typography className={styles.userListEmail}>
                        {`${item.openingTime || '09:00'} - ${item.closingTime || '18:00'} | Lunch ${
                          item.lunchStartTime || '12:00'
                        } - ${item.lunchEndTime || '13:00'}`}
                      </Typography>
                    </div>
                  </div>
                  <div className={styles.userListActions}>
                    {item.isMainBranch ? (
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        startIcon={<StarRoundedIcon />}
                        sx={{
                          minWidth: 'auto',
                          px: 1.25,
                          color: '#b07b00',
                          fontWeight: 700,
                        }}
                      >
                        Main
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outlined"
                      className={styles.userListActionButton}
                      onClick={() => openEditDialog(item)}
                    >
                      <EditRoundedIcon />
                    </Button>
                    {!isAssignedBranchMode ? (
                      <Button
                        type="button"
                        variant="outlined"
                        className={`${styles.userListActionButton} ${styles.userListDeleteButton}`}
                        onClick={() => openDeleteDialog(item)}
                      >
                        <DeleteRoundedIcon />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <Dialog
        open={state.openModal}
        onClose={closeDialog}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <>
            <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#16324f' }}>
              Delete Branch
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ color: '#415c74', lineHeight: 1.7 }}>
                Delete <strong>{state.selectedItem?.name || 'this branch'}</strong>? This action is
                a soft delete on the backend and may be blocked if the branch already has linked
                users or transactions.
              </Typography>
              {submitError ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {submitError}
                </Alert>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button type="button" onClick={closeDialog} color="inherit">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleDelete()}
                color="error"
                variant="contained"
              >
                Delete Branch
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#16324f' }}>
              {state.isUpdate
                ? isAssignedBranchMode
                  ? 'Update Assigned Branch'
                  : 'Edit Branch'
                : 'Create Branch'}
            </DialogTitle>
            <DialogContent dividers>
              {submitError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              ) : null}
              {bannerUploadError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {bannerUploadError}
                </Alert>
              ) : null}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        label="Branch Name"
                        name="name"
                        value={formValues.name}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Branch Code"
                        name="code"
                        value={formValues.code}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Address"
                        name="address"
                        value={formValues.address}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                        multiline
                        minRows={3}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email Address"
                        name="emailAddress"
                        value={formValues.emailAddress}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Contact Number"
                        name="contactNumber"
                        value={formValues.contactNumber}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <div className={styles.daySelectorGroup}>
                        {workingDayOptions.map(({ label, field }) => {
                          const isActive = Boolean(formValues[field]);

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
                        value={formValues.openingTime}
                        onChange={handleFieldChange}
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
                        value={formValues.closingTime}
                        onChange={handleFieldChange}
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
                        value={formValues.lunchStartTime}
                        onChange={handleFieldChange}
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
                        value={formValues.lunchEndTime}
                        onChange={handleFieldChange}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    {!isAssignedBranchMode ? (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box className={styles.inlineCheckboxCard}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isMainBranch"
                                checked={formValues.isMainBranch}
                                onChange={handleCheckboxChange}
                              />
                            }
                            label="Set as main branch"
                          />
                        </Box>
                      </Grid>
                    ) : null}
                    {!isAssignedBranchMode ? (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box className={styles.inlineCheckboxCard}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isActive"
                                checked={formValues.isActive}
                                onChange={handleCheckboxChange}
                              />
                            }
                            label="Branch is active"
                          />
                        </Box>
                      </Grid>
                    ) : null}
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box className={styles.mediaCard}>
                    <Box
                      className={styles.bannerPreview}
                      sx={
                        dialogBannerSrc
                          ? {
                              backgroundImage: `linear-gradient(rgba(18, 42, 64, 0.18), rgba(18, 42, 64, 0.18)), url(${dialogBannerSrc})`,
                            }
                          : undefined
                      }
                    >
                      {dialogBannerSrc ? null : (
                        <Typography className={styles.bannerPreviewPlaceholder}>
                          Branch banner preview
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography className={styles.mediaCardTitle}>Branch Banner</Typography>
                      <Typography className={styles.mediaCardText}>
                        Upload a branch-specific banner image that will represent this location in
                        the clinic settings.
                      </Typography>
                      <input
                        ref={bannerInputRef}
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleBannerChange}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<CloudUploadOutlinedIcon />}
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        Upload Banner
                      </Button>
                      <Typography variant="caption" className={styles.mediaCardCaption}>
                        {isUploadingBanner
                          ? 'Uploading banner...'
                          : selectedBannerFileName ||
                            formValues.bannerImagePath ||
                            'No banner selected yet'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button type="button" onClick={closeDialog} color="inherit">
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} variant="contained">
                {state.isUpdate ? 'Save Branch' : 'Create Branch'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default ClinicBranchManagement;
