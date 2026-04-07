# Skill: Forms & Validation
# OralSync Frontend — Forms & Validation Skill

> Use this skill when building or fixing Formik forms, Yup schemas,
> or syncing validation rules between the frontend and backend.

---

## Form Stack

| Layer | Tool | File |
|-------|------|------|
| Form state | Formik | `index-content/{feature}-form.tsx` |
| Validation schema | Yup | `api/validation.ts` |
| Input components | MUI `TextField`, `Select` | same form file |
| Types from schema | `yup.InferType<typeof schema>` | exported from `validation.ts` |

---

## Standard Form Setup Pattern

```tsx
import { useFormik } from 'formik';
import { itemValidationSchema, ItemValidationSchema } from '../api/validation';
import { HandleCreateItem, HandleUpdateItem } from '../api/handlers';

const ItemForm = ({ state, setState }: ItemStateProps): JSX.Element => {
  const formik = useFormik<ItemValidationSchema>({
    enableReinitialize: true, // required when state.selectedItem can change
    initialValues: {
      name: state.selectedItem?.name ?? '',
      quantity: state.selectedItem?.quantity ?? 0,
      category: state.selectedItem?.category ?? '',
      isActive: state.selectedItem?.isActive ?? true,
      // match ALL Yup schema keys
    },
    validationSchema: itemValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const request = {
          ...values,
          id: state.selectedItem?.id,
          clinicProfileId: state.clinicProfileId,
        };
        if (state.isUpdate) {
          await HandleUpdateItem(request, state, setState);
        } else {
          await HandleCreateItem(request, state, setState);
        }
      } catch {
        // ExceptionResponse in api.ts already shows the toast
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <DialogTitle>{state.isUpdate ? 'Edit Item' : 'Add Item'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
        {/* more fields */}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setState(prev => ({ ...prev, openModal: false }))}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
          {state.isUpdate ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Box>
  );
};
```

---

## Yup Schema Patterns

### Required string
```ts
name: yup.string().trim().required('Name is required.').max(255, 'Max 255 characters.'),
```

### Optional string
```ts
description: yup.string().trim().nullable().max(2000, 'Max 2000 characters.'),
```

### Required number (safe for empty string from input)
```ts
quantity: yup
  .number()
  .transform((value, originalValue) => (originalValue === '' ? 0 : value))
  .typeError('Must be a valid number.')
  .required('Quantity is required.')
  .min(0, 'Cannot be negative.'),
```

### Optional number
```ts
unitCost: yup
  .number()
  .transform((value, originalValue) => (originalValue === '' ? 0 : value))
  .typeError('Must be a valid number.')
  .min(0, 'Cannot be negative.'),
```

### Required enum / select
```ts
category: yup
  .mixed<ItemCategory | ''>()
  .required('Category is required.')
  .oneOf(ITEM_CATEGORY_OPTIONS, 'Select a valid category.'),
```

### Optional date (with 4-digit year check)
```ts
expirationDate: yup
  .string()
  .nullable()
  .test('valid-date', 'Must be a valid date.', (value) => {
    if (!value?.trim()) return true;
    return !Number.isNaN(new Date(value).getTime());
  })
  .test('four-digit-year', 'Year must be 4 digits.', (value) => {
    if (!value?.trim()) return true;
    return value.split('-')[0].length === 4;
  }),
```

### Cross-field validation (max >= min)
```ts
maximumStockLevel: yup
  .number()
  .transform((v, orig) => (orig === '' ? 0 : v))
  .min(0)
  .test('max-gte-min', 'Max cannot be less than min.', function (value) {
    return Number(value ?? 0) >= Number(this.parent.minimumStockLevel ?? 0);
  }),
```

### Boolean field
```ts
isActive: yup.boolean().required(),
```

### Email
```ts
supplierEmail: yup
  .string()
  .trim()
  .email('Must be a valid email.')
  .max(255),
```

---

## MUI Form Fields Reference

### Text input
```tsx
<TextField
  fullWidth
  label="Item Name"
  name="name"
  value={formik.values.name}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.name && Boolean(formik.errors.name)}
  helperText={formik.touched.name && formik.errors.name}
/>
```

### Number input
```tsx
<TextField
  fullWidth
  label="Quantity"
  name="quantity"
  type="number"
  inputProps={{ min: 0 }}
  value={formik.values.quantity}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.quantity && Boolean(formik.errors.quantity)}
  helperText={formik.touched.quantity && formik.errors.quantity}
/>
```

