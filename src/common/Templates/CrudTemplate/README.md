# OralSync CRUD Module — Quick-Start Checklist

## Token Replacement Table
Find-and-replace these tokens across **all 9 files** before anything else.

| Token | Replace with | Example |
|---|---|---|
| `MODULE_NAME` | PascalCase entity name | `Appointment` |
| `module_name` | camelCase / kebab-case entity name | `appointment` |
| `MODULE_NOUN` | Human-readable label | `Appointment` |
| `MODULE_ICON` | MUI icon component name | `EventRounded` |

---

## Folder Structure to Create

```
src/features/module_name/
├── api/
│   ├── types.ts          ← types, enums, state model
│   ├── api.ts            ← axios CRUD calls + caching
│   ├── handlers.ts       ← state-updating wrappers
│   └── validation.ts     ← Yup schema
├── index-content/
│   ├── module_name-header.tsx
│   ├── module_name-table.tsx
│   └── module_name-form.tsx
├── modal/
│   └── modal.tsx         ← delete confirmation
├── index.tsx             ← module root + Dialog orchestration
└── style.scss.module.scss ← copy from inventory (shared class names)
```

---

## Step-by-Step Checklist

### 1 · types.ts
- [ ] Replace all tokens
- [ ] Add / remove enums for your select fields
- [ ] Add domain fields to `MODULE_NAMEModel`
- [ ] Remove `MODULE_NAMEStatus` entirely if no status enum is needed

### 2 · api.ts
- [ ] Replace all tokens
- [ ] Update the four endpoint constants (`GET_ENDPOINT`, etc.)

### 3 · handlers.ts
- [ ] Replace all tokens (imports auto-resolve after api.ts is updated)

### 4 · validation.ts
- [ ] Replace all tokens
- [ ] Add / remove Yup rules to match `MODULE_NAMEModel`

### 5 · module_name-header.tsx
- [ ] Replace all tokens
- [ ] Pick a MUI icon for `MODULE_ICON`
- [ ] Update the search placeholder text
- [ ] Update the "Add" button label

### 6 · module_name-table.tsx
- [ ] Replace all tokens
- [ ] Update `DESKTOP_COLUMN_COUNT` to match column count
- [ ] Replace `<TableCell>` header labels
- [ ] Replace desktop row cells with your domain fields
- [ ] Replace mobile layout fields
- [ ] Update empty-state title & description
- [ ] Adjust `desktopCells` widths in `TableLoadingSkeleton`

### 7 · module_name-form.tsx
- [ ] Replace all tokens
- [ ] Extend `MODULE_NAMEFormValues` type with domain fields
- [ ] Extend `createInitialValues` to initialise them
- [ ] Extend `payload` in `handleSubmitForm`
- [ ] Add form sections (`<Box>` + `<Grid>`) for each field group
- [ ] Remove the `status` select if not needed

### 8 · modal/modal.tsx
- [ ] Replace all tokens
- [ ] Update `formatLabel` to return a meaningful record label

### 9 · index.tsx
- [ ] Replace all tokens
- [ ] Adjust `maxWidth` on `<Dialog>` to suit your form size

### 10 · Register the module
- [ ] Add a route in `App.tsx`
- [ ] Add a nav link in the sidebar / layout file

---

## Common Customisations

**Add a number field**
```tsx
<Grid size={{ xs: 12, sm: 4 }}>
  <TextField
    label="Amount"
    name="amount"
    type="number"
    value={values.amount}
    onChange={(e) => setFieldValue('amount', parseNumberInput(e.target.value))}
    onBlur={handleBlur}
    fullWidth size="small"
    error={shouldShowError('amount')}
    helperText={shouldShowError('amount') ? errors.amount : undefined}
  />
</Grid>
```

**Add a date field**
```tsx
<TextField
  label="Start Date"
  name="startDate"
  type="date"
  value={values.startDate}
  onChange={handleChange}
  onBlur={handleBlur}
  fullWidth size="small"
  InputLabelProps={{ shrink: true }}
/>
```

**Add a second select / enum**
```tsx
// types.ts — add enum + label map
export enum MODULE_NAMEType { ... }
export const MODULE_NAME_TYPE_OPTIONS = Object.values(MODULE_NAMEType);

// form.tsx — render the select
<TextField select name="type" value={values.type} ...>
  {MODULE_NAME_TYPE_OPTIONS.map((o) => (
    <MenuItem key={o} value={o}>{getMODULE_NAMETypeLabel(o)}</MenuItem>
  ))}
</TextField>
```
