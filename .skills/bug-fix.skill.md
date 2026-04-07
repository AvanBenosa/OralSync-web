# Skill: Bug Fix
# OralSync Frontend — Bug Fix Skill

> Use this skill to diagnose and fix bugs efficiently.
> The skill tells Claude exactly what context it needs and which patterns to check first.

---

## Bug Categories in OralSync

| Category | Common Symptoms | Likely Cause |
|----------|----------------|--------------|
| **State bug** | Wrong data in form, list not updating, modal shows old item | Stale closure, missing functional setState, wrong onExited cleanup |
| **API bug** | No data loading, wrong data, endless spinner | Cache hit returning stale data, wrong query params, missing clinicId |
| **Auth bug** | Redirect to login unexpectedly, data not loading | Token expired, 401 not handled, clinicId missing from JWT |
| **Clinic scope bug** | Sees other clinic's data or no data at all | `resolvedClinicId` is null, `useClinicId()` not called, clinicId not passed to handler |
| **Type error** | TypeScript build fails, red squiggles | Nullable not handled, wrong type assertion, `any` used incorrectly |
| **Form bug** | Validation not firing, wrong initial values, submit not working | Yup schema mismatch, Formik `initialValues` using stale `selectedItem`, wrong `onSubmit` wiring |
| **Routing bug** | Wrong page shown, redirect loop, route not found | Guard condition wrong, `isBasicSubscription` blocking unexpectedly |
| **UI bug** | Layout broken, dialog won't close, infinite re-render | Missing `key` prop, wrong MUI Dialog props, useEffect loop |

---

## Diagnostic Checklist

Before asking Claude to fix, run through this mental checklist:

### For state bugs
- [ ] Is setState using functional form `prev => ({ ...prev, ... })`?
- [ ] Is `selectedItem` being reset in `TransitionProps.onExited`?
- [ ] Is the useEffect dependency array correct?
- [ ] Are cleanup functions returned from useEffect?
- [ ] Is `lastLoadedClinicIdRef` tracking clinic changes correctly?

### For API/data bugs
- [ ] Is `resolvedClinicId` populated? (Check with `console.log`)
- [ ] Is the endpoint URL correct? (Check Network tab)
- [ ] Is the response cache blocking a fresh fetch? (Try `forceRefresh: true`)
- [ ] Is `ExceptionResponse` swallowing the error silently? (Check console)
- [ ] Does the query param name match what the backend expects? (`Que` not `query`, `ClinicId` not `clinicId`)

### For form bugs
- [ ] Does `initialValues` match the Yup schema field names exactly?
- [ ] Are number fields using `.transform((v, orig) => orig === '' ? 0 : v)` in the schema?
- [ ] Is `enableReinitialize` needed when `selectedItem` changes?
- [ ] Is the form inside a `<Dialog>` that re-mounts on open? (Formik re-initializes on mount)

### For auth/clinic scope bugs
- [ ] Is the user logged in and token not expired? (`isTokenExpired(token)`)
- [ ] Does `useAuthStore.getState().user?.clinicId` have a value?
- [ ] Is `useClinicId(clinicId)` being called and its return value used?
- [ ] Is the route protected with the right guard (`ClinicRoute` vs `AdminRoute`)?

---

## Prompt Template — General Bug Fix

```
There's a bug in the OralSync frontend. Read CLAUDE.md and the bug-fix skill before answering.

## Category
[ ] State bug  [ ] API bug  [ ] Auth/scope bug  [ ] Type error  [ ] Form bug  [ ] UI bug

## Bug description
{WHAT_IS_WRONG — be specific}

## File(s) involved
{FILE_PATHS}

## Steps to reproduce
1. {STEP}
2. {STEP}
3. {STEP}

## Expected
{WHAT_SHOULD_HAPPEN}

## Actual
{WHAT_HAPPENS}

## Error output
Browser console: {PASTE or "none"}
Network tab: {PASTE response or "n/a"}

## Relevant code
{PASTE_SNIPPET}

## What I've tried
{LIST}

## Fix constraints
- Minimal change — do not refactor unrelated code
- Preserve StateModel shape
- TypeScript strict — no `any`
- Use functional setState
```

---

## Prompt Template — Form Bug Fix

