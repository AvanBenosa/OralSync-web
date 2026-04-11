# CLAUDE-PROMPTS.md — OralSync Prompt Library

> Copy-paste prompt templates for Claude when working on OralSync (frontend + backend).
> Replace all `{PLACEHOLDERS}` before sending.
> A copy of this file also lives in the OralSync-API (backend) repo.

---

## Table of Contents

1. [New Full-Stack CRUD Module](#1-new-full-stack-crud-module)
2. [Backend Only — New Feature](#2-backend-only--new-feature)
3. [Frontend Only — New Feature Module](#3-frontend-only--new-feature-module)
4. [Connect Frontend to Existing Backend Endpoint](#4-connect-frontend-to-existing-backend-endpoint)
5. [Fix a Bug — Frontend](#5-fix-a-bug--frontend)
6. [Fix a Bug — Backend](#6-fix-a-bug--backend)
7. [Add a New Field to an Existing Module](#7-add-a-new-field-to-an-existing-module)
8. [Add Validation](#8-add-validation)
9. [Refactor / Code Review](#9-refactor--code-review)
10. [Write a New Background Job (Hangfire)](#10-write-a-new-background-job-hangfire)
11. [Write a Unit Test](#11-write-a-unit-test)
12. [Debugging — Ask Claude to Investigate](#12-debugging--ask-claude-to-investigate)

---

## HOW TO USE THIS FILE

Each prompt has:

- **Purpose** — what it does
- **When to use** — the situation it's meant for
- **The Prompt** — copy the block, fill in `{PLACEHOLDERS}`, paste to Claude

---

## 1. New Full-Stack CRUD Module

**Purpose:** Scaffold a complete new module end-to-end — backend (Domain → Application → Controller) AND frontend (feature folder with api/, types, handlers, form, table, module page).

**When to use:** Building a brand-new entity from scratch that doesn't exist in either repo.

---

```
I'm building a new CRUD module for OralSync. Read CLAUDE.md in both repos first.

## Context
- Backend repo: DMD solution (.NET 8, Clean Architecture, CQRS with MediatR)
- Frontend repo: React 18 + TypeScript, MUI v7, Zustand, Formik + Yup, Axios

## Module to build: {MODULE_NAME}
Entity description: {ENTITY_DESCRIPTION}

## Fields
{FIELD_NAME}: {FIELD_TYPE} — {FIELD_NOTES}
{FIELD_NAME}: {FIELD_TYPE} — {FIELD_NOTES}
(add more rows as needed)

## Backend — generate these files:

### 1. Domain Entity
File: DMD.DOMAIN/Entities/{DOMAIN_FOLDER}/{MODULE_NAME}.cs
- Inherit BaseEntity<int> (or BaseEntity<Guid> if UUID preferred)
- Include all fields above
- Follow soft-delete pattern (IsDeleted is on BaseEntity — do not re-add it)

### 2. Add DbSet to DmdDbContext.Entities.cs
- Add: public DbSet<{MODULE_NAME}> {MODULE_NAME}s { get; set; }
- Add a global query filter scoped to clinicId if this entity belongs to a clinic

### 3. EF Migration command (just print the command, do not run it)

### 4. Application Layer (DMD.APPLICATION/{FEATURE_FOLDER}/{MODULE_NAME}/)
Generate using DentalInventories as the exact pattern:
- Commands/Create/Command.cs — IRequest<Response> + CommandHandler
- Commands/Update/Command.cs — IRequest<Response> + CommandHandler
- Commands/Delete/Command.cs — IRequest<Response> + CommandHandler
- Queries/Get/Query.cs — IRequest<Response> + QueryHandler (paginated, clinic-scoped)
- Models/{MODULE_NAME}Model.cs — DTO response model
- Models/{MODULE_NAME}ModelFactory.cs — maps entity → model

### 5. API Controller
File: DMD/Controllers/{CONTROLLER_FOLDER}/{MODULE_NAME}Controller.cs
- Inherit BaseController
- Inject IMediator
- [Authorize] on the controller
- GET, POST, PUT, DELETE actions following DentalInventoriesController pattern
- Route prefix: /api/dmd/{ROUTE_PREFIX}

## Frontend — generate these files in src/features/{FEATURE_FOLDER}/:

### api/types.ts
- Props type: { clinicId?: string }
- Model type (all fields optional/nullable, matching backend DTO)
- ResponseModel type (items, pageStart, pageEnd, totalCount)
- StateModel type (items, load, search, openModal, isUpdate, isDelete, selectedItem, pagination, clinicProfileId)
- StateProps type (state, setState, onReload?)
- Enum types and label maps if needed

### api/validation.ts
- Yup schema matching backend validation rules exactly

### api/api.ts
- GET function with 5s response cache + deduplication (follow inventory api.ts pattern exactly)
- CREATE, UPDATE, DELETE functions using apiClient
- Use SuccessResponse/ExceptionResponse from common/api/responses

### api/handlers.ts
- HandleGet{MODULE_NAME}s
- HandleCreate{MODULE_NAME}
- HandleUpdate{MODULE_NAME}
- HandleDelete{MODULE_NAME}

### index-content/{MODULE_NAME}-header.tsx — search bar + "Add" button
### index-content/{MODULE_NAME}-table.tsx — MUI table with edit/delete actions
### modal/modal.tsx — delete confirmation dialog
### index-content/{MODULE_NAME}-form.tsx — Formik form using the Yup schema
### index.tsx — main module component (follow InventoryModule index.tsx exactly)

## Routing
Add the new route in src/common/routes/routes.tsx:
Path: /{ROUTE_PATH}
Protect with: ClinicRoute
Layout: MainLayout
Pass clinicId from useAuthStore

## Rules to follow
- All state updates: setState(prev => ({ ...prev, ... })) — never spread stale state
- No hard-coded clinicId — always use resolvedClinicId from useClinicId() hook
- Backend: extract clinicId from JWT claims, never from request body
- Backend: use Normalize() helper for all string fields (trim + null-safe)
- Backend: call RefreshDerivedStatuses() if the entity has computed boolean flags
```

---

## 2. Backend Only — New Feature

**Purpose:** Add a new endpoint + CQRS handler without touching the frontend.

**When to use:** API-only work, adding a command/query to an existing module, or building something the frontend connects to later.

---

```
I need to add a new backend feature to the OralSync API (DMD solution). Read CLAUDE.md in the API repo first.

## What to build
Feature: {FEATURE_DESCRIPTION}
Module/folder: DMD.APPLICATION/{FEATURE_FOLDER}/
HTTP method + route: {HTTP_METHOD} /api/dmd/{ROUTE}

## Type of operation
[ ] Query (read, no state change)
[ ] Command (create / update / delete)

## Request input
{FIELD}: {TYPE}
{FIELD}: {TYPE}

## Expected response
{RESPONSE_DESCRIPTION}

## Generate
1. Command.cs or Query.cs (IRequest<Response> + Handler in same file, following existing patterns)
2. Response model if new (in Models/ folder)
3. Controller action in {CONTROLLER_NAME}Controller.cs — [Http{METHOD}], call IMediator.Send()
4. Any new domain entity changes if needed
5. Print EF migration command if schema changes

## Rules to follow
- Extract clinicId from JWT: httpContextAccessor.HttpContext?.User.FindFirstValue("clinicId")
- Return BadRequestResponse for validation failures, SuccessResponse<T> for success
- Validate inside the handler using a private static ValidateRequest() method
- Normalize all string inputs with value?.Trim() ?? string.Empty
- Soft delete only — set IsDeleted = true, never .Remove() from DB
- Never bypass global query filters unless the user is SuperAdmin
```

---

## 3. Frontend Only — New Feature Module

**Purpose:** Scaffold a full frontend feature module connecting to an already-existing backend endpoint.

**When to use:** Backend is done, you need the React UI for it.

---

```
I need to build a new frontend module for OralSync. Read CLAUDE.md in the frontend repo first.

## Module: {MODULE_NAME}
Route: /{ROUTE_PATH}
Description: {DESCRIPTION}

## Backend endpoints (already exist)
GET    {GET_ENDPOINT}     — returns { items: [], pageStart, pageEnd, totalCount }
POST   {CREATE_ENDPOINT}  — body: {REQUEST_SHAPE}
PUT    {UPDATE_ENDPOINT}  — body: {REQUEST_SHAPE}
DELETE {DELETE_ENDPOINT}  — body: { id }

## Model fields (from backend response)
{FIELD}: {TS_TYPE}
{FIELD}: {TS_TYPE}

## Generate these files in src/features/{FEATURE_FOLDER}/:

### api/types.ts
- All types following the inventory module types.ts as the exact pattern
- Include Props, Model, ResponseModel, StateModel, StateProps types
- Add enum types + label maps if needed for: {ENUM_FIELDS_IF_ANY}

### api/validation.ts
- Yup schema for create/update form
- Required fields: {REQUIRED_FIELDS}
- Optional fields: {OPTIONAL_FIELDS}

### api/api.ts
- Follow the inventory api.ts pattern exactly (5s cache, deduplication Map, forceRefresh flag)

### api/handlers.ts
- HandleGet, HandleCreate, HandleUpdate, HandleDelete following inventory handlers.ts

### index-content/{MODULE_NAME}-header.tsx — search + Add button
### index-content/{MODULE_NAME}-table.tsx — MUI Table with columns: {COLUMNS_TO_SHOW}
### modal/modal.tsx — delete confirmation dialog
### index-content/{MODULE_NAME}-form.tsx — Formik form with fields: {FIELDS_TO_SHOW_IN_FORM}
### index.tsx — follow InventoryModule (index.tsx) exactly

## Route to add in src/common/routes/routes.tsx
Path: /{ROUTE_PATH} — Guard: ClinicRoute — Layout: MainLayout

## SideNav link
Label: "{NAV_LABEL}", Icon: {MUI_ICON_NAME}, Path: /{ROUTE_PATH}
```

---

## 4. Connect Frontend to Existing Backend Endpoint

**Purpose:** Wire up a single API call to the frontend without building a full module.

**When to use:** Quick API integration — one call, one form, one data fetch.

---

```
I need to connect a frontend component to an existing OralSync backend endpoint.

## Endpoint
Method: {GET|POST|PUT|DELETE}
URL: /api/dmd/{ENDPOINT_PATH}
Auth required: Yes (JWT Bearer — handled automatically by apiClient interceptor)

## Request body / params
{FIELD}: {TYPE}

## Response shape
{RESPONSE_SHAPE}

## Frontend location
File to update: src/features/{FEATURE_FOLDER}/api/

## Generate

### In api/api.ts — add the function:
- Use apiClient from common/services/api-client
- Use SuccessResponse / ExceptionResponse from common/api/responses
- Follow the CreateInventory / GetInventories error-handling pattern

### In api/handlers.ts — add the handler:
- Call the api function above
- Update setState with: setState(prev => ({ ...prev, ... }))

### In the component — show where/how to call the handler
- Show what state to update
- Show how to give success/error feedback (toast)

## Rules
- Never use raw fetch() — always use apiClient
- Never construct Authorization headers manually
- For /storage/ file paths: use resolveProtectedApiAssetUrl() or loadProtectedAssetObjectUrl()
```

---

## 5. Fix a Bug — Frontend

**Purpose:** Structured bug report so Claude has enough context before suggesting a fix.

**When to use:** Something isn't working in the React app.

---

```
There's a bug in the OralSync frontend. Read CLAUDE.md in the frontend repo before answering.

## Bug description
{DESCRIBE_WHAT_IS_WRONG}

## Where it happens
File(s): src/features/{FEATURE_FOLDER}/{FILE_NAME}
Route: /{ROUTE_PATH}
Triggered by: {USER_ACTION}

## Expected behavior
{WHAT_SHOULD_HAPPEN}

## Actual behavior
{WHAT_ACTUALLY_HAPPENS}

## Error message / console output
{PASTE_HERE or "none"}

## Relevant code
{PASTE_SNIPPET}

## What I've already tried
{ANYTHING_YOU_TRIED}

## Fix rules
- Do NOT change unrelated code
- Use functional setState: setState(prev => ({ ...prev, ... }))
- No new dependencies unless absolutely necessary
- TypeScript strict mode is on — no `any` in the fix
- If the fix needs a new API call, follow api.ts + handlers.ts pattern
```

---

## 6. Fix a Bug — Backend

**Purpose:** Same as above but for the .NET API.

**When to use:** API returning wrong data, 500 errors, EF query issues, auth/clinic scoping problems.

---

```
There's a bug in the OralSync API (DMD solution). Read CLAUDE.md in the API repo before answering.

## Bug description
{DESCRIBE_WHAT_IS_WRONG}

## Where it happens
Project: {DMD | DMD.APPLICATION | DMD.DOMAIN | DMD.PERSISTENCE | DMD.SERVICES | DMD.HANGFIRE}
File(s): {FILE_PATH}
Endpoint: {HTTP_METHOD} /api/dmd/{ROUTE}

## Expected behavior
{WHAT_SHOULD_HAPPEN}

## Actual behavior
{WHAT_ACTUALLY_HAPPENS}

## Error / exception
{PASTE_EXCEPTION_AND_STACK_TRACE or "none"}

## Relevant code
{PASTE_SNIPPET}

## Fix rules
- Do NOT disable global query filters without a documented reason
- Do NOT change entity schema without also printing the EF migration command
- Soft delete only — IsDeleted = true, never dbContext.Remove()
- Always extract clinicId from JWT claims, not from request body
- Return BadRequestResponse (do not throw) for validation errors inside handlers
- If the fix changes a Command/Query, check if the Controller action also needs updating
```

---

## 7. Add a New Field to an Existing Module

**Purpose:** Add one or more fields to an entity that already exists in both repos.

**When to use:** Feature extension — new column on an existing table, exposed in both API and UI.

---

```
I need to add new field(s) to an existing OralSync module. Update both repos.

## Module: {MODULE_NAME}
Backend entity: DMD.DOMAIN/Entities/{ENTITY_PATH}.cs
Backend application: DMD.APPLICATION/{FEATURE_FOLDER}/
Frontend feature: src/features/{FEATURE_FOLDER}/

## New field(s)
{FIELD_NAME}: {C_SHARP_TYPE} — {DESCRIPTION}
  Frontend type: {TS_TYPE}
  Required: {YES/NO}
  Validation rule: {RULE}

## Backend changes
1. Add field to: DMD.DOMAIN/Entities/{ENTITY}.cs
2. Add to Create/Command.cs and Update/Command.cs (request + handler mapping)
3. Add to Query response model + factory
4. Add to Models/{MODULE_NAME}Model.cs
5. Add validation in ValidateRequest() if required
6. Print the EF migration command

## Frontend changes
1. Add to api/types.ts → {MODULE_NAME}Model
2. Add to api/validation.ts → Yup schema
3. Add form field in index-content/{MODULE_NAME}-form.tsx
4. Add column in index-content/{MODULE_NAME}-table.tsx (if displayable)
5. Include field in create/update request objects in handlers.ts

## Rules
- camelCase on frontend, PascalCase on backend — do not mix
- Optional fields: nullable C# type + optional TS type (field?: type)
- If it's a dropdown: add enum to DMD.DOMAIN/Enums/ + TS enum + label map in frontend types.ts
- Do not reorder or rename existing fields
```

---

## 8. Add Validation

**Purpose:** Add or fix validation in either or both layers.

**When to use:** Missing validation, wrong error messages, rules inconsistent between frontend and backend.

---

```
I need to add/fix validation for {MODULE_NAME} in OralSync.

## Where to apply
[ ] Frontend only (Yup schema in api/validation.ts)
[ ] Backend only (ValidateRequest() in Command handler)
[ ] Both (keep rules in sync)

## Field(s) and rules
{FIELD_NAME}:
  - Required: {YES/NO}
  - Max length: {VALUE}
  - Pattern: {PATTERN or "none"}
  - Cross-field rule: {DESCRIPTION or "none"}
  - Error message: "{EXACT_MESSAGE}"

## Frontend — src/features/{FEATURE_FOLDER}/api/validation.ts
- Use Yup, following inventoryValidationSchema pattern
- .nullable() for optional string/date fields
- .transform() for number fields: (v, orig) => orig === '' ? 0 : v
- Custom .test() for cross-field rules (e.g. expiry after manufacturing)

## Backend — DMD.APPLICATION/{FEATURE_FOLDER}/Commands/{Op}/Command.cs
- In private static string? ValidateRequest(Command request)
- Return error string on failure, null on success
- Validate enums with Enum.IsDefined()
- Validate email with new EmailAddressAttribute().IsValid()
- Return BadRequestResponse(message) in the handler

## Rules
- Frontend and backend error messages must match for the same field
- Never put validation logic inside Formik onSubmit — use the Yup schema only
- Backend is the source of truth — frontend validation is a UX aid, not a security gate
```

---

## 9. Refactor / Code Review

**Purpose:** Ask Claude to review and improve a file or feature.

**When to use:** Before committing, or when a file is getting too large/complex.

---

```
Please review and refactor the following OralSync code. Read CLAUDE.md for the relevant repo first.

## File(s) to review
{FILE_PATH(S)}

## Code
{PASTE_CODE}

## What to look for
[ ] TypeScript type safety (no `any`, proper nullability)
[ ] State correctness (functional setState, no stale closures, no direct mutation)
[ ] API call patterns (uses apiClient, SuccessResponse/ExceptionResponse, cache/dedup)
[ ] Component size (split if over ~200 lines)
[ ] Naming consistency (camelCase TS, PascalCase C#)
[ ] Missing error handling / user feedback (toast)
[ ] Performance (unnecessary re-renders, missing cleanup in useEffect)
[ ] Backend: missing clinic scoping, missing soft-delete, hardcoded values
[ ] Backend: business logic in controllers instead of handlers

## Output format
1. List issues with file + line reference
2. Show refactored code only for changed sections
3. Explain each change
4. Do NOT rewrite unchanged code
```

---

## 10. Write a New Background Job (Hangfire)

**Purpose:** Add a new scheduled or recurring job to DMD.HANGFIRE.

**When to use:** Automated tasks — reminders, auto-locks, cleanup, report generation.

---

```
I need to add a new Hangfire background job to the OralSync API. Read CLAUDE.md in the API repo.

## Job name: {JOB_NAME}
## Purpose: {WHAT_THE_JOB_DOES}
## Schedule: {CRON_EXPRESSION or "On-demand" or "Triggered by event"}

## What it needs to do
{STEP_BY_STEP_DESCRIPTION}

## Data / services needed
{ENTITIES_OR_SERVICES}

## Generate in DMD.HANGFIRE/{JOB_FOLDER}/

### I{JOB_NAME}Job.cs
- Interface: Task ExecuteAsync(CancellationToken cancellationToken = default);

### {JOB_NAME}Job.cs
- Implements I{JOB_NAME}Job
- Inject IServiceScopeFactory (for scoped DbContext) + ILogger<{JOB_NAME}Job>
- Follow AppointmentReminderJob.cs as the pattern

### {JOB_NAME}Settings.cs (if configurable)
- POCO settings class bound from appsettings.json

### Registration snippet for DMD.HANGFIRE/Program.cs
RecurringJob.AddOrUpdate<I{JOB_NAME}Job>(
    "{JOB_ID}",
    job => job.ExecuteAsync(CancellationToken.None),
    "{CRON_EXPRESSION}");

## Rules
- Always use IServiceScopeFactory to resolve DbContext (it's scoped)
- Log start, completion, and errors using ILogger
- Catch all exceptions and log them — never crash the job host
- Filter IsDeleted == false in all queries
- Respect clinic isolation where applicable
```

---

## 11. Write a Unit Test

**Purpose:** Generate tests for a handler, service, or utility function.

**When to use:** TDD or adding coverage to existing code.

---

```
Write unit tests for the following OralSync code.

## What to test
File: {FILE_PATH}
Class/function: {CLASS_OR_FUNCTION_NAME}
Type: [ ] Backend (.NET xUnit)  [ ] Frontend (Jest + React Testing Library)

## Code under test
{PASTE_CODE}

## Scenarios to cover
1. Happy path — {DESCRIPTION}
2. Validation failure — {DESCRIPTION}
3. Edge case — {DESCRIPTION}

## Backend test rules (if .NET)
- Use xUnit
- Mock DmdDbContext with in-memory EF provider or Moq
- Mock IHttpContextAccessor with a fake clinicId claim
- Assert on response type: SuccessResponse<T> vs BadRequestResponse
- Do not test EF internals — test handler behavior

## Frontend test rules (if React)
- Use Jest + React Testing Library
- Mock apiClient with jest.fn() or msw
- Mock Zustand stores using useAuthStore.setState({ ... })
- Test user interactions: render → userEvent → assert DOM or toast
- Do not test implementation details — test what the user sees and experiences
```

---

## 12. Debugging — Ask Claude to Investigate

**Purpose:** When you don't know what's wrong — give Claude the symptoms and let it find the issue.

**When to use:** Mysterious bugs, intermittent issues, unexpected data, performance problems.

---

```
Something is wrong in OralSync and I'm not sure where the issue is. Please help me investigate.

## Symptom
{DESCRIBE_WHAT_YOU_SEE — be specific: wrong data, blank screen, slow response, unexpected redirect, etc.}

## When does it happen
{ALWAYS / SOMETIMES / ONLY WHEN / AFTER DOING X}

## Affected area
[ ] Frontend only  [ ] Backend only  [ ] Both (full-stack)
Page/route: {ROUTE}
API endpoint: {ENDPOINT_IF_KNOWN}

## What I can see
Browser console: {PASTE or "no errors"}
Network tab (request + response): {PASTE or "n/a"}
API logs: {PASTE or "n/a"}
Error message: {PASTE or "none"}

## Files I suspect are involved
{LIST_FILES}

## What I want
1. Hypothesize the most likely root cause
2. Tell me which specific files/lines to check first
3. Suggest a targeted fix
4. Explain what to verify after the fix

## Context reminders
- Backend: EF Global Query Filters scope all data to clinicId from JWT — data not showing = filter issue
- Frontend: apiClient auto-logouts on 401, sets isLocked on 423
- Frontend: Zustand authStore persisted to localStorage key "dmd-auth"
- Frontend: stale closures in useEffect are a common state bug — check dependency arrays
- Backend: soft delete (IsDeleted = true) — missing data may be soft-deleted, not missing
```

---

## Quick Reference — Common Patterns

### Frontend

| Task               | File                                       | Reference Pattern                       |
| ------------------ | ------------------------------------------ | --------------------------------------- |
| New API call       | `features/{x}/api/api.ts`                  | `GetInventories`, `CreateInventory`     |
| New handler        | `features/{x}/api/handlers.ts`             | `HandleGetInventories`                  |
| New type           | `features/{x}/api/types.ts`                | `InventoryModel`, `InventoryStateModel` |
| New Yup validation | `features/{x}/api/validation.ts`           | `inventoryValidationSchema`             |
| New form           | `features/{x}/index-content/{x}-form.tsx`  | Formik + Yup                            |
| New table          | `features/{x}/index-content/{x}-table.tsx` | MUI Table                               |
| New module page    | `features/{x}/index.tsx`                   | `InventoryModule`                       |
| New route          | `common/routes/routes.tsx`                 | ClinicRoute + MainLayout                |
| Global state       | `common/store/`                            | Zustand `create()` + `persist()`        |
| Protected file URL | `common/services/api-client.ts`            | `loadProtectedAssetObjectUrl()`         |

### Backend

| Task               | File                                               | Reference Pattern                                                                 |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| New entity         | `DMD.DOMAIN/Entities/{x}/{x}.cs`                   | `BaseEntity<int>`                                                                 |
| New command        | `DMD.APPLICATION/{x}/Commands/{Op}/Command.cs`     | `CreateDentalInventoryCommand`                                                    |
| New query          | `DMD.APPLICATION/{x}/Queries/Get/Query.cs`         | DentalInventories Get pattern                                                     |
| New response model | `DMD.APPLICATION/{x}/Models/{x}Model.cs`           | `DentalInventoryModel`                                                            |
| New controller     | `DMD/Controllers/{x}/{x}Controller.cs`             | `DentalInventoriesController`                                                     |
| New background job | `DMD.HANGFIRE/{x}/`                                | `AppointmentReminderJob`                                                          |
| DbContext change   | `DMD.PERSISTENCE/Context/DmdDbContext.Entities.cs` | DbSet + query filter                                                              |
| Migration          | CLI                                                | `dotnet ef migrations add {Name} --project DMD.PERSISTENCE --startup-project DMD` |

### Common Mistakes to Avoid

**Frontend**

- ❌ `setState({ ...state, x })` → ✅ `setState(prev => ({ ...prev, x }))`
- ❌ `fetch()` → ✅ `apiClient` from `common/services/api-client`
- ❌ `/storage/...` raw URL → ✅ `resolveProtectedApiAssetUrl(path)`
- ❌ `localStorage.setItem()` → ✅ Zustand `persist` middleware
- ❌ `any` type → ✅ Proper TypeScript types

**Backend**

- ❌ `dbContext.Remove(item)` → ✅ `item.IsDeleted = true`
- ❌ `request.ClinicId` from body → ✅ JWT claim: `FindFirstValue("clinicId")`
- ❌ `throw new Exception()` in handler → ✅ `return new BadRequestResponse("...")`
- ❌ Business logic in controller → ✅ In the command/query handler
- ❌ Skipping query filters without comment → ✅ Only for SuperAdmin, documented

---

_Last updated: April 2026_
