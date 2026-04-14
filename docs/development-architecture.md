# OralSync Development Architecture

Updated: April 14, 2026

This document is for developers working across the frontend repo (`OralSync`) and the sibling backend repo (`../OralSync-API`).

## 1. Repository Layout

The current implementation is split across two local repos:

```text
OralSync/                 React frontend
../OralSync-API/          ASP.NET Core API, EF Core persistence, services, Hangfire worker
```

### 1.1 Frontend repo

Key frontend folders:

```text
src/
  common/                 shared services, stores, hooks, utilities, routes
  features/               product modules
  App.tsx                 root app
  mainLayout.tsx          clinic portal shell
  adminLayout.tsx         admin portal shell
public/
  manifest.json
  service-worker.js
```

### 1.2 Backend repo

Key backend projects:

```text
DMD/                      ASP.NET Core API host
DMD.APPLICATION/          MediatR commands, queries, models, mapping
DMD.DOMAIN/               entities and enums
DMD.PERSISTENCE/          EF Core DbContext and migrations
DMD.SERVICES/             email, SMS, payment, protection services
DMD.HANGFIRE/             background worker host
```

## 2. Runtime Topology

```text
[Browser / PWA]
    |
    | HTTPS
    v
[OralSync React SPA]
    |
    | REST + JWT
    v
[DMD ASP.NET Core API]
    |
    +--> SQL Server application DB
    +--> SQL Server Hangfire DB
    +--> Local storage or Azure Blob storage
    +--> OpenAI Responses API
    +--> Semaphore SMS
    +--> Gmail SMTP
    +--> PayMongo

[DMD.HANGFIRE Worker]
    |
    +--> SQL Server Hangfire DB
    +--> SQL Server application DB
    +--> Semaphore SMS
    +--> Gmail SMTP
```

## 3. Frontend Architecture

### 3.1 Framework and shell

The frontend is a React 18 + TypeScript SPA built with Create React App. Routing is handled with `react-router-dom`.

Primary shells:

- `MainLayout`: clinic portal shell, consent enforcement, lock handling, branch selection, AI assistant integration
- `AdminLayout`: admin portal shell

### 3.2 Feature organization

The frontend uses feature folders under `src/features/`. Major modules currently include:

- `dashboard`
- `patient`
- `patient-profile`
- `patient-profile-modules/*`
- `appointment/appointment-request`
- `inventory`
- `dental-lab-cases`
- `finance-overview`
- `invoice-generator`
- `settings`
- `subscription`
- `public-registration`
- `admin-portal/*`

Each feature generally carries its own:

- API layer
- Types
- Handlers
- Validation
- Screens and components
- Modals

### 3.3 Shared services and state

Core shared frontend pieces:

- `src/common/services/api-client.ts`: shared Axios client with auth header injection
- `src/common/store/authStore.tsx`: persisted auth session store
- `src/common/store/themeStore.ts`: theme persistence
- `src/common/store/aiAssistantStore.ts`: AI drawer state
- `src/common/routes/route-guards.tsx`: portal-aware route guards
- `src/common/components/ClinicId`: clinic ID resolution helper

### 3.4 Route protection

Frontend route guards:

- `PublicRoute`: only for non-authenticated users
- `ClinicRoute`: only for clinic portal users
- `AdminRoute`: only for admin portal users

Portal routing uses `portalType` from the authenticated user model.

### 3.5 API client behavior

The shared Axios client:

- Reads the JWT from Zustand
- Adds `Authorization: Bearer <token>`
- Logs out on `401`
- Marks the session as locked on `423`
- Uses a default `30000ms` timeout

### 3.6 PWA implementation

The service worker uses:

- App shell caching for navigations
- Stale-while-revalidate for static assets
- No caching for `/api/*`
- No caching for `/storage/*`

## 4. Backend Architecture

### 4.1 API host

`../OralSync-API/DMD/Program.cs` wires the main API host together. Verified responsibilities:

- CORS setup
- JWT authentication
- Swagger registration
- EF Core database registration
- MediatR registration
- AutoMapper registration
- FluentValidation registration
- Identity registration
- Email, SMS, storage, PayMongo, and AI service registration
- Response compression and output caching
- Hangfire storage registration
- Controller and MVC filter registration

Development-only startup behavior:

- Applies migrations automatically
- Seeds the database automatically
- Attempts to ensure the Hangfire database exists

Production behavior:

- Skips automatic database setup

### 4.2 Application structure

The backend follows a thin-controller pattern with MediatR-based request dispatch. In practice:

- Controllers receive HTTP requests
- Controllers send commands or queries through `Mediator.Send(...)`
- Handlers inside `DMD.APPLICATION` implement the business logic
- EF Core persistence lives in `DMD.PERSISTENCE`

### 4.3 Domain and persistence

`DmdDbContext` is the main EF Core context. It contains DbSets for:

- Clinic profiles and branches
- Users and branch access
- Patients and patient sub-records
- Appointment requests
- Dental inventories
- Clinic expenses
- Lab providers and lab cases
- Subscription histories and payment transactions
- Audit logs and notification logs

The context also configures:

- Global query filters
- Branch-aware data filters
- Relationship mapping
- Indexes
- Decimal precision for financial and stock values

## 5. Authentication, Authorization, and Data Isolation

### 5.1 JWT

The backend generates JWTs in `AuthResponseFactory`. Verified claim usage includes:

- `role`
- `clinicId`
- `currentScope`
- `branchId`
- `defaultBranchId`

Default JWT expiry in current appsettings is 60 minutes.