```
There's a bug in an OralSync Formik form. Read CLAUDE.md before answering.

## File: src/features/{FEATURE_FOLDER}/index-content/{FEATURE}-form.tsx
## Validation schema: src/features/{FEATURE_FOLDER}/api/validation.ts

## Bug
{DESCRIBE_FORM_ISSUE — e.g. "validation not triggering", "wrong initial values on edit", "submit fires with empty values"}

## Current form code
{PASTE_FORMIK_SETUP — initialValues, validationSchema, onSubmit}

## Current Yup schema
{PASTE_SCHEMA}

## State at the time of bug
isUpdate: {true/false}
selectedItem: {PASTE_OBJECT or "undefined"}

## What I expect
{EXPECTED_BEHAVIOR}

## Fix rules
- initialValues must use selectedItem fields when isUpdate is true, empty defaults otherwise
- Add enableReinitialize={true} if selectedItem can change while form is mounted
- Number fields in Yup must have .transform((v, orig) => orig === '' ? 0 : v) to handle empty strings
- Never call setState inside onSubmit — delegate to the handler
```

---

## Prompt Template — API / Data Not Loading Bug

```
Data is not loading correctly in OralSync. Help me find why.

## Feature: {FEATURE_NAME}
## Expected: {WHAT_DATA_SHOULD_APPEAR}
## Actual: {WHAT_APPEARS — empty, wrong data, spinner stuck}

## Check these:

### 1. State of resolvedClinicId
Value of resolvedClinicId when load is called: {VALUE or "unknown"}

### 2. Network request
Was a request made? {YES/NO}
URL called: {PASTE or "unknown"}
Query params sent: {PASTE or "unknown"}
Response received: {PASTE or "unknown"}
Status code: {CODE or "no request made"}

### 3. Handler code
{PASTE_HANDLER}

### 4. api.ts code
{PASTE_GET_FUNCTION}

## Suspected cause
[ ] resolvedClinicId is null — useClinicId not resolving
[ ] Cache returning stale data — needs forceRefresh
[ ] Wrong query param names sent to backend
[ ] ExceptionResponse catching and swallowing error silently
[ ] useEffect dependency array not re-triggering load
[ ] State.load never set to true so skeleton never shows
```

---

## Prompt Template — TypeScript Error Fix

```
I have a TypeScript error in OralSync. Fix it without using `any`.

## File: {FILE_PATH}
## Error message:
{PASTE_FULL_TS_ERROR}

## Code causing the error:
{PASTE_CODE}

## Context
{DESCRIBE_WHAT_THE_CODE_IS_TRYING_TO_DO}

## Fix rules
- No `any` types — use proper types, `unknown` with guard, or specific union types
- Nullable API fields: use `field?: Type | null` not optional-only
- For array operations on possibly-undefined arrays: use `(arr ?? []).map(...)`
- For optional chaining: prefer `obj?.field` over `obj && obj.field`
- Do not widen types to fix errors — narrow them correctly
```

---

## Known OralSync-Specific Bug Patterns

### "Data disappears after navigating away and back"
- Cause: StateModel is initialized fresh on mount (no persistent cache at component level)
- Fix: Increase cache TTL in api.ts, or accept that re-fetching is intentional

### "Form always shows empty even in edit mode"
- Cause: `initialValues` not using `state.selectedItem`, or `enableReinitialize` missing
- Fix: `initialValues={{ name: state.selectedItem?.name ?? '', ... }}` + `enableReinitialize`

### "Delete removes wrong item from list"
- Cause: `state.items.filter` using stale `state.selectedItem` captured in closure
- Fix: Use functional setState: `setState(prev => ({ ...prev, items: prev.items.filter(...) }))`

### "Spinner stuck after error"
- Cause: `load: false` not set in the catch block
- Fix: Add `setState(prev => ({ ...prev, load: false }))` in the catch of `loadItems()`

### "Modal flashes old content before animating out"
- Cause: `selectedItem` cleared too early (in `onClose` instead of `onExited`)
- Fix: Move `selectedItem: undefined` to `TransitionProps.onExited`

### "API called twice on mount"
- Cause: useEffect runs twice in React Strict Mode (dev only), or two effects triggering the same load
- Fix: Add a `lastLoadedClinicIdRef` to skip redundant loads when clinicId hasn't changed

---

*Last updated: April 2026*
