import * as yup from 'yup';

import {
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_TYPE_OPTIONS,
  InventoryCategory,
  InventoryType,
} from './types';

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const isValidDateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const optionalDateField = yup
  .string()
  .nullable()
  .test('valid-date', 'Date must be a valid date.', (value?: string | null) => {
    if (!value?.trim()) {
      return true;
    }

    return isValidDateString(value);
  })
  .test('four-digit-year', 'Date year must be exactly 4 digits.', (value?: string | null) => {
    if (!value?.trim()) {
      return true;
    }

    return hasFourDigitYear(value);
  });

export const inventoryValidationSchema = yup.object({
  itemCode: yup.string().trim().max(100, 'Item code must not exceed 100 characters.'),
  name: yup
    .string()
    .trim()
    .required('Item name is required.')
    .max(255, 'Item name must not exceed 255 characters.'),
  description: yup.string().trim().max(2000, 'Description must not exceed 2000 characters.'),
  category: yup
    .mixed<InventoryCategory | ''>()
    .required('Category is required.')
    .oneOf(INVENTORY_CATEGORY_OPTIONS, 'Select a valid category.'),
  type: yup
    .mixed<InventoryType | ''>()
    .required('Type is required.')
    .oneOf(INVENTORY_TYPE_OPTIONS, 'Select a valid type.'),
  quantityOnHand: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Quantity on hand must be a valid number.')
    .min(0, 'Quantity on hand cannot be negative.'),
  minimumStockLevel: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Minimum stock level must be a valid number.')
    .min(0, 'Minimum stock level cannot be negative.'),
  maximumStockLevel: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Maximum stock level must be a valid number.')
    .min(0, 'Maximum stock level cannot be negative.')
    .test(
      'max-gte-min',
      'Maximum stock level cannot be less than the minimum stock level.',
      function (value?: number): boolean {
        return Number(value ?? 0) >= Number(this.parent.minimumStockLevel ?? 0);
      }
    ),
  unitOfMeasure: yup
    .string()
    .trim()
    .required('Unit of measure is required.')
    .max(100, 'Unit of measure must not exceed 100 characters.'),
  unitCost: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Unit cost must be a valid number.')
    .min(0, 'Unit cost cannot be negative.'),
  sellingPrice: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Selling price must be a valid number.')
    .min(0, 'Selling price cannot be negative.'),
  totalValue: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Total value must be a valid number.')
    .min(0, 'Total value cannot be negative.'),
  supplierName: yup.string().trim().max(255, 'Supplier name must not exceed 255 characters.'),
  supplierContactNumber: yup
    .string()
    .trim()
    .max(50, 'Supplier contact number must not exceed 50 characters.'),
  supplierEmail: yup
    .string()
    .trim()
    .email('Supplier email must be a valid email address.')
    .max(255, 'Supplier email must not exceed 255 characters.'),
  batchNumber: yup.string().trim().max(100, 'Batch number must not exceed 100 characters.'),
  manufacturingDate: optionalDateField,
  expirationDate: optionalDateField.test(
    'expiration-after-manufacturing',
    'Expiration date cannot be earlier than the manufacturing date.',
    function (value?: string | null): boolean {
      if (!value?.trim() || !this.parent.manufacturingDate?.trim()) {
        return true;
      }

      return new Date(value) >= new Date(this.parent.manufacturingDate);
    }
  ),
  lastRestockedDate: optionalDateField,
  lastUsedDate: optionalDateField,
  usageCount: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .typeError('Usage count must be a valid number.')
    .integer('Usage count must be a whole number.')
    .min(0, 'Usage count cannot be negative.'),
  isActive: yup.boolean().required(),
});

export type InventoryValidationSchema = yup.InferType<typeof inventoryValidationSchema>;
