import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
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
  Typography,
} from '@mui/material';
import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../../common/services/api-client';
import { RegisterPrefix } from '../../../register/api/types';
import { UploadEmployeeProfilePicture } from '../api/api';
import {
  EmployeeFormValues,
  EmployeeRole,
  EmployeeStateProps,
  EMPLOYEE_PREFIX_OPTIONS,
  EMPLOYEE_ROLE_OPTIONS,
} from '../api/types';

type EmployeeFormProps = EmployeeStateProps & {
  submitError: string;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onClearMessages: () => void;
};

const createInitialValues = (): EmployeeFormValues => ({
  id: undefined,
  profilePicture: '',
  emailAddress: '',
  firstName: '',
  preffix: RegisterPrefix.None,
  role: EmployeeRole.None,
  lastName: '',
  middleName: '',
  contactNumber: '',
  address: '',
});

const resolveProfilePictureSrc = (profilePicture?: string): string => {
  if (!profilePicture?.trim()) {
    return '';
  }

  return resolveApiAssetUrl(profilePicture);
};

const toFormValues = (
  isUpdate: boolean,
  values?: Partial<EmployeeFormValues> | null
): EmployeeFormValues =>
  isUpdate
    ? {
        id: values?.id,
        profilePicture: values?.profilePicture || '',
        emailAddress: values?.emailAddress || '',
        firstName: values?.firstName || '',
        preffix: values?.preffix ?? RegisterPrefix.None,
        role: values?.role ?? EmployeeRole.None,
        lastName: values?.lastName || '',
        middleName: values?.middleName || '',
        contactNumber: values?.contactNumber || '',
        address: values?.address || '',
      }
    : createInitialValues();

const EmployeeForm: FunctionComponent<EmployeeFormProps> = (
  props: EmployeeFormProps
): JSX.Element => {
  const { state, submitError, onClose, onSubmit, onClearMessages } = props;
  const [formValues, setFormValues] = useState<EmployeeFormValues>(createInitialValues);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [storedImageUrl, setStoredImageUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setFormValues(
      toFormValues(state.isUpdate, {
        id: state.selectedItem?.id,
        profilePicture: state.selectedItem?.profilePicture,
        emailAddress: state.selectedItem?.emailAddress,
        firstName: state.selectedItem?.firstName,
        preffix: state.selectedItem?.preffix,
        role: state.selectedItem?.role,
        lastName: state.selectedItem?.lastName,
        middleName: state.selectedItem?.middleName,
        contactNumber: state.selectedItem?.contactNumber,
        address: state.selectedItem?.address,
      })
    );
  }, [
    state.isUpdate,
    state.openModal,
    state.selectedItem?.address,
    state.selectedItem?.contactNumber,
    state.selectedItem?.emailAddress,
    state.selectedItem?.firstName,
    state.selectedItem?.id,
    state.selectedItem?.lastName,
    state.selectedItem?.middleName,
    state.selectedItem?.preffix,
    state.selectedItem?.profilePicture,
    state.selectedItem?.role,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (storedImageUrl) {
        URL.revokeObjectURL(storedImageUrl);
      }
    };
  }, [previewUrl, storedImageUrl]);

  useEffect(() => {
    setSelectedFileName('');
    setUploadError('');
    setIsUploadingPicture(false);
    setPreviewUrl((previousValue) => {
      if (previousValue) {
        URL.revokeObjectURL(previousValue);
      }

      return '';
    });
  }, [state.openModal, state.isUpdate, state.selectedItem?.id]);

  useEffect(() => {
    let isActive = true;
    const profilePicture = state.isUpdate ? state.selectedItem?.profilePicture : '';

    if (!profilePicture?.trim() || !isProtectedStoragePath(profilePicture)) {
      setStoredImageUrl((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return '';
      });

      return;
    }

    void loadProtectedAssetObjectUrl(profilePicture)
      .then((objectUrl) => {
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setStoredImageUrl((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return objectUrl;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setStoredImageUrl((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return '';
        });
      });

    return () => {
      isActive = false;
    };
  }, [state.isUpdate, state.selectedItem?.profilePicture]);

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Edit Employee' : 'Create Employee'),
    [state.isUpdate]
  );

  const handleFieldChange = (
    field: keyof EmployeeFormValues,
    value: string | RegisterPrefix | EmployeeRole
  ): void => {
    onClearMessages();
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return Promise.resolve();
    }

    setPreviewUrl((previousValue) => {
      if (previousValue) {
        URL.revokeObjectURL(previousValue);
      }

      return URL.createObjectURL(file);
    });
    setSelectedFileName(file.name);
    setUploadError('');
    setIsUploadingPicture(true);

    return UploadEmployeeProfilePicture(file, formValues.profilePicture)
      .then((response) => {
        handleFieldChange('profilePicture', response.filePath);
      })
      .catch(() => {
        handleFieldChange('profilePicture', '');
        setUploadError('Unable to upload picture.');
      })
      .finally(() => {
        setIsUploadingPicture(false);
      });
  };

  const imageSrc =
    previewUrl ||
    storedImageUrl ||
    (!isProtectedStoragePath(formValues.profilePicture)
      ? resolveProfilePictureSrc(formValues.profilePicture)
      : '');

  return (
    <>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}
        {uploadError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="First Name"
              value={formValues.firstName}
              onChange={(event) => handleFieldChange('firstName', event.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Last Name"
              value={formValues.lastName}
              onChange={(event) => handleFieldChange('lastName', event.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Middle Name"
              value={formValues.middleName}
              onChange={(event) => handleFieldChange('middleName', event.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Prefix"
              select
              value={formValues.preffix}
              onChange={(event) => handleFieldChange('preffix', Number(event.target.value))}
              fullWidth
              size="small"
            >
              {EMPLOYEE_PREFIX_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Role"
              select
              value={formValues.role}
              onChange={(event) => handleFieldChange('role', Number(event.target.value))}
              fullWidth
              size="small"
              required
            >
              {EMPLOYEE_ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Email Address"
              type="email"
              value={formValues.emailAddress}
              onChange={(event) => handleFieldChange('emailAddress', event.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Contact Number"
              value={formValues.contactNumber}
              onChange={(event) => handleFieldChange('contactNumber', event.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                p: 2,
                border: '1px dashed rgba(22, 119, 168, 0.35)',
                borderRadius: 2,
                backgroundColor: 'rgba(22, 119, 168, 0.03)',
              }}
            >
              <Box
                sx={{
                  width: 108,
                  height: 108,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  background: imageSrc
                    ? `url(${imageSrc}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #f2f8fc 0%, #e4f0f8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Employee preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                {!imageSrc ? (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textAlign: 'center', px: 1.5 }}
                  >
                    Picture Preview
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Employee Picture
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Add a profile picture for the employee. Supported formats: JPG, PNG, GIF.
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon />}
                >
                  Upload Picture
                  <input hidden accept="image/*" type="file" onChange={handleImageChange} />
                </Button>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
                >
                  {isUploadingPicture
                    ? 'Uploading picture...'
                    : selectedFileName ||
                      formValues.profilePicture ||
                      'No image selected yet'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Address"
              value={formValues.address}
              onChange={(event) => handleFieldChange('address', event.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void onSubmit(formValues)}
          disabled={isUploadingPicture}
        >
          {state.isUpdate ? 'Update Employee' : 'Save Employee'}
        </Button>
      </DialogActions>
    </>
  );
};

export default EmployeeForm;