### Select / dropdown
```tsx
<FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
  <InputLabel>Category</InputLabel>
  <Select
    name="category"
    value={formik.values.category}
    label="Category"
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
  >
    {ITEM_CATEGORY_OPTIONS.map(opt => (
      <MenuItem key={opt} value={opt}>{ITEM_CATEGORY_LABELS[opt as ItemCategory] ?? opt}</MenuItem>
    ))}
  </Select>
  {formik.touched.category && formik.errors.category && (
    <FormHelperText>{formik.errors.category}</FormHelperText>
  )}
</FormControl>
```

### Date input
```tsx
<TextField
  fullWidth
  label="Expiration Date"
  name="expirationDate"
  type="date"
  InputLabelProps={{ shrink: true }}
  value={formik.values.expirationDate ?? ''}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.expirationDate && Boolean(formik.errors.expirationDate)}
  helperText={formik.touched.expirationDate && formik.errors.expirationDate}
/>
```

### Toggle / checkbox
```tsx
<FormControlLabel
  control={
    <Switch
      name="isActive"
      checked={formik.values.isActive}
      onChange={formik.handleChange}
    />
  }
  label="Active"
/>
```

---

## Frontend ↔ Backend Validation Sync Rules

| Rule type | Frontend (Yup) | Backend (ValidateRequest) |
|-----------|---------------|--------------------------|
| Required string | `.required('...')` | `string.IsNullOrWhiteSpace` |
| Max length | `.max(255, '...')` | (implicit from DB column) |
| Min value | `.min(0, '...')` | `if (field < 0) return "..."` |
| Valid email | `.email('...')` | `new EmailAddressAttribute().IsValid()` |
| Valid enum | `.oneOf(OPTIONS, '...')` | `Enum.IsDefined(typeof T, value)` |
| Cross-field | `.test('name', 'msg', fn)` | custom if/return check |
| Date valid | `.test('valid-date', ...)` | `DateTime.TryParse` |

**Error messages must match** — users see the same message from API validation errors (shown via `ExceptionResponse`) as they would from Yup validation.

---

## Prompt Template — Build a New Form

```
Build a new Formik form for OralSync. Follow CLAUDE.md and the forms skill.

## Feature: {FEATURE_NAME}
## File: src/features/{FEATURE_FOLDER}/index-content/{FEATURE_NAME}-form.tsx
## Validation schema: src/features/{FEATURE_FOLDER}/api/validation.ts (already exists / needs to be created)

## Fields
{FIELD_NAME}: {TYPE} — Required: {YES/NO} — Input type: {text|number|select|date|toggle}
  Options (if select): {OPTIONS}
  Validation: {RULES}

## State
StateModel: {PASTE_STATE_MODEL}
- isUpdate flag: YES (same form for create and edit)
- selectedItem used for edit initial values: YES

## Generate
1. validation.ts — Yup schema with all fields, matching backend rules
   Export: schema + InferType alias
2. {feature}-form.tsx — Formik form with:
   - enableReinitialize: true
   - initialValues from state.selectedItem (edit) or empty defaults (create)
   - All fields as MUI TextField/Select/Switch
   - Inline error display (helperText)
   - Cancel button closes dialog: setState(prev => ({ ...prev, openModal: false }))
   - Submit calls HandleCreate or HandleUpdate based on state.isUpdate

## Rules
- All number fields: .transform((v, orig) => orig === '' ? 0 : v) in Yup
- All optional dates: use the optionalDateField pattern with 4-digit year check
- Error messages must match backend ValidateRequest() messages
- No business logic in onSubmit — delegate to handlers
```

## Prompt Template — Fix a Form Bug

```
Fix a Formik form bug in OralSync.

## File: src/features/{FEATURE_FOLDER}/index-content/{FEATURE}-form.tsx

## Bug: {DESCRIBE_ISSUE}

## Current formik setup
{PASTE_useFormik_CALL}

## Current Yup schema
{PASTE_SCHEMA}

## State at time of bug
isUpdate: {true/false}
selectedItem: {PASTE or "undefined"}

## Checklist to check
[ ] initialValues keys match Yup schema keys exactly
[ ] enableReinitialize is true when selectedItem changes
[ ] Number fields handle empty string: transform((v, orig) => orig === '' ? 0 : v)
[ ] onBlur is attached to trigger touched state for error display
[ ] onSubmit doesn't call setState directly — calls handler instead
[ ] setSubmitting(false) is called in finally block
```

---

*Last updated: April 2026*
