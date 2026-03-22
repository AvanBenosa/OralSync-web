import { ChangeEvent, FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { HandleCreateInventory, HandleUpdateInventory } from '../api/handlers';
import {
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_TYPE_OPTIONS,
  InventoryCategory,
  InventoryModel,
  InventoryStateProps,
  InventoryType,
  getInventoryCategoryLabel,
  getInventoryTypeLabel,
} from '../api/types';
import { inventoryValidationSchema } from '../api/validation';

type InventoryFormProps = InventoryStateProps;

type InventoryFormValues = {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  category: InventoryCategory | '';
  type: InventoryType | '';
  quantityOnHand: number | '';
  minimumStockLevel: number | '';
  maximumStockLevel: number | '';
  unitOfMeasure: string;
  unitCost: number | '';
  sellingPrice: number | '';
  totalValue: number | '';
  supplierName: string;
  supplierContactNumber: string;
  supplierEmail: string;
  batchNumber: string;
  manufacturingDate: string;
  expirationDate: string;
  lastRestockedDate: string;
  lastUsedDate: string;
  usageCount: number | '';
  isActive: boolean;
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

const toDatePayloadValue = (value?: string): string | undefined => {
  if (!value?.trim()) {
    return undefined;
  }

  return `${value}T00:00:00`;
};

const createInitialValues = (selectedItem?: InventoryModel): InventoryFormValues => ({
  id: selectedItem?.id || '',
  itemCode: selectedItem?.itemCode || '',
  name: selectedItem?.name || '',
  description: selectedItem?.description || '',
  category: selectedItem?.category || '',
  type: selectedItem?.type || '',
  quantityOnHand: selectedItem?.quantityOnHand ?? 0,
  minimumStockLevel: selectedItem?.minimumStockLevel ?? 0,
  maximumStockLevel: selectedItem?.maximumStockLevel ?? 0,
  unitOfMeasure: selectedItem?.unitOfMeasure || '',
  unitCost: selectedItem?.unitCost ?? 0,
  sellingPrice: selectedItem?.sellingPrice ?? 0,
  totalValue: selectedItem?.totalValue ?? 0,
  supplierName: selectedItem?.supplierName || '',
  supplierContactNumber: selectedItem?.supplierContactNumber || '',
  supplierEmail: selectedItem?.supplierEmail || '',
  batchNumber: selectedItem?.batchNumber || '',
  manufacturingDate: toDateInputValue(selectedItem?.manufacturingDate),
  expirationDate: toDateInputValue(selectedItem?.expirationDate),
  lastRestockedDate: toDateInputValue(selectedItem?.lastRestockedDate),
  lastUsedDate: toDateInputValue(selectedItem?.lastUsedDate),
  usageCount: selectedItem?.usageCount ?? 0,
  isActive: selectedItem?.isActive ?? true,
});

const parseNumberInput = (value: string): number | '' => {
  if (value.trim() === '') {
    return '';
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

const getNumericValue = (value: number | ''): number => (value === '' ? 0 : value);

const InventoryForm: FunctionComponent<InventoryFormProps> = (
  props: InventoryFormProps
): JSX.Element => {
  const { state, setState } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Inventory Item' : 'Add Inventory Item'),
    [state.isUpdate]
  );

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmitForm = async (values: InventoryFormValues): Promise<void> => {
    const payload: InventoryModel = {
      id: values.id.trim() || undefined,
      itemCode: values.itemCode.trim(),
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category || undefined,
      type: values.type || undefined,
      quantityOnHand: getNumericValue(values.quantityOnHand),
      minimumStockLevel: getNumericValue(values.minimumStockLevel),
      maximumStockLevel: getNumericValue(values.maximumStockLevel),
      unitOfMeasure: values.unitOfMeasure.trim(),
      unitCost: getNumericValue(values.unitCost),
      sellingPrice: getNumericValue(values.sellingPrice),
      totalValue: getNumericValue(values.totalValue),
      supplierName: values.supplierName.trim(),
      supplierContactNumber: values.supplierContactNumber.trim(),
      supplierEmail: values.supplierEmail.trim(),
      batchNumber: values.batchNumber.trim(),
      manufacturingDate: toDatePayloadValue(values.manufacturingDate),
      expirationDate: toDatePayloadValue(values.expirationDate),
      lastRestockedDate: toDatePayloadValue(values.lastRestockedDate),
      lastUsedDate: toDatePayloadValue(values.lastUsedDate),
      usageCount: Math.trunc(getNumericValue(values.usageCount)),
      isActive: values.isActive,
    };

    if (state.isUpdate) {
      await HandleUpdateInventory(payload, state, setState);
    } else {
      await HandleCreateInventory(payload, state, setState);
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={inventoryValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmitForm(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save inventory record.');
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
          isSubmitting,
          status,
          errors,
          touched,
          submitCount,
          setFieldValue,
        }): JSX.Element => {
          const shouldShowError = (fieldName: keyof InventoryFormValues): boolean =>
            Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

          return (
            <>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
                  {status ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {status}
                    </Alert>
                  ) : null}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Item Code"
                            name="itemCode"
                            value={values.itemCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('itemCode')}
                            helperText={shouldShowError('itemCode') ? errors.itemCode : undefined}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            label="Item Name"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('name')}
                            helperText={shouldShowError('name') ? errors.name : undefined}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Description"
                            name="description"
                            value={values.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            multiline
                            minRows={3}
                            error={shouldShowError('description')}
                            helperText={
                              shouldShowError('description') ? errors.description : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Classification and Stock
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Category"
                            name="category"
                            value={values.category}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            select
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('category')}
                            helperText={shouldShowError('category') ? errors.category : undefined}
                          >
                            <MenuItem value="">Select category</MenuItem>
                            {INVENTORY_CATEGORY_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>
                                {getInventoryCategoryLabel(option)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Type"
                            name="type"
                            value={values.type}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            select
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('type')}
                            helperText={shouldShowError('type') ? errors.type : undefined}
                          >
                            <MenuItem value="">Select type</MenuItem>
                            {INVENTORY_TYPE_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>
                                {getInventoryTypeLabel(option)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Unit of Measure"
                            name="unitOfMeasure"
                            value={values.unitOfMeasure}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('unitOfMeasure')}
                            helperText={
                              shouldShowError('unitOfMeasure') ? errors.unitOfMeasure : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Quantity On Hand"
                            name="quantityOnHand"
                            type="number"
                            value={values.quantityOnHand}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue('quantityOnHand', parseNumberInput(event.target.value))
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('quantityOnHand')}
                            helperText={
                              shouldShowError('quantityOnHand') ? errors.quantityOnHand : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Minimum Stock"
                            name="minimumStockLevel"
                            type="number"
                            value={values.minimumStockLevel}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue(
                                'minimumStockLevel',
                                parseNumberInput(event.target.value)
                              )
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('minimumStockLevel')}
                            helperText={
                              shouldShowError('minimumStockLevel')
                                ? errors.minimumStockLevel
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Maximum Stock"
                            name="maximumStockLevel"
                            type="number"
                            value={values.maximumStockLevel}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue(
                                'maximumStockLevel',
                                parseNumberInput(event.target.value)
                              )
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('maximumStockLevel')}
                            helperText={
                              shouldShowError('maximumStockLevel')
                                ? errors.maximumStockLevel
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Usage Count"
                            name="usageCount"
                            type="number"
                            value={values.usageCount}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue('usageCount', parseNumberInput(event.target.value))
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('usageCount')}
                            helperText={
                              shouldShowError('usageCount') ? errors.usageCount : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Pricing
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Unit Cost"
                            name="unitCost"
                            type="number"
                            value={values.unitCost}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue('unitCost', parseNumberInput(event.target.value))
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('unitCost')}
                            helperText={shouldShowError('unitCost') ? errors.unitCost : undefined}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Selling Price"
                            name="sellingPrice"
                            type="number"
                            value={values.sellingPrice}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue('sellingPrice', parseNumberInput(event.target.value))
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('sellingPrice')}
                            helperText={
                              shouldShowError('sellingPrice') ? errors.sellingPrice : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Total Value"
                            name="totalValue"
                            type="number"
                            value={values.totalValue}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setFieldValue('totalValue', parseNumberInput(event.target.value))
                            }
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('totalValue')}
                            helperText={
                              shouldShowError('totalValue') ? errors.totalValue : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Supplier Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Supplier Name"
                            name="supplierName"
                            value={values.supplierName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('supplierName')}
                            helperText={
                              shouldShowError('supplierName') ? errors.supplierName : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Supplier Contact"
                            name="supplierContactNumber"
                            value={values.supplierContactNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('supplierContactNumber')}
                            helperText={
                              shouldShowError('supplierContactNumber')
                                ? errors.supplierContactNumber
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Supplier Email"
                            name="supplierEmail"
                            value={values.supplierEmail}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('supplierEmail')}
                            helperText={
                              shouldShowError('supplierEmail') ? errors.supplierEmail : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Batch and Date Tracking
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Batch Number"
                            name="batchNumber"
                            value={values.batchNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            error={shouldShowError('batchNumber')}
                            helperText={
                              shouldShowError('batchNumber') ? errors.batchNumber : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Manufacturing Date"
                            name="manufacturingDate"
                            type="date"
                            value={values.manufacturingDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={shouldShowError('manufacturingDate')}
                            helperText={
                              shouldShowError('manufacturingDate')
                                ? errors.manufacturingDate
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Expiration Date"
                            name="expirationDate"
                            type="date"
                            value={values.expirationDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={shouldShowError('expirationDate')}
                            helperText={
                              shouldShowError('expirationDate') ? errors.expirationDate : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Last Restocked Date"
                            name="lastRestockedDate"
                            type="date"
                            value={values.lastRestockedDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={shouldShowError('lastRestockedDate')}
                            helperText={
                              shouldShowError('lastRestockedDate')
                                ? errors.lastRestockedDate
                                : undefined
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Last Used Date"
                            name="lastUsedDate"
                            type="date"
                            value={values.lastUsedDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={shouldShowError('lastUsedDate')}
                            helperText={
                              shouldShowError('lastUsedDate') ? errors.lastUsedDate : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Status
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isActive}
                            onChange={(_, checked) => setFieldValue('isActive', checked)}
                          />
                        }
                        label={values.isActive ? 'Active item' : 'Inactive item'}
                      />
                    </Box>
                  </Box>
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
          );
        }}
      </Formik>
    </>
  );
};

export default InventoryForm;
