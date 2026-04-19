import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
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
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { HandleUpdatePatientProfile } from '../api/handlers';
import { PatientProfileModel, PatientProfileStateProps } from '../api/types';
import { UploadPatientProfilePicture } from '../../patient/api/api';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../common/services/api-client';

const resolveProfilePictureSrc = (profilePicture?: string): string => {
  if (!profilePicture?.trim()) {
    return '';
  }

  return resolveApiAssetUrl(profilePicture);
};

type PatientProfileFormValues = {
  id: string;
  patientNumber: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
  middleName: string;
  emailAddress: string;
  birthDate: string;
  contactNumber: string;
  address: string;
  gender: string;
  occupation: string;
  religion: string;
  civilStatus: string;
};

const genderOptions = ['', 'Male', 'Female', 'Other'];
const civilStatusOptions = ['None', 'Single', 'Married', 'Divorced', 'Widowed'];

const normalizeCivilStatusValue = (value?: string | number | null): string => {
  const normalizedValue = String(value ?? '').trim();

  switch (normalizedValue.toLowerCase()) {
    case '0':
    case 'none':
      return 'None';
    case '1':
    case 'single':
      return 'Single';
    case '2':
    case 'married':
      return 'Married';
    case '3':
    case 'divorced':
      return 'Divorced';
    case '4':
    case 'widowed':
      return 'Widowed';
    default:
      return normalizedValue;
  }
};

const createInitialValues = (
  selectedItem?: PatientProfileModel | null
): PatientProfileFormValues => ({
  id: selectedItem?.id || '',
  patientNumber: selectedItem?.patientNumber || '',
  profilePicture: selectedItem?.profilePicture || '',
  firstName: selectedItem?.firstName || '',
  lastName: selectedItem?.lastName || '',
  middleName: selectedItem?.middleName || '',
  emailAddress: selectedItem?.emailAddress || '',
  birthDate: selectedItem?.birthDate
    ? new Date(selectedItem.birthDate).toISOString().split('T')[0]
    : '',
  contactNumber: selectedItem?.contactNumber || '',
  address: selectedItem?.address || '',
  gender: selectedItem?.gender || '',
  occupation: selectedItem?.occupation || '',
  religion: selectedItem?.religion || '',
  civilStatus: normalizeCivilStatusValue(selectedItem?.civilStatus),
});

const PatientProfileForm: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [storedImageUrl, setStoredImageUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const dialogTitle = useMemo(() => 'Update Patient Record', []);
  const currentProfilePicture = useMemo(
    () => (state.selectedItem ?? state.profile)?.profilePicture,
    [state.profile, state.selectedItem]
  );

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
    let isActive = true;
    const profilePicture = currentProfilePicture;

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
  }, [currentProfilePicture]);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: string) => void
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return Promise.resolve();
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
    setUploadError('');
    setIsUploadingPicture(true);

    return UploadPatientProfilePicture(file)
      .then((response) => {
        setFieldValue('profilePicture', response.filePath);
      })
      .catch(() => {
        setFieldValue('profilePicture', '');
        setUploadError('Unable to upload picture.');
      })
      .finally(() => {
        setIsUploadingPicture(false);
      });
  };

  const handleClose = (): void => {
    setState((prev: any) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  const handleSubmit = async (values: PatientProfileFormValues): Promise<void> => {
    const payload: PatientProfileModel = {
      id: values.id || undefined,
      patientNumber: values.patientNumber.trim(),
      profilePicture: values.profilePicture.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName.trim(),
      emailAddress: values.emailAddress.trim(),
      birthDate: values.birthDate ? new Date(values.birthDate) : undefined,
      contactNumber: values.contactNumber.trim(),
      address: values.address.trim(),
      gender: values.gender.trim(),
      occupation: values.occupation.trim(),
      religion: values.religion.trim(),
      civilStatus: normalizeCivilStatusValue(values.civilStatus),
    };

    await HandleUpdatePatientProfile(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={createInitialValues(state.selectedItem ?? state.profile)}
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
              setStatus('Unable to update patient record.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleSubmit,
          isSubmitting,
          status,
          setFieldValue,
        }): JSX.Element => (
          <>
            {(() => {
              const imageSrc =
                previewUrl ||
                storedImageUrl ||
                (!isProtectedStoragePath(values.profilePicture)
                  ? resolveProfilePictureSrc(values.profilePicture)
                  : '');

              return (
                <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
                    {status ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {status}
                      </Alert>
                    ) : null}
                    {uploadError ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {uploadError}
                      </Alert>
                    ) : null}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Patient Number"
                          name="patientNumber"
                          value={values.patientNumber}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="First Name"
                          name="firstName"
                          value={values.firstName}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Last Name"
                          name="lastName"
                          value={values.lastName}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Middle Name"
                          name="middleName"
                          value={values.middleName}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Birth Date"
                          name="birthDate"
                          type="date"
                          value={values.birthDate}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Contact Number"
                          name="contactNumber"
                          value={values.contactNumber}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          select
                          label="Gender"
                          name="gender"
                          value={values.gender}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        >
                          {genderOptions.map((option) => (
                            <MenuItem key={option || 'blank'} value={option}>
                              {option || 'Select gender'}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Email Address"
                          name="emailAddress"
                          type="email"
                          value={values.emailAddress}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          select
                          label="Civil Status"
                          name="civilStatus"
                          value={values.civilStatus}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        >
                          {civilStatusOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Occupation"
                          name="occupation"
                          value={values.occupation}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          label="Religion"
                          name="religion"
                          value={values.religion}
                          onChange={handleChange}
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
                                alt="Patient preview"
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
                              Patient Picture
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                              Select a patient image to preview before saving the profile changes.
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUploadOutlinedIcon />}
                            >
                              Upload Picture
                              <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={async (event) => {
                                  await handleImageChange(event, setFieldValue);
                                }}
                              />
                            </Button>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
                            >
                              {isUploadingPicture
                                ? 'Uploading picture...'
                                : selectedFileName ||
                                  values.profilePicture ||
                                  'No image selected yet'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      {/* <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Profile Picture Path"
                      name="profilePicture"
                      value={values.profilePicture}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </Grid> */}
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Address"
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          multiline
                          minRows={3}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
              );
            })()}
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={() => handleSubmit()}
                variant="contained"
                disabled={isSubmitting || !values.firstName.trim() || !values.lastName.trim()}
              >
                Update
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientProfileForm;
