# Skill: TypeScript & Types
# OralSync Frontend — TypeScript Skill

> Use this skill when writing types, fixing TS errors, or enforcing
> type safety across the OralSync codebase.

---

## TypeScript Config

`tsconfig.json` has `"strict": true` — this enables:
- `strictNullChecks` — `null` and `undefined` are not assignable to non-nullable types
- `noImplicitAny` — every variable must have an explicit or inferred type
- `strictFunctionTypes` — function parameters are checked contravariantly

Never use `// @ts-ignore` or `any` to silence errors. Fix them properly.

---

## OralSync Type Conventions

### Model types — all fields are optional and nullable
Backend API responses may omit fields. All model fields are typed as optional:
```ts
// ✅ Correct — matches backend DTOs
type ItemModel = {
  id?: string;
  name?: string;
  clinicProfileId?: string | null;
  quantity?: number;
  category?: ItemCategory;
  expirationDate?: string | Date;
};

// ❌ Wrong — breaks on missing fields from API
type ItemModel = {
  id: string;
  name: string;
};
```

### Display helpers — always handle undefined/null
```ts
// ✅ Safe display helper
export const getLabel = (value?: Category | string): string => {
  if (!value) return '--';
  return LABELS[value as Category] ?? String(value);
};
```

### Enum + label map pattern
```ts
export enum ItemCategory {
  TypeA = 'TypeA',
  TypeB = 'TypeB',
}

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.TypeA]: 'Type A',
  [ItemCategory.TypeB]: 'Type B',
};

// Access safely:
const label = ITEM_CATEGORY_LABELS[category as ItemCategory] ?? category;
```

### StateModel — use concrete types, not generics
```ts
// ✅ Concrete state model
type ItemStateModel = {
  items: ItemModel[];
  load: boolean;
  // ...
};

// ❌ Don't genericize — keep it readable
type StateModel<T> = { items: T[] }; // unnecessary abstraction
```

### setState type — use `Function` (project convention)
The project uses `setState: Function` in StateProps intentionally for flexibility.
When you need a typed setState, use: `setState: React.Dispatch<React.SetStateAction<ItemStateModel>>`

### Event handler types
```ts
// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... };

// Select change
const handleSelect = (e: SelectChangeEvent<ItemCategory>): void => { ... };

// Button click
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => { ... };

// Form submit (Formik)
const handleSubmit = async (values: ItemValidationSchema): Promise<void> => { ... };
```

---

## Fixing Common TypeScript Errors

### "Object is possibly null or undefined"
```ts
// ❌ Error
const label = user.clinicName.toUpperCase();

// ✅ Fix with optional chaining + nullish coalescing
const label = user?.clinicName?.toUpperCase() ?? 'Unknown';
```

### "Type 'string | null | undefined' is not assignable to type 'string'"
```ts
// ❌ Error
const clinicId: string = user.clinicId;

// ✅ Fix — keep the nullable type
const clinicId: string | null | undefined = user.clinicId;
// Or narrow it
const clinicId = user.clinicId ?? '';
```

### "Property X does not exist on type Y"
```ts
// ❌ Error — response.data typed as generic
const item = response.data.items;

// ✅ Fix — type the apiClient call
const response = await apiClient.get<ItemResponseModel>(ENDPOINT);
const item = response.data.items; // now correctly typed
```

### "Argument of type 'string | undefined' is not assignable to parameter of type 'string'"
```ts
// ❌ Error
doSomething(state.selectedItem.id); // id is string | undefined

// ✅ Fix — guard or assert
if (state.selectedItem?.id) {
  doSomething(state.selectedItem.id);
}
// Or if you're certain it exists in context:
doSomething(state.selectedItem!.id); // non-null assertion — use sparingly
```

### "Type 'number' has no index signature" (enum as index)
```ts
// ❌ Error
const label = LABELS[category]; // category is enum, index is string

// ✅ Fix
const label = LABELS[category as ItemCategory];
```

### "Cannot find module" for SCSS module
```ts
// ✅ Import pattern for .module.scss files
import styles from './style.module.scss';
// Note: OralSync uses .scss.module.scss naming in some features
import styles from './style.scss.module.scss';
```

---

## Yup + TypeScript Integration

### Infer types from schema (always do this)
```ts
import * as yup from 'yup';

export const itemSchema = yup.object({ name: yup.string().required() });

// Infer the type — use this as Formik's values type
export type ItemFormValues = yup.InferType<typeof itemSchema>;
```

### Number fields that come from inputs (always empty-string safe)
```ts
quantity: yup
  .number()
  .transform((value, originalValue) => (originalValue === '' ? 0 : value))
  .typeError('Must be a valid number.')
  .min(0, 'Cannot be negative.'),
```

### Optional date fields
```ts
const optionalDate = yup
  .string()
  .nullable()
  .test('valid-date', 'Must be a valid date.', (value) => {
    if (!value?.trim()) return true;
    return !Number.isNaN(new Date(value).getTime());
  });
```

---

## Prompt Template — Fix TypeScript Error

```
Fix the following TypeScript error in OralSync. Do not use `any`.

## Error
{PASTE_FULL_TS_ERROR_MESSAGE}

## File
{FILE_PATH}

## Code causing the error
{PASTE_CODE}

## What this code is trying to do
{EXPLAIN_INTENT}

## Fix rules
- No `any` — use proper type, `unknown` with narrowing, or optional chaining
- Nullable fields: `field?: Type | null`
- Safe array access: `(arr ?? []).operation()`
- Enum index access: `RECORD[value as EnumType]`
- Non-null assertion (`!`) only as a last resort, never on API data
```

## Prompt Template — Write Types for a New Feature

```
Write all TypeScript types for a new OralSync feature. Follow the types skill conventions.

## Feature: {FEATURE_NAME}
## File: src/features/{FEATURE_FOLDER}/api/types.ts

## Backend fields (from API response DTO)
{FIELD}: {C_SHARP_TYPE} — {NOTES}

## Enums (if any)
{ENUM_NAME}: values are {VALUE_LIST}

## Generate
1. {Feature}Props — just { clinicId?: string }
2. {Feature}Model — all fields optional, nullable where backend can return null
3. {Feature}ResponseModel — { items: {Feature}Model[], pageStart, pageEnd, totalCount }
4. {Feature}StateModel — full state shape with modal flags, pagination, load, search
5. {Feature}StateProps — { state, setState: Function, onReload?: () => void }
6. Enums with string values (matching backend enum names exactly)
7. Label maps: Record<EnumType, string>
8. Display helpers: get{Field}Label(value?: EnumType | string): string — handles undefined safely

## Rules
- All model fields optional: field?: type
- Nullable backend fields: field?: type | null
- Date fields from API: field?: string | Date
- No `any` types anywhere
- Enum values must match C# enum names exactly (PascalCase)
```

---

*Last updated: April 2026*
