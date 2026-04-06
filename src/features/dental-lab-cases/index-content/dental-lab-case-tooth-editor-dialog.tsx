import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import {
  DENTAL_CHART_SURFACE_OPTIONS,
  DentalChartKind,
} from '../../patient-profile-modules/dental-chart/api/types';
import {
  DENTAL_LAB_WORK_TYPE_OPTIONS,
  DentalLabCaseToothModel,
  DentalLabWorkType,
  getDentalLabWorkTypeLabel,
} from '../api/types';

export type DentalLabCaseToothOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DentalLabCaseToothEditorDialogProps = {
  open: boolean;
  chartKind: DentalChartKind;
  tooth?: DentalLabCaseToothModel | null;
  previousToothNumber?: string;
  toothOptions: DentalLabCaseToothOption[];
  shadeOptions: string[];
  onClose: () => void;
  onSave: (tooth: DentalLabCaseToothModel, previousToothNumber?: string) => void;
};

type ToothEditorValues = {
  toothNumber: string;
  workType: DentalLabWorkType;
  material: string;
  shade: string;
  remarks: string;
  surfaces: string[];
};

const createDialogValues = (tooth?: DentalLabCaseToothModel | null): ToothEditorValues => ({
  toothNumber: tooth?.toothNumber || '',
  workType: tooth?.workType || DentalLabWorkType.Crown,
  material: tooth?.material || '',
  shade: tooth?.shade || '',
  remarks: tooth?.remarks || '',
  surfaces: (tooth?.surfaces || [])
    .map((item) => item.surface || '')
    .filter(Boolean),
});

const DentalLabCaseToothEditorDialog: FunctionComponent<
  DentalLabCaseToothEditorDialogProps
> = (props): JSX.Element => {
  const {
    open,
    chartKind,
    tooth,
    previousToothNumber,
    toothOptions,
    shadeOptions,
    onClose,
    onSave,
  } = props;
  const [values, setValues] = useState<ToothEditorValues>(createDialogValues(tooth));
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(createDialogValues(tooth));
    setErrorMessage('');
  }, [open, tooth]);

  const handleToggleSurface = (surface: string, checked: boolean): void => {
    setValues((prev) => ({
      ...prev,
      surfaces: checked
        ? [...prev.surfaces, surface]
        : prev.surfaces.filter((item) => item !== surface),
    }));
  };

  const handleSave = (): void => {
    if (!values.toothNumber.trim()) {
      setErrorMessage('Please select a tooth.');
      return;
    }

    if (!values.workType) {
      setErrorMessage('Please select a work type.');
      return;
    }

    onSave(
      {
        toothNumber: values.toothNumber.trim(),
        workType: values.workType,
        material: values.material.trim(),
        shade: values.shade.trim(),
        remarks: values.remarks.trim(),
        surfaces: values.surfaces.map((surface) => ({ surface })),
      },
      previousToothNumber
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
        {previousToothNumber ? 'Edit Tooth Work' : 'Add Tooth Work'}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid rgba(192,210,231,0.9)',
              bgcolor: '#fbfdff',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>Tooth Details</Typography>
            <Typography sx={{ mt: 0.45, color: '#6c8299', fontSize: '0.86rem' }}>
              Select the tooth, work type, shade, and surface details for this lab entry.
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Tooth"
                  value={values.toothNumber}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      toothNumber: event.target.value,
                    }))
                  }
                  select
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">Select tooth</MenuItem>
                  {toothOptions.map((option) => (
                    <MenuItem
                      key={`${chartKind}-${option.value}`}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Work Type"
                  value={values.workType}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      workType: event.target.value as DentalLabWorkType,
                    }))
                  }
                  select
                  fullWidth
                  size="small"
                >
                  {DENTAL_LAB_WORK_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {getDentalLabWorkTypeLabel(option)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Material"
                  value={values.material}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      material: event.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  placeholder="Example: Zirconia"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Shade"
                  value={values.shade}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      shade: event.target.value,
                    }))
                  }
                  select
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">Select shade</MenuItem>
                  {shadeOptions.map((shade) => (
                    <MenuItem key={shade} value={shade}>
                      {shade}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tooth Remarks"
                  value={values.remarks}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      remarks: event.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  placeholder="Example: Check occlusion, contact, and shade transition."
                />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid rgba(192,210,231,0.9)',
              bgcolor: '#fbfdff',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>Tooth Surfaces</Typography>
            <Typography sx={{ mt: 0.45, color: '#6c8299', fontSize: '0.86rem' }}>
              Mark the surfaces involved for this tooth.
            </Typography>

            <Box sx={{ mt: 1.6, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DENTAL_CHART_SURFACE_OPTIONS.map((surface) => {
                const isSelected = values.surfaces.includes(surface);

                return (
                  <Box
                    key={surface}
                    component="label"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.55,
                      px: 1.15,
                      py: 0.45,
                      borderRadius: '999px',
                      border: `1px solid ${
                        isSelected ? 'rgba(47,109,179,0.78)' : 'rgba(191,209,229,0.9)'
                      }`,
                      bgcolor: isSelected ? 'rgba(47,109,179,0.08)' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={(event) => handleToggleSurface(surface, event.target.checked)}
                    />
                    <span>{surface}</span>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          {previousToothNumber ? 'Update Tooth' : 'Add Tooth'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DentalLabCaseToothEditorDialog;
