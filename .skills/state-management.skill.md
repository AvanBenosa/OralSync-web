# Skill: State Management
# OralSync Frontend — State Management Skill

> Use this skill when working with local component state, Zustand global stores,
> or debugging state-related bugs (stale closures, wrong updates, lost data).

---

## Two Types of State in OralSync

| Type | Tool | Persisted | Where |
|------|------|-----------|-------|
| **Feature state** | React `useState` | No — resets on unmount | Inside each feature module |
| **Global state** | Zustand stores | Some — via `persist` | `src/common/store/` |

---

## Feature State (useState)

Every module owns a single `StateModel` object. All state lives in one `useState` call.

### The Golden Rule
Always use the **functional update form** when the new state depends on previous state:

```ts
// ✅ Correct — always safe, no stale closures
setState(prev => ({ ...prev, openModal: true }));

// ❌ Wrong — can produce stale state in async contexts
setState({ ...state, openModal: true });
```

Use the snapshot form (`{ ...state, ... }`) ONLY when you're certain the state hasn't changed between render and update — generally only in synchronous, non-debounced, non-async contexts.

### StateModel shape every feature uses:
```ts
type FeatureStateModel = {
  // Data
  items: FeatureModel[];
  totalItem: number;
  // Loading
  load: boolean;
  // Search + Pagination
  search?: string;
  pageStart: number;
  pageEnd: number;
  initial: number;
  // Modal control
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: FeatureModel;
  // Clinic scope
  clinicProfileId?: string | null;
};
```

### Pagination state transitions:
```ts
// User changes page
setState(prev => ({ ...prev, pageStart: (nextPage - 1) * prev.pageEnd }));

// Search change — always reset to page 0
setState(prev => ({ ...prev, search: value, pageStart: 0 }));
```

### Modal state transitions:
```ts
// Open for create
setState(prev => ({ ...prev, openModal: true, isUpdate: false, isDelete: false }));

// Open for edit
setState(prev => ({ ...prev, openModal: true, isUpdate: true, selectedItem: row }));

// Open for delete
setState(prev => ({ ...prev, openModal: true, isDelete: true, selectedItem: row }));

// Close dialog (onClose)
setState(prev => ({ ...prev, openModal: false }));

// Clean up after dialog animation ends (onExited)
setState(prev => ({ ...prev, isUpdate: false, isDelete: false, selectedItem: undefined }));
```

---

## Global State (Zustand)

Three stores live in `src/common/store/`:

### authStore — `dmd-auth` (persisted to localStorage)

```ts
import { useAuthStore } from 'common/store/authStore';

// Read state (in component)
const user = useAuthStore(state => state.user);
const isLoggedIn = useAuthStore(state => state.isLoggedIn);
const token = useAuthStore(state => state.token);

// Read state (outside component — in service, interceptor, handler)
const token = useAuthStore.getState().token;
const user = useAuthStore.getState().user;

// Write state (outside component)
useAuthStore.getState().logout();
useAuthStore.getState().updateUser({ ...currentUser, isLocked: true });
```

**Key fields on `AuthUser`:**
- `clinicId` — the user's clinic (used everywhere for data scoping)
- `role` / `roleLabel` — user role
- `subscriptionType` — `"basic"` | `"standard"` | `"pro"`
- `isLocked` — clinic is locked (read-only mode)
- `isDataPrivacyAccepted`, `isContractPolicyAccepted`, `forBetaTestingAccepted` — consent flags

### themeStore — `dmd-theme-mode` (persisted to localStorage)

```ts
import { useThemeStore } from 'common/store/themeStore';

const mode = useThemeStore(state => state.mode); // 'light' | 'dark'
const toggleColorMode = useThemeStore(state => state.toggleColorMode);
```

### aiAssistantStore — (session only, not persisted)

```ts
import { useAiAssistantStore } from 'common/store/aiAssistantStore';

const isOpen = useAiAssistantStore(state => state.isOpen);
const open = useAiAssistantStore(state => state.open);
const close = useAiAssistantStore(state => state.close);
```

