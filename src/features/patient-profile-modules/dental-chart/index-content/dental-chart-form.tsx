import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import { Odontogram, ToothDetail } from 'react-odontogram';

import localStyles from '../style.scss.module.scss';
import {
  DENTAL_CHART_CONDITION_OPTIONS,
  DENTAL_CHART_SURFACE_OPTIONS,
  DentalChartCondition,
  DentalChartSurface,
  PatientDentalChartImageModel,
  PatientDentalChartModel,
  PatientDentalChartStateProps,
  getToothDisplayLabel,
  getToothIdFromToothNumber,
  getToothNumberFromToothId,
} from '../api/types';
import { UploadPatientDentalChartImage } from '../api/api';
import {
  HandleCreatePatientDentalChartItem,
  HandleUpdatePatientDentalChartItem,
} from '../api/handlers';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../../common/services/api-client';

type PatientDentalChartFormProps = PatientDentalChartStateProps & {
  patientLabel?: string;
};

type PatientDentalChartFormValues = {
  id: string;
  toothId: string;
  condition: DentalChartCondition | '';
  remarks: string;
  surfaces: DentalChartSurface[];
  images: PatientDentalChartImageModel[];
};

const createInitialValues = (
  selectedItem?: PatientDentalChartModel,
  selectedToothId?: string
): PatientDentalChartFormValues => ({
  id: selectedItem?.id || '',
  toothId: getToothIdFromToothNumber(selectedItem?.toothNumber) || selectedToothId || '',
  condition: selectedItem?.condition || '',
  remarks: selectedItem?.remarks || '',
  surfaces: (selectedItem?.surfaces || [])
    .map((surface) => surface.surface)
    .filter(Boolean) as DentalChartSurface[],
  images: [...(selectedItem?.images || [])]
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
    .slice(0, 3),
});

