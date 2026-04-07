# Skill: Frontend Component
# OralSync Frontend — Component Writing Skill

> Use this skill when you want Claude to write or extend a React component
> that follows OralSync's exact conventions and patterns.

---

## Component Architecture in OralSync

Every feature module follows this structure:

```
src/features/{feature}/
├── api/
│   ├── types.ts          → All types, enums, state models
│   ├── validation.ts     → Yup schemas
│   ├── api.ts            → HTTP calls (apiClient, cache, dedup)
│   └── handlers.ts       → Orchestrates api.ts + setState
├── index-content/
│   ├── {feature}-header.tsx   → Search bar + action buttons
│   ├── {feature}-table.tsx    → MUI Table (list view)
│   └── {feature}-form.tsx     → Formik create/edit form
├── modal/
│   └── modal.tsx         → Delete confirmation dialog
└── index.tsx             → Root module — state, effects, dialog, layout
```

Child components only receive `state` and `setState` via `StateProps` — they never own their own data-fetching logic.

---

## Rules Claude Follows When Writing Components

### State
- Always initialize state from `StateModel` in the root `index.tsx`
- All updates use functional form: `setState(prev => ({ ...prev, key: value }))`
- Never mutate state directly
- Selected/edit item stored as `selectedItem` on `StateModel`
- Modal open/close controlled by `openModal`, `isUpdate`, `isDelete` flags

### Props
- Root module: receives only `clinicId?: string` (from route, via authStore)
- Child components: receive `state: StateModel` + `setState: Function` + optionally `onReload?: () => void`
- Never pass individual fields as props to children — always pass the full `state` object

### Hooks
- `useClinicId(clinicId)` — resolves clinicId from prop or authStore fallback
- `useRef` for timeout handles (debounce, reload) — always clear on unmount
- `useEffect` dependencies: `[resolvedClinicId, state.search, state.pageStart, state.pageEnd]` for data loading
- `useMemo` for expensive derived values (e.g. `assistantContext` in mainLayout)

### Rendering
- Loading state: show `TableLoadingSkeleton` when `state.load === true`
- Empty state: show a friendly message when `state.items.length === 0 && !state.load`
- Pagination: always use `RoundedPagination` component
- Dialog: single `<Dialog>` on root, switches between form and delete modal using `state.isDelete`

### TypeScript
- All component props must be typed — no `any`
- Event handlers typed: `(e: React.ChangeEvent<HTMLInputElement>) => void`
- Optional fields on models: `field?: Type` (not `field: Type | undefined`)
- Nullable API values: `field?: string | null`

---

## Prompt Template — Write a New Component

```
Write a new OralSync frontend component. Follow CLAUDE.md and the component skill rules.

## Component: {COMPONENT_NAME}
File location: src/features/{FEATURE_FOLDER}/{SUBFOLDER}/{COMPONENT_NAME}.tsx

## Purpose
{WHAT_THIS_COMPONENT_DOES}

## State it receives
From StateModel (paste the StateModel type here or reference the feature):
{PASTE_STATE_MODEL or "same as {FEATURE} module"}

## What it renders
{DESCRIBE_UI — table, form, dialog, header, card, etc.}

## Fields / columns to show
{FIELD}: {DISPLAY_LABEL} — {INPUT_TYPE or "display only"}

## Interactions
- {USER_ACTION} → {WHAT_HAPPENS_IN_STATE}
- {USER_ACTION} → {WHAT_HAPPENS_IN_STATE}

## Rules
- Extend StateProps type: { state: {MODULE}StateModel; setState: Function; onReload?: () => void }
- Use MUI components only (no custom CSS libraries)
- Use functional setState: setState(prev => ({ ...prev, ... }))
- Import enums and labels from the feature's api/types.ts
- Error states and loading states must be handled
- TypeScript strict — no `any`
```

---

## Prompt Template — Extend an Existing Component

```
Extend the following OralSync component. Read CLAUDE.md before answering.

## File: {FILE_PATH}

## Current code
{PASTE_CURRENT_CODE}

## What to add / change
{DESCRIBE_CHANGE}

## Rules
- Do not change unrelated parts of the component
- Keep the same state shape — do not add new top-level state keys without updating StateModel in types.ts
- Use functional setState
- If adding a new field to a form, also reference api/validation.ts to confirm Yup schema covers it
- TypeScript strict — no `any`
```

---

## Component Patterns Reference

### Root Module Pattern (index.tsx)
```tsx
export const {Module}Module: FunctionComponent<{Module}Props> = ({ clinicId }): JSX.Element => {
  const resolvedClinicId = useClinicId(clinicId);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);

  const [state, setState] = useState<{Module}StateModel>({ /* initial state */ });

  // Load data effect
  useEffect(() => {
    // debounced search + clinic change detection
  }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd]);

  // Dialog cleanup on close
  const handleDialogExited = () =>
    setState(prev => ({ ...prev, isUpdate: false, isDelete: false, selectedItem: undefined }));

  return (
    <div className={styles.wrapper}>
      <{Module}Header state={state} setState={setState} onReload={handleReload} />
      <{Module}Table state={state} setState={setState} />
      <RoundedPagination ... />
      <Dialog open={state.openModal} onClose={...} TransitionProps={{ onExited: handleDialogExited }}>
        {state.isDelete ? <{Module}DeleteModal ... /> : <{Module}Form ... />}
      </Dialog>
    </div>
  );
};
```

### Header Pattern (header.tsx)
```tsx
// Search TextField + "Add" Button
// On search change: setState(prev => ({ ...prev, search: e.target.value, pageStart: 0 }))
// On add click: setState(prev => ({ ...prev, openModal: true, isUpdate: false, isDelete: false }))
```

### Table Row Edit/Delete Pattern (table.tsx)
```tsx
// Edit: setState(prev => ({ ...prev, openModal: true, isUpdate: true, selectedItem: row }))
// Delete: setState(prev => ({ ...prev, openModal: true, isDelete: true, selectedItem: row }))
```

### Form Pattern (form.tsx)
```tsx
// Formik initialValues from state.selectedItem (edit) or empty defaults (create)
// validationSchema from api/validation.ts
// onSubmit: call HandleCreate or HandleUpdate based on state.isUpdate
// After submit: setState closes modal, resets selectedItem
```

### Delete Modal Pattern (modal.tsx)
```tsx
// Show: "Are you sure you want to delete {selectedItem.name}?"
// Confirm button: call HandleDelete → setState removes item from list
// Cancel button: setState(prev => ({ ...prev, openModal: false }))
```

---

## MUI Component Quick Reference (used in OralSync)

| Use case | MUI Component |
|----------|--------------|
| Layout container | `Box`, `Stack` |
| Typography | `Typography` |
| Button | `Button` (variant="contained" / "outlined" / "text") |
| Icon button | `IconButton` |
| Text input | `TextField` |
| Select dropdown | `Select` + `MenuItem` inside `FormControl` |
| Table | `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell` |
| Dialog/modal | `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` |
| Loading skeleton | `Skeleton` or `TableLoadingSkeleton` (custom) |
| Chip/tag | `Chip` |
| Date picker | `TextField` with `type="date"` (no MUI X DatePicker needed) |
| Divider | `Divider` |
| Tooltip | `Tooltip` |
| Icons | `@mui/icons-material` — e.g. `EditRoundedIcon`, `DeleteRoundedIcon` |

---

*Last updated: April 2026*