---

## Common State Bugs and Fixes

### Bug 1 — Stale closure in async handler
```ts
// ❌ Problem: state captured at render time, async completes with stale value
const handleSubmit = async () => {
  await HandleCreateItem(formValues, state, setState);
  setState({ ...state, load: false }); // 'state' is stale here!
};

// ✅ Fix: use functional setState in the handler, not the component
// In handlers.ts:
setState(prev => ({ ...prev, load: false }));
```

### Bug 2 — Dialog not cleaning up selectedItem
```ts
// ❌ Problem: form reopens with old selectedItem data
<Dialog onClose={() => setState(prev => ({ ...prev, openModal: false }))}>

// ✅ Fix: use TransitionProps.onExited to clean up after close animation
<Dialog
  onClose={() => setState(prev => ({ ...prev, openModal: false }))}
  TransitionProps={{ onExited: () => setState(prev => ({
    ...prev, isUpdate: false, isDelete: false, selectedItem: undefined
  })) }}
>
```

### Bug 3 — useEffect loading data twice
```ts
// ❌ Problem: effect runs on every render because state is in dependency array
useEffect(() => { loadItems(); }, [state]); // state changes → triggers → state changes → loop

// ✅ Fix: only depend on the specific values that should trigger a reload
useEffect(() => { loadItems(); }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd]);
```

### Bug 4 — Missing useEffect cleanup causing memory leak
```ts
// ❌ Problem: timeout fires after unmount
useEffect(() => {
  const timer = setTimeout(() => loadItems(), 250);
}, [state.search]);

// ✅ Fix: always return a cleanup function
const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  searchTimeoutRef.current = setTimeout(() => loadItems(), 250);
  return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
}, [state.search]);
```

### Bug 5 — Reading Zustand store state inside an Axios interceptor
```ts
// ❌ Wrong: can't use hooks outside React components
const token = useAuthStore(state => state.token); // throws error

// ✅ Correct: use .getState() for non-hook contexts
const token = useAuthStore.getState().token;
```

---

## Prompt Template — Debug a State Bug

```
I have a state management bug in OralSync. Help me debug it.

## Symptom
{DESCRIBE_WRONG_BEHAVIOR — e.g. "modal opens with old data", "list doesn't update after delete"}

## Feature
File: src/features/{FEATURE_FOLDER}/
Current state model: {PASTE_STATE_MODEL or describe it}

## Relevant code
{PASTE_THE_COMPONENT_OR_HANDLER_CODE}

## What I expect
{EXPECTED_STATE_TRANSITION}

## What actually happens
{ACTUAL_BEHAVIOR}

## Check for these common issues
- [ ] Using `{ ...state, ... }` instead of `prev => ({ ...prev, ... })` in async/debounced context
- [ ] Missing TransitionProps.onExited cleanup on Dialog
- [ ] useEffect dependency array too broad or too narrow
- [ ] Missing useEffect cleanup causing stale timeouts
- [ ] Reading Zustand state with hook syntax outside React component
```

## Prompt Template — Add State to an Existing Module

```
I need to add new state to an existing OralSync module. Keep the pattern consistent.

## Module: {FEATURE_NAME}
## Current StateModel: {PASTE_OR_REFERENCE}

## New state to add
{FIELD_NAME}: {TYPE} — {PURPOSE}
Initial value: {INITIAL_VALUE}

## How it's updated
Trigger: {USER_ACTION or API_RESPONSE}
Update: setState(prev => ({ ...prev, {FIELD_NAME}: {NEW_VALUE} }))

## Update these files
1. api/types.ts — add to {MODULE}StateModel
2. index.tsx — add to useState initial value
3. {COMPONENT_USING_IT} — read from state.{FIELD_NAME}

## Rules
- Do not change existing state field names
- Default value must be set in useState initialization
- If it's a loading flag, prefix with "is" (e.g. isSubmitting, isExporting)
- If it's an open/close flag, use "show" prefix (e.g. showExportDialog)
```

---

*Last updated: April 2026*