const PatientDentalChartForm: FunctionComponent<PatientDentalChartFormProps> = (
  props: PatientDentalChartFormProps
): JSX.Element => {
  const { state, setState, patientLabel } = props;
  const [imagePreviewMap, setImagePreviewMap] = useState<Record<string, string>>({});
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Dental Chart Item' : 'Add Dental Chart Item'),
    [state.isUpdate]
  );

  useEffect(() => {
    return () => {
      Object.values(imagePreviewMap).forEach((previewUrl) => {
        if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [imagePreviewMap]);

  useEffect(() => {
    let isActive = true;
    const images = state.selectedItem?.images || [];

    if (images.length === 0) {
      setImagePreviewMap((previousValue) => {
        Object.values(previousValue).forEach((previewUrl) => {
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
        });

        return {};
      });
      return;
    }

    void (async () => {
      const nextPreviewEntries = await Promise.all(
        images.map(async (image) => {
          const filePath = image.filePath?.trim();
          if (!filePath) {
            return undefined;
          }

          if (!isProtectedStoragePath(filePath)) {
            return [filePath, resolveApiAssetUrl(filePath)] as const;
          }

          try {
            const objectUrl = await loadProtectedAssetObjectUrl(filePath);
            return [filePath, objectUrl] as const;
          } catch {
            return [filePath, ''] as const;
          }
        })
      );

      if (!isActive) {
        nextPreviewEntries.forEach((entry) => {
          if (entry?.[1]?.startsWith('blob:')) {
            URL.revokeObjectURL(entry[1]);
          }
        });
        return;
      }

      setImagePreviewMap((previousValue) => {
        Object.values(previousValue).forEach((previewUrl) => {
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
        });

        return nextPreviewEntries
          .filter(Boolean)
          .reduce<Record<string, string>>((result, entry) => {
            result[entry![0]] = entry![1];
            return result;
          }, {});
      });
    })();

    return () => {
      isActive = false;
    };
  }, [state.selectedItem?.images]);

  const handleClose = (): void => {
    setSelectedFileName('');
    setUploadError('');
    setImagePreviewMap((previousValue) => {
      Object.values(previousValue).forEach((previewUrl) => {
        if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      return {};
    });
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmit = async (values: PatientDentalChartFormValues): Promise<void> => {
    const toothNumber = getToothNumberFromToothId(values.toothId);

    if (!toothNumber) {
      throw new Error('Please select a tooth from the chart.');
    }

    if (!values.condition) {
      throw new Error('Please select a tooth condition.');
    }

    const payload: PatientDentalChartModel = {
      id: values.id.trim() || undefined,
      patientInfoId: state.patientId,
      toothNumber,
      condition: values.condition,
      remarks: values.remarks.trim(),
      surfaces: values.surfaces.map((surface) => ({
        surface,
        teethSurfaceName: surface,
      })),
      images: values.images
        .slice(0, 3)
        .map((image, index) => ({
          ...image,
          displayOrder: index + 1,
          remarks: image.remarks?.trim() || '',
        })),
    };

    if (state.isUpdate) {
      await HandleUpdatePatientDentalChartItem(payload, state, setState);
      return;
    }

    await HandleCreatePatientDentalChartItem(payload, state, setState);
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    values: PatientDentalChartFormValues,
    setFieldValue: (field: string, value: PatientDentalChartImageModel[]) => void
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const toothNumber = getToothNumberFromToothId(values.toothId);
    if (!state.patientId || !toothNumber) {
      setUploadError('Please select a tooth before uploading images.');
      event.target.value = '';
      return;
    }

    if (values.images.length >= 3) {
      setUploadError('Only up to 3 images are allowed per tooth.');
      event.target.value = '';
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);
    setSelectedFileName(file.name);

    try {
      const response = await UploadPatientDentalChartImage(file, state.patientId, toothNumber);
      const previewUrl = URL.createObjectURL(file);
      const nextImages = [
        ...values.images,
        {
          fileName: response.fileName,
          originalFileName: response.originalFileName || file.name,
          filePath: response.filePath,
          fileType: 2,
          fileMediaType: file.type,
          fileExtension: `.${file.name.split('.').pop() || ''}`.replace(/\.$/, ''),
          displayOrder: values.images.length + 1,
          remarks: '',
        },
      ].slice(0, 3);

      setImagePreviewMap((previousValue) => ({
        ...previousValue,
        [response.filePath]: previewUrl,
      }));
      setUploadError('');
      setFieldValue('images', nextImages);
    } catch {
      setUploadError('Unable to upload tooth image.');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (
    filePath: string | undefined,
    values: PatientDentalChartFormValues,
    setFieldValue: (field: string, value: PatientDentalChartImageModel[]) => void
  ): void => {
    if (!filePath) {
      return;
    }

    setFieldValue(
      'images',
      values.images
        .filter((image) => image.filePath !== filePath)
        .map((image, index) => ({ ...image, displayOrder: index + 1 }))
    );

    setImagePreviewMap((previousValue) => {
      const nextValue = { ...previousValue };
      const previewUrl = nextValue[filePath];
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      delete nextValue[filePath];
      return nextValue;
    });
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem, state.selectedToothId)}
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
              setStatus('Unable to save dental chart item.');
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
          setFieldValue,
          isSubmitting,
        }): JSX.Element => (
          <>
            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <Box component="form" onSubmit={handleSubmit} className={localStyles.formSection}>
                    {status ? (
                      <Alert severity="error" sx={{ mb: 0 }}>
                        {status}
                      </Alert>
                    ) : null}
                    {uploadError ? (
                      <Alert severity="error" sx={{ mb: 0 }}>
                        {uploadError}
                      </Alert>
                    ) : null}

                <div className={localStyles.toothPickerCard}>
                  <div className={localStyles.toothPickerHeader}>
                    <div>
                      <h4 className={localStyles.toothPickerTitle}>Tooth Picker</h4>
                    </div>
                    <span className={localStyles.toothPickerValue}>
                      {getToothDisplayLabel(getToothNumberFromToothId(values.toothId))}
                    </span>
                  </div>
                  <div className={localStyles.toothPickerChart}>
                    <Odontogram
                      key={values.toothId || 'empty-tooth-selection'}
                      singleSelect
                      notation="Universal"
                      layout="square"
                      defaultSelected={values.toothId ? [values.toothId] : []}
                      onChange={(selectedTeeth: ToothDetail[]): void => {
                        const selectedTooth = selectedTeeth[selectedTeeth.length - 1];
                        setFieldValue('toothId', selectedTooth?.id || '');
                      }}
                      styles={{ minWidth: 1080 }}
                    />
                  </div>
                </div>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      label="Patient"
                      name="patient"
                      value={patientLabel || 'Selected patient'}
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label="Tooth"
                      name="tooth"
                      value={getToothDisplayLabel(getToothNumberFromToothId(values.toothId))}
                      fullWidth
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Condition"
                      name="condition"
                      value={values.condition}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      select
                      fullWidth
                      size="small"
                    >
                      <MenuItem value="">Select condition</MenuItem>
                      {DENTAL_CHART_CONDITION_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
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
                      placeholder="Example: Deep caries on mesial and occlusal surfaces."
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box className={localStyles.imageUploadSection}>
                      <Box className={localStyles.imageUploadHeader}>
                        <div>
                          <Typography variant="subtitle2" className={localStyles.imageUploadTitle}>
                            Tooth Images
                          </Typography>
                          <Typography variant="caption" className={localStyles.imageUploadText}>
                            Upload up to 3 images for this tooth.
                          </Typography>
                        </div>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadOutlinedIcon />}
                          disabled={isUploadingImage || values.images.length >= 3}
                        >
                          Upload Image
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            onChange={async (event) => {
                              await handleImageUpload(
                                event,
                                values,
                                (field, nextValue) => setFieldValue(field, nextValue)
                              );
                            }}
                          />
                        </Button>
                      </Box>
                      <Typography variant="caption" className={localStyles.imageUploadStatus}>
                        {isUploadingImage
                          ? 'Uploading image...'
                          : selectedFileName || `${values.images.length}/3 image slots used`}
                      </Typography>
                      <div className={localStyles.imageGrid}>
                        {values.images.map((image, index) => {
                          const previewSrc = image.filePath
                            ? imagePreviewMap[image.filePath] ||
                              (isProtectedStoragePath(image.filePath)
                                ? ''
                                : resolveApiAssetUrl(image.filePath))
                            : '';

                          return (
                            <div
                              key={image.filePath || image.fileName || `image-slot-${index}`}
                              className={localStyles.imageCard}
                            >
                              <div className={localStyles.imagePreviewWrap}>
                                {previewSrc ? (
                                  <img
                                    src={previewSrc}
                                    alt={
                                      image.originalFileName ||
                                      image.fileName ||
                                      `Tooth image ${index + 1}`
                                    }
                                    className={localStyles.imagePreview}
                                  />
                                ) : (
                                  <div className={localStyles.imagePreviewPlaceholder}>
                                    Preview
                                  </div>
                                )}
                              </div>
                              <div className={localStyles.imageCardFooter}>
                                <Typography variant="caption" className={localStyles.imageFileName}>
                                  {image.originalFileName || image.fileName || `Image ${index + 1}`}
                                </Typography>
                                <button
                                  type="button"
                                  className={localStyles.imageRemoveButton}
                                  onClick={() =>
                                    handleRemoveImage(
                                      image.filePath,
                                      values,
                                      (field, nextValue) => setFieldValue(field, nextValue)
                                    )
                                  }
                                >
                                  <DeleteOutlineOutlinedIcon fontSize="small" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {Array.from({ length: Math.max(0, 3 - values.images.length) }).map((_, index) => (
                          <div
                            key={`empty-image-slot-${index}`}
                            className={`${localStyles.imageCard} ${localStyles.imageCardEmpty}`}
                          >
                            <div className={localStyles.imagePreviewPlaceholder}>Empty Slot</div>
                          </div>
                        ))}
                      </div>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <div className={localStyles.surfaceGrid}>
                      {DENTAL_CHART_SURFACE_OPTIONS.map((surface) => {
                        const isChecked = values.surfaces.includes(surface);

                        return (
                          <label key={surface} className={localStyles.surfaceCard}>
                            <Checkbox
                              checked={isChecked}
                              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                const nextValues = event.target.checked
                                  ? [...values.surfaces, surface]
                                  : values.surfaces.filter((item) => item !== surface);

                                setFieldValue('surfaces', nextValues);
                              }}
                              size="small"
                            />
                            <span className={localStyles.surfaceLabel}>{surface}</span>
                          </label>
                        );
                      })}
                    </div>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                {state.isUpdate ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default PatientDentalChartForm;