### 5.2 Controller authorization

All controllers inheriting `BaseController` are protected by JWT bearer auth unless an action explicitly uses `[AllowAnonymous]`.

### 5.3 Tenant isolation

The main data isolation model is clinic-scoped access through EF Core query filters in `DmdDbContext`.

Verified behavior:

- Clinic data is filtered by `clinicId` from JWT claims
- Branch-scoped roles are additionally filtered by branch
- Platform super admins without a clinic ID bypass clinic filters

Branch enforcement currently applies to these roles in the context logic:

- BranchAdmin
- Dentist
- Assistant
- Receptionist

### 5.4 Locked clinic enforcement

`ActionValidationFilterAttribute` blocks most requests for locked clinics and returns HTTP `423 Locked`.

Allowed exceptions include:

- Login and registration routes
- Clinic data privacy status route
- Payment creation, upload, and payment-status polling routes

### 5.5 Protected IDs

The backend uses `IProtectionProvider` and `ProtectedIdExtensions` to encrypt and decrypt IDs exposed to the frontend. This is used in multiple modules, including clinic, patient, user, and branch identifiers.

## 6. Storage Architecture

### 6.1 Storage providers

Storage is abstracted behind `IClinicStorageService`.

Supported providers:

- Local file storage
- Azure Blob Storage

Provider selection is based on `Storage:Provider`.

### 6.2 Path structure

Clinic file storage paths are organized under:

```text
/storage/clinics/{clinicId}/...
```

### 6.3 Public vs protected file serving

Current storage controller behavior:

- Public endpoint: `/storage/{*filePath}` used only for allowed public banner assets
- Protected endpoint: `/api/dmd/storage/{*filePath}` requires a JWT whose `clinicId` matches the requested clinic path
- SAS endpoint: `/api/dmd/storage/sas/{*filePath}` available when the provider supports SAS generation

On local storage, SAS generation returns `501 Not Implemented`.

## 7. AI Assistant Architecture

### 7.1 Frontend request shape

The frontend sends:

- `messages`
- `routeContext`
- optional `patientId`

### 7.2 Backend AI service

The backend AI service is `OpenAiAssistantService`.

Verified behavior:

- Uses the OpenAI Responses API
- Reads model and connection options from `OpenAI` configuration
- Limits conversation history to `MaxConversationMessages`
- Defaults to a 12-message window when configuration is absent

### 7.3 Patient context enrichment

When `patientId` is supplied, the service builds a patient context payload from:

- Patient info
- Latest medical history
- Recent progress notes
- Latest perio chart
- Recent appointments

The assistant is instructed to:

- Be concise and practical
- Avoid claiming system-side actions it did not perform
- Avoid diagnosis or prescribing
- State clearly when information is missing

## 8. Payments and Subscription Billing

### 8.1 Clinic-side payment flow

The current clinic subscription flow uses these backend payment routes:

- `/api/dmd/payments/create-payment-link`
- `/api/dmd/payments/status`
- `/api/dmd/payments/create-manual-payment`
- `/api/dmd/payments/upload-manual-payment-proof`
- `/api/dmd/payments/manual-payment-status`
- `/api/dmd/payments/manual-payment-transactions`

Additional verified routes:

- `/api/dmd/payments/simulate-paid`: local development helper
- `/api/dmd/payments/webhook`: PayMongo webhook receiver

### 8.2 PayMongo integration

PayMongo is registered through `AddDmdPayMongoServices`. The current implementation validates:

- Secret key
- Webhook secret
- Base URL
- Timeout

### 8.3 Manual payment review

Admin manual payment review is handled from the admin controller group and surfaced in the admin portal payment request UI.

## 9. Background Jobs (Hangfire)

### 9.1 Worker host

`../OralSync-API/DMD.HANGFIRE/Program.cs` runs a separate Hangfire server and exposes:

- `/hangfire`
- `/health`

It also verifies or creates the Hangfire database before starting recurring jobs.

### 9.2 Current recurring jobs

Verified recurring job IDs and their default schedules from `DMD.HANGFIRE/appsettings.json`:

| Job ID | Purpose | Default cron | Time zone |
|---|---|---|---|
| `patient-appointment-sms-reminders-evening-before` | Evening-before reminders | `0 18 * * *` | `Asia/Manila` |
| `patient-appointment-sms-reminders-morning-of` | Morning-of reminders | `0 6 * * *` | `Asia/Manila` |
| `clinic-profile-auto-lock-expired-validity` | Auto-lock expired clinics | `0 0 * * *` | `Asia/Manila` |
| `clinic-profile-trial-ending-reminders` | Trial ending reminders | `0 9 * * *` | `Asia/Manila` |
| `patient-birthday-sms-greetings` | Birthday greeting SMS | `0 0 * * *` | `Asia/Manila` |

Extra verified trial-ending settings:

- Reminder days before end: `7`, `3`, `1`
- Subscription type filter includes `Basic`

## 10. Conventions and Current Implementation Notes

Verified conventions in the current code:

- Controllers are thin and delegate to MediatR handlers
- Response compression and output caching are enabled
- MVC filters handle model validation and locked-clinic blocking
- Protected file access is clinic-scoped
- Frontend protected asset loading goes through helper utilities
- PWA caching excludes API and protected storage requests

Current implementation notes worth keeping in mind:

- The patient profile `Lab Cases` tab is present but not implemented in the profile screen yet.
- Inventory access is subscription-gated in the frontend.
- Settings access is role-gated in the frontend.
- Some backend routes still use action-style names instead of resource-style REST naming.
