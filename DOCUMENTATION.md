# OralSync — Complete Documentation

> Covers: User Manual · Technical Reference · Architecture · API Endpoints · Deployment

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Manual](#2-user-manual)
3. [System Architecture](#3-system-architecture)
4. [Backend Technical Reference](#4-backend-technical-reference)
5. [Frontend Technical Reference](#5-frontend-technical-reference)
6. [API Endpoints Reference](#6-api-endpoints-reference)
7. [Configuration & Secrets](#7-configuration--secrets)
8. [External Integrations](#8-external-integrations)
9. [Background Jobs (Hangfire)](#9-background-jobs-hangfire)
10. [Deployment Guide](#10-deployment-guide)
11. [Developer Onboarding](#11-developer-onboarding)
12. [Common Mistakes & Conventions](#12-common-mistakes--conventions)

---

## 1. Product Overview

**OralSync** (internal solution name: **DMD — Dental Management Dental**) is a cloud-based Dental Management System (DMS) designed for Philippine dental clinics. It provides end-to-end clinic operations management: patient records, appointment scheduling, billing and invoicing, lab case tracking, dental inventory, staff management, and an AI-powered dental assistant.

| Property | Value |
|---|---|
| Target market | Philippine dental clinics |
| Backend solution | `DMD.sln` (.NET 8 ASP.NET Core Web API) |
| Frontend package | `dmd-web` (React 18 + TypeScript SPA) |
| Current version | `0.1.0-beta` |
| SMS gateway | Semaphore (Philippines) |
| Email | Gmail SMTP |
| Cloud platform | Azure (App Service + Blob Storage) |

---

## 2. User Manual

### 2.1 Getting Started

#### Accessing OralSync

Open OralSync in your browser and log in with the credentials provided by your clinic administrator. On your first login, you will be asked to accept:

1. **Data Privacy Policy** — required by Philippine law (RA 10173).
2. **Contract Policy** — clinic service agreement.
3. **Beta Testing Acknowledgement** — the system is currently in beta.

You must accept all three before you can access the clinic dashboard.

#### Clinic Lock

If your clinic's subscription has expired, the system will automatically lock your account. A "Clinic Locked" dialog will appear. Contact your clinic administrator or OralSync support to renew the subscription.

---

### 2.2 Dashboard

The dashboard shows a summary of clinic activity including today's appointments, recent patients, financial totals, and key stats. It is the first screen you see after logging in.

---

### 2.3 Patients

Navigate to **Patients** in the sidebar to manage your clinic's patient list.

**Patient List** — Search, filter, and view all patients. Click **Add Patient** to register a new one.

**Patient Profile** — Click on any patient to open their full profile. Each patient profile contains tabs for:

| Tab | Purpose |
|---|---|
| Overview | Summary: contact info, tags, recent visits |
| Appointment Records | Historical appointment records for this patient |
| Dental Chart | Interactive odontogram (tooth diagram) with conditions per tooth |
| Periodontal Chart | Perio chart with pocket depths and clinical data |
| Medical History | Allergies, medications, systemic conditions |
| Progress Notes | SOAP/clinical notes with rich text editor |
| Patient Forms | Consent forms, medical questionnaires, custom templates |
| Dental Photos | Upload and annotate dental photos with canvas tools |

---

### 2.4 Appointments

Navigate to **Appointment** to see the clinic calendar. Appointments can be viewed in day, week, or list view (powered by FullCalendar). You can create, reschedule, and cancel appointments directly from the calendar.

Appointment SMS reminders are sent automatically to patients:
- **Evening before** the appointment
- **Morning of** the appointment

---

### 2.5 Inventory

> ⚠️ Available on **Standard** and **Pro** subscriptions only. Basic plan clinics are redirected to the dashboard.

Navigate to **Inventory** to manage dental supplies and consumables. You can add items, set minimum/maximum stock levels, and track quantities by category.

---

### 2.6 Dental Lab Cases

Navigate to **Dental Lab Cases** to track cases sent to external dental laboratories. Each case has a status (pending, in progress, completed, etc.) and is tied to a patient and lab provider.

---

### 2.7 Finance

Navigate to **Finance Overview** to review billing, expenses, and revenue summaries. Use **Invoice Generator** to create and download PDF invoices for patients.

---

### 2.8 Settings

Navigate to **Settings** to update your clinic profile, manage staff users, and configure clinic preferences.

---

### 2.9 AI Assistant

OralSync includes an AI dental assistant. On mobile, tap the AI button to open the chat panel. You can:
- Ask dental or clinical questions.
- Use voice input (speak your question).
- Hear the assistant's response via text-to-speech.

The assistant is context-aware — it knows which patient profile or section you are currently viewing.

---

### 2.10 Progressive Web App (PWA)

OralSync can be installed as an app on your device:

- **Desktop (Chrome/Edge):** Click the install icon in the address bar, or accept the in-app "Install OralSync" banner.
- **Android (Chrome):** Accept the browser install prompt.
- **iPhone/iPad (Safari):** Tap **Share** → **Add to Home Screen**.

> **Important:** OralSync does NOT cache live patient or billing data offline. You need an internet connection to view clinic records.

---

## 3. System Architecture

### 3.1 High-Level Overview

```
[Browser / PWA]
     │
     │  HTTPS (REST JSON)
     ▼
[OralSync Web — React SPA]          ← dmd-web (Create React App)
     │
     │  HTTPS API calls (Axios + JWT Bearer)
     ▼
[OralSync API — ASP.NET Core]       ← DMD project (port 5002 in dev)
     │
     ├── SQL Server (EF Core)       ← main clinic data
     ├── Hangfire DB (SQL Server)   ← background job state
     ├── Azure Blob Storage         ← file/photo uploads (optional)
     ├── OpenAI GPT                 ← AI assistant
     ├── Semaphore SMS              ← appointment reminders (PH)
     └── Gmail SMTP                 ← email notifications

[DMD.HANGFIRE — Separate worker host]
     │  (Runs independently, shares DB)
     └── Scheduled jobs (SMS reminders, auto-lock)
```

### 3.2 Backend Architecture — Clean Architecture + CQRS

The backend follows **Clean Architecture** with strict layer separation, and uses **CQRS** (Command Query Responsibility Segregation) via **MediatR** to separate read and write operations.

```
DMD/                    ← API Layer (controllers, middleware, config)
DMD.APPLICATION/        ← Application Layer (CQRS handlers, DTOs, validators)
DMD.DOMAIN/             ← Domain Layer (entities, enums — no external deps)
DMD.PERSISTENCE/        ← Persistence Layer (EF Core DbContext, migrations)
DMD.SERVICES/           ← Services Layer (JWT, email, SMS, data protection)
DMD.HANGFIRE/           ← Background Job Host (separate process)
```

**Dependency rule:** outer layers depend on inner layers. Domain has zero external dependencies.

### 3.3 Frontend Architecture — Feature-Based React SPA

The frontend is organized by **domain feature modules** under `src/features/`. Each feature is self-contained with its own API layer, state, types, and components.

```
src/
├── App.tsx                  ← Root router setup
├── mainLayout.tsx           ← Clinic user layout (sidebar, consent, AI)
├── adminLayout.tsx          ← SuperAdmin layout
├── common/                  ← Shared utilities, stores, components, hooks
│   ├── store/               ← Zustand global state (auth, theme, AI)
│   ├── services/            ← apiClient (Axios), auth-api, ai-assistant-api
│   ├── routes/              ← Route definitions and guards
│   └── hooks/               ← use-pwa-install, use-speech-recognition, etc.
└── features/                ← Domain feature modules
    ├── login/
    ├── dashboard/
    ├── patient/
    ├── appointment/
    ├── inventory/
    └── ...
```

**Each feature folder follows this structure:**
```
features/{feature}/
├── api/
│   ├── types.ts        ← TypeScript types (Model, StateModel, Props, etc.)
│   ├── api.ts          ← HTTP functions (GET with cache, POST, PUT, DELETE)
│   ├── handlers.ts     ← Orchestration (calls api.ts, updates state)
│   └── validation.ts   ← Yup validation schema
├── index-content/
│   ├── {feature}-header.tsx   ← Search + action buttons
│   ├── {feature}-table.tsx    ← Data table
│   └── {feature}-form.tsx     ← Formik create/edit form
├── modal/
│   └── modal.tsx       ← Delete confirmation dialog
└── index.tsx           ← Root module component
```

### 3.4 Authentication & Authorization

- **Protocol:** JWT Bearer (HS512)
- **Token lifetime:** 60 minutes (configurable)
- **Claim used for clinic scoping:** `clinicId` (embedded in JWT)
- **Auto-logout:** On `401` response, `apiClient` interceptor calls `logout()`
- **Clinic lock:** On `423` response, `apiClient` sets `user.isLocked = true`
- All API controllers inherit `BaseController` which applies `[Authorize(JwtBearer)]` globally. Public endpoints explicitly use `[AllowAnonymous]`.

### 3.5 Data Isolation

All data is scoped to a `clinicId`. On the backend, EF Core **global query filters** automatically filter all queries to the current clinic's data based on the JWT `clinicId` claim. These filters are never bypassed except for SuperAdmin operations.

On the frontend, `clinicId` flows from the JWT into `authStore.user.clinicId`, is passed as a prop to every feature module, and is resolved via the `useClinicId()` hook before any API call.

---

## 4. Backend Technical Reference

### 4.1 Domain Entities

All entities inherit from `BaseEntity<T>`:

```csharp
public abstract class BaseEntity<T> where T : struct
{
    public T Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedById { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
    public string? LastUpdatedById { get; set; }
    public string? LastUpdatedBy { get; set; }
    public bool IsDeleted { get; set; }   // Soft delete — never hard delete
}
```

**Domain entity folders:**
- `Appointment/`
- `Buildups/`
- `FInances/` ← note: typo in folder name — **do not rename** without a migration
- `LabCases/`
- `Patients/`
- `UserProfile/`

**Enums available:** BloodType, EmploymentType, ExpenseCategory, FileType, InventoryCategory, InventoryType, LabCaseStatus, LabWorkType, PatientFormTypes, PatientTag, Prefix, Relationship, SubscriptionType, Suffix, TeethSurface, TemplateType, ToothCondition, UserRole

### 4.2 CQRS Pattern

Every write and read operation is dispatched through `IMediator`:

```csharp
// Controller — always does just this:
var result = await Mediator.Send(command);
```

**Command/Query file layout:**
```
DMD.APPLICATION/{Module}/
├── Commands/
│   ├── Create/Command.cs   ← IRequest<Response> + CommandHandler (in same file)
│   ├── Update/Command.cs
│   └── Delete/Command.cs
├── Queries/
│   └── Get/Query.cs        ← paginated, clinic-scoped
└── Models/
    ├── {Entity}Model.cs         ← DTO response model
    └── {Entity}ModelFactory.cs  ← entity → model mapping
```

### 4.3 Response Wrapping

All handlers return either `SuccessResponse<T>` or `BadRequestResponse`. Controllers unwrap these:

```csharp
if (result is BadRequestResponse bad)
    return BadRequest(bad.Message);

var data = ((SuccessResponse<TResponse>)result).Data;
return Ok(data);
```

**Validation in handlers:**
```csharp
private static string? ValidateRequest(Command request)
{
    if (string.IsNullOrWhiteSpace(request.Name)) return "Name is required.";
    return null; // null = valid
}
```

### 4.4 Soft Deletes

**Never hard-delete records.** Always set `IsDeleted = true`:
```csharp
entity.IsDeleted = true;
await dbContext.SaveChangesAsync();
```
EF global query filters automatically exclude soft-deleted records from all queries.

### 4.5 String Normalization

All string inputs must be normalized before saving:
```csharp
entity.Name = request.Name?.Trim() ?? string.Empty;
```

### 4.6 Security Headers

Applied globally via middleware in `Program.cs`:
- `X-Frame-Options: DENY`
- Content Security Policy (CSP)

---

## 5. Frontend Technical Reference

### 5.1 Global State (Zustand)

| Store | Key | Persisted | Purpose |
|---|---|---|---|
| `authStore` | `dmd-auth` | ✅ localStorage | JWT token, user, login state |
| `themeStore` | `dmd-theme-mode` | ✅ localStorage | Light/dark mode |
| `aiAssistantStore` | — | ❌ session only | AI panel open/close state |

**Reading state outside React components (e.g. in Axios interceptors):**
```ts
// ✅ Correct
const token = useAuthStore.getState().token;

// ❌ Wrong — hooks only work inside components
const token = useAuthStore(state => state.token);
```

**Never use `localStorage` directly.** All persistence goes through Zustand `persist` middleware.

### 5.2 API Layer

The `apiClient` (Axios instance at `src/common/services/api-client.ts`):
- Auto-attaches `Authorization: Bearer <token>` on every request
- On `401` → calls `logout()`
- On `423` → sets `user.isLocked = true`
- Default timeout: 30,000ms

**GET functions use a 5-second cache + request deduplication:**
```ts
const CACHE_TTL_MS = 5000;
const requestCache = new Map<string, Promise<ResponseModel>>();
const responseCache = new Map<string, { data: ResponseModel; cachedAt: number }>();
```

**Protected storage files** (under `/storage/`):
```ts
// For <img src>
const objectUrl = await loadProtectedAssetObjectUrl(path); // returns blob: URL

// For links/display
const url = resolveProtectedApiAssetUrl(path);
```
Never construct `/storage/` URLs manually.

### 5.3 State Management Rules

Always use **functional setState** in async or debounced contexts:
```ts
// ✅ Always safe
setState(prev => ({ ...prev, openModal: true }));

// ❌ May be stale in async handlers
setState({ ...state, openModal: true });
```

**Modal lifecycle:**
```ts
// Open
setState(prev => ({ ...prev, openModal: true, isUpdate: true, selectedItem: row }));

// Close (onClose)
setState(prev => ({ ...prev, openModal: false }));

// Cleanup after animation (TransitionProps.onExited)
setState(prev => ({ ...prev, isUpdate: false, isDelete: false, selectedItem: undefined }));
```

### 5.4 Forms

All forms use **Formik** + **Yup**. Key rules:
- Always set `enableReinitialize: true` when editing an existing record.
- Never put validation logic in `onSubmit` — use the Yup schema.
- Number fields in Yup need a transform to handle empty string from input:
  ```ts
  yup.number().transform((v, orig) => orig === '' ? 0 : v)
  ```
- Error messages in Yup must match the backend `ValidateRequest()` messages.

### 5.5 Route Guards

| Guard | When to use |
|---|---|
| `PublicRoute` | Only when not logged in (login, register) |
| `ClinicRoute` | Logged-in clinic users |
| `AdminRoute` | SuperAdmin only |

**Subscription gating:**
```ts
import { isBasicSubscription } from 'common/utils/subscription';

element={
  isBasicSubscription(user?.subscriptionType)
    ? <Navigate to="/dashboard" replace />
    : <InventoryModule clinicId={user?.clinicId ?? undefined} />
}
```
Always use `isBasicSubscription()` — never compare the `subscriptionType` string directly.

### 5.6 Key Libraries

| Library | Version | Purpose |
|---|---|---|
| `@mui/material` | v7 | UI components |
| `@mui/x-charts` | v8 | Charts |
| `@fullcalendar/react` | v6 | Appointment calendar |
| `@tiptap/react` | v3 | Rich text editor |
| `react-odontogram` | v0.5 | Dental chart |
| `react-konva` / `konva` | v18/v10 | Canvas annotation |
| `formik` | v2 | Form management |
| `yup` | v1 | Validation schemas |
| `axios` | v1 | HTTP client |
| `zustand` | v5 | Global state |
| `react-router-dom` | v6 | Client-side routing |
| `react-toastify` | v11 | Toast notifications |
| `moment` | v2 | Date formatting |
| `jspdf` + `html2canvas` | — | PDF generation |
| `xlsx` | v0.18 | Excel export |

### 5.7 npm Scripts

| Command | What it does |
|---|---|
| `npm start` | Start with `.env.local` |
| `npm run start:dev` | Start with `.env.development` |
| `npm run build` | Production build |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm test` | Run Jest tests |

---

## 6. API Endpoints Reference

All authenticated endpoints require `Authorization: Bearer <token>` in the header. The backend base URL in development is `http://localhost:5002`.

### 6.1 Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | ❌ Public | Login with username + password |
| `POST` | `/register/clinic` | ❌ Public | Register a new clinic |
| `POST` | `/register/bootstrap` | ❌ Public | Bootstrap initial user |

### 6.2 Patients

Base: `/api/dmd/patient`

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dmd/patient` | List patients (paginated, clinic-scoped) |
| `POST` | `/api/dmd/patient` | Create a new patient |
| `PUT` | `/api/dmd/patient` | Update patient details |
| `DELETE` | `/api/dmd/patient` | Soft-delete a patient |

**Patient sub-resources** (all scoped to a patient):

| Controller | Purpose |
|---|---|
| `PatientDentalChartController` | Teeth chart (odontogram) data |
| `PatientPerioChartController` | Periodontal chart data |
| `PatientMedicalHistoryController` | Medical history |
| `PatientProgressNoteController` | Progress/SOAP notes |
| `PatientFormController` | Patient consent and custom forms |
| `PatientDentalPhotoController` | Dental photo uploads |
| `PatientUploadController` | General file uploads |
| `PatientAppointmentRecordController` | Appointment records per patient |
| `PatientEmergencyContactController` | Emergency contacts |
| `PatientOverviewController` | Overview aggregation |
| `PatientProfileController` | Full patient profile |

### 6.3 Appointments

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dmd/appointment` | List appointments |
| `POST` | `/api/dmd/appointment` | Create appointment |
| `PUT` | `/api/dmd/appointment` | Update appointment |
| `DELETE` | `/api/dmd/appointment` | Cancel/delete appointment |

### 6.4 Inventory

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dmd/inventory` | List dental inventory items |
| `POST` | `/api/dmd/inventory` | Add inventory item |
| `PUT` | `/api/dmd/inventory` | Update item |
| `DELETE` | `/api/dmd/inventory` | Remove item |

### 6.5 Finances

| Controller | Purpose |
|---|---|
| `ClinicExpensesController` | Manage clinic expenses |
| `InvoiceGeneratorController` | Generate patient invoices |
| `DentalInventoriesController` | Dental inventory (financial view) |

### 6.6 Lab Cases

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dmd/lab-cases` | List lab cases |
| `POST` | `/api/dmd/lab-cases` | Create lab case |
| `PUT` | `/api/dmd/lab-cases` | Update lab case status |
| `DELETE` | `/api/dmd/lab-cases` | Delete lab case |

### 6.7 Clinic & Settings

| Controller | Purpose |
|---|---|
| `ClinicController` | Clinic profile settings |
| `DashboardController` | Dashboard aggregated stats |
| `LabProviderController` | Lab provider management |
| `TemplateFormController` | Template form management |
| `UserProfileController` | Staff user profile |

### 6.8 AI Assistant

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/dmd/ai/chat` | Send a message to the AI dental assistant |

Request body:
```json
{
  "message": "string",
  "conversationHistory": [],
  "context": "string (current page/patient context)"
}
```
- Backed by OpenAI GPT (model configurable)
- Conversation window: 12 messages max
- Responses are NOT stored by default

### 6.9 Storage

| Controller | Purpose |
|---|---|
| `StorageController` | Protected file upload and retrieval at `/api/dmd/storage/` |

### 6.10 Admin Portal

| Controller | Purpose |
|---|---|
| `AdminController` | SuperAdmin operations (clinic list, lock management) |
| `PublicController` | Public-facing routes (patient self-registration) |

### 6.11 Health & Monitoring

| Route | Purpose |
|---|---|
| `/health` | API health check |
| `/swagger` | Interactive API documentation (development only) |
| `/hangfire` | Hangfire dashboard (background jobs) |

---

## 7. Configuration & Secrets

### 7.1 Backend (`appsettings.json`)

| Key | Description |
|---|---|
| `ConnectionStrings:Default` | SQL Server — main application database |
| `ConnectionStrings:Hangfire` | SQL Server — Hangfire job database |
| `Cors:AllowedOrigins` | Frontend origins (dev default: `http://localhost:3000`) |
| `Jwt:Issuer` | JWT issuer |
| `Jwt:Audience` | JWT audience |
| `Jwt:Key` | JWT signing key (HS512) |
| `Jwt:ExpiryInMinutes` | Token lifetime (default: 60) |
| `EmailSettings:Host` | SMTP host (`smtp.gmail.com`) |
| `EmailSettings:Port` | SMTP port (587) |
| `EmailSettings:UserName` | Gmail address |
| `EmailSettings:Password` | Gmail App Password (not regular password) |
| `EmailSettings:FromEmail` | Sender email |
| `EmailSettings:FromName` | Sender display name |
| `SemaphoreSmsSettings:IsEnabled` | Enable/disable SMS (`true`/`false`) |
| `SemaphoreSmsSettings:ApiKey` | Semaphore API key |
| `SemaphoreSmsSettings:BaseUrl` | `https://api.semaphore.co/api/v4/` |
| `OpenAI:ApiKey` | OpenAI API key |
| `OpenAI:Model` | OpenAI model name (e.g. `gpt-4o`) |
| `Storage:Provider` | `local` or `azure` |

> ⚠️ **Never commit real secrets to source control.** Use `appsettings.Development.json` (gitignored) or environment variables in production.

### 7.2 Frontend (`.env.*`)

All variables are prefixed with `REACT_APP_`:

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | Backend base URL |
| `REACT_APP_APP_NAME` | App display name |
| `REACT_APP_VERSION` | App version string |
| `REACT_APP_ENV` | `development` or `production` |
| `REACT_APP_ENABLE_LOGGING` | Toggle console logging |

> ⚠️ **Never commit `.env.local`.** It is gitignored and holds real API URLs and keys.

---

## 8. External Integrations

### 8.1 Gmail SMTP

The API and Hangfire worker both use Gmail SMTP for email notifications.

**Setup steps:**
1. Enable **2-Step Verification** on the Gmail account.
2. Create an **App Password** (Google Account → Security → App Passwords).
3. Set `EmailSettings:Password` to the 16-character app password.
4. Keep `Host = smtp.gmail.com`, `Port = 587`, `EnableSsl = true`.

**Common error:** `5.7.0 Authentication Required` means the password is not an App Password, or 2-Step Verification is not enabled.

### 8.2 Semaphore SMS (Philippines)

Semaphore is the Philippine SMS gateway used for appointment reminders.

**Setup:**
1. Register at [semaphore.co](https://semaphore.co) and obtain an API key.
2. Set `SemaphoreSmsSettings:IsEnabled = true` and `SemaphoreSmsSettings:ApiKey`.
3. Recipients are automatically normalized to Philippine format (`639XXXXXXXXX`).
4. Priority SMS uses the `/priority` route; regular SMS uses `/messages`.
5. Sender name defaults to the clinic name if not specified per request.

### 8.3 OpenAI GPT

The AI dental assistant calls the OpenAI API via the `AiAssistantController`.

- Configure `OpenAI:ApiKey` and `OpenAI:Model` in `appsettings.json`.
- Conversation window is limited to 12 messages (`MaxConversationMessages`).
- Responses are not persisted (`StoreResponses: false` by default).

### 8.4 Azure Blob Storage

File and photo uploads can be stored locally or in Azure Blob Storage. Set `Storage:Provider` to `azure` and configure the Azure connection string when deploying to production.

---

## 9. Background Jobs (Hangfire)

The `DMD.HANGFIRE` project is a **separate ASP.NET Core host** that runs independently of the main API. It shares the SQL Server database.

### 9.1 Recurring Jobs

| Job ID | Schedule | Purpose |
|---|---|---|
| `patient-appointment-sms-reminders-morning-of` | Morning (configurable cron) | SMS reminders for today's appointments |
| `patient-appointment-sms-reminders-evening-before` | Evening (configurable cron) | SMS reminders for tomorrow's appointments |
| `clinic-profile-auto-lock-expired-validity` | Daily | Auto-locks clinics with expired subscriptions |

### 9.2 Configuration

Job schedules are defined in `appsettings.json` with cron expressions and a timezone setting. Edit the cron expressions to adjust when reminders are sent.

### 9.3 Running Hangfire Locally

```bash
cd DMD.HANGFIRE
dotnet run
# Dashboard available at: https://localhost:{port}/hangfire
```

### 9.4 Adding a New Background Job

1. Create `I{JobName}Job.cs` (interface with `Task ExecuteAsync(...)`)
2. Create `{JobName}Job.cs` — inject `IServiceScopeFactory` (always use this for scoped DbContext) and `ILogger`
3. Register in `DMD.HANGFIRE/Program.cs`:
   ```csharp
   RecurringJob.AddOrUpdate<I{JobName}Job>(
       "{job-id}",
       job => job.ExecuteAsync(CancellationToken.None),
       "{cron-expression}");
   ```
4. Always catch exceptions and log them — never crash the job host.

---

## 10. Deployment Guide

### 10.1 Environment Overview

| Environment | Frontend URL | Backend URL | Notes |
|---|---|---|---|
| Local Dev | `http://localhost:3000` | `http://localhost:5002` | Dev proxy in `package.json` |
| Production | Azure Static Web App | Azure App Service | See below |

### 10.2 Backend — Local Development

**Prerequisites:** .NET 8 SDK, SQL Server (local or Docker), Visual Studio 2022 or Rider.

```bash
# Run the API
cd DMD
dotnet run
# API available at: https://localhost:{port}
# Swagger: https://localhost:{port}/swagger
# Health: https://localhost:{port}/health
```

**Database migrations:**
```bash
# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project DMD.PERSISTENCE \
  --startup-project DMD

# Apply migrations
dotnet ef database update \
  --project DMD.PERSISTENCE \
  --startup-project DMD
```

> In **Development**, migrations and seeding run **automatically** on startup.
> In **Production**, run migrations **manually** — automatic DB setup is intentionally skipped.

### 10.3 Backend — Azure Production Deployment

**Steps:**
1. Create `appsettings.Production.json` with Azure SQL connection strings (do not commit — use environment variables or Azure Key Vault).
2. Set environment variables in Azure App Service → Configuration:
   ```
   ConnectionStrings__Default = <azure-sql-connection-string>
   ConnectionStrings__Hangfire = <hangfire-db-connection-string>
   Jwt__Key = <secret>
   EmailSettings__Password = <gmail-app-password>
   SemaphoreSmsSettings__ApiKey = <semaphore-key>
   OpenAI__ApiKey = <openai-key>
   ```
3. Publish via Visual Studio publish profile or Azure DevOps pipeline (`azure-pipelines.yml`).
4. Check **App Service → Log Stream** for startup errors.
5. Run EF migrations manually via Azure Query Editor or a migration script.
6. Create the Hangfire database if it doesn't exist.
7. Deploy `DMD.HANGFIRE` as a separate App Service (WebJob or separate service).

**Smoke-test checklist after deployment:**
- `GET /health` → 200 OK
- `GET /swagger` → Swagger UI loads
- `POST /login` → returns JWT
- `GET /api/dmd/patient` → returns patient list for a test clinic
- `/hangfire` → dashboard shows active jobs

### 10.4 Frontend — Local Development

```bash
npm install
npm start          # uses .env.local
npm run start:dev  # uses .env.development
```

The dev server proxies all `/api/*` requests to `http://localhost:5002` (configured in `package.json` as `"proxy"`).

### 10.5 Frontend — Production Build & Deployment

```bash
npm run build
# Output: /build folder
```

Deploy the `build/` folder to **Azure Static Web App** or any static host.

**Azure Static Web App hosting rules** (`public/staticwebapp.config.json`):
- `index.html`, `manifest.json`, `service-worker.js`, `offline.html` → `no-cache`
- `/static/*` assets → long-cache + immutable
- All routes → serve `index.html` (SPA fallback)

**PWA testing:**
```bash
npm run build
npx serve -s build
# Open http://localhost:3000, log in, check for install banner
```

---

## 11. Developer Onboarding

### 11.1 First-Time Setup

**Backend:**
1. Clone the `OralSync-API` repo.
2. Install .NET 8 SDK.
3. Create `DMD/appsettings.Development.json` with your local DB connection strings and secrets.
4. Create the SQL Server database.
5. Run `dotnet run` from the `DMD` folder — migrations run automatically in Development.
6. Open `https://localhost:{port}/swagger` to confirm the API is running.

**Frontend:**
1. Clone the `OralSync` repo.
2. Install Node.js (LTS) and run `npm install`.
3. Create `.env.local` with `REACT_APP_API_URL=http://localhost:5002` (and other vars).
4. Run `npm start`.
5. Open `http://localhost:3000`.

### 11.2 Adding a New Feature Module (Full-Stack)

1. **Domain entity** → `DMD.DOMAIN/Entities/{Folder}/{Entity}.cs` (extend `BaseEntity<int>`)
2. **DbSet** → `DMD.PERSISTENCE/Context/DmdDbContext.Entities.cs` + global query filter for `clinicId`
3. **EF Migration** → `dotnet ef migrations add {Name} --project DMD.PERSISTENCE --startup-project DMD`
4. **Application layer** → `DMD.APPLICATION/{Module}/` with Commands, Queries, Models
5. **Controller** → `DMD/Controllers/{Folder}/{Entity}Controller.cs` extending `BaseController`
6. **Frontend feature folder** → `src/features/{feature}/` with `api/types.ts`, `api/api.ts`, `api/handlers.ts`, `api/validation.ts`, components, `index.tsx`
7. **Route** → `src/common/routes/routes.tsx` with appropriate guard

See `CLAUDE-PROMPTS.md` in either repo for copy-paste prompt templates for each of these steps.

### 11.3 Skills Reference (Frontend)

The `.skills/` folder contains focused skill guides for common frontend tasks:

| File | Use when |
|---|---|
| `api-integration.skill.md` | Writing `api.ts`, `handlers.ts`, `types.ts` |
| `state-management.skill.md` | Working with feature `useState` or Zustand stores |
| `forms-validation.skill.md` | Formik forms and Yup schemas |
| `auth-clinic-scope.skill.md` | JWT, route guards, clinic data isolation |
| `bug-fix.skill.md` | Diagnosing and fixing bugs |
| `typescript-types.skill.md` | TypeScript types and Yup integration |
| `frontend-component.skill.md` | Writing React components |
| `code-explain.skill.md` | Understanding existing code |

---

## 12. Common Mistakes & Conventions

### 12.1 Backend

| ❌ Don't | ✅ Do instead |
|---|---|
| `dbContext.Remove(entity)` | `entity.IsDeleted = true` |
| Read `clinicId` from request body | Extract from JWT: `User.FindFirstValue("clinicId")` |
| `throw new Exception()` in a handler | `return new BadRequestResponse("message")` |
| Put business logic in a controller | Put it in the Command/Query handler |
| Skip global query filters | Only allowed for SuperAdmin, and must be documented |
| Commit secrets to `appsettings.json` | Use `appsettings.Development.json` (gitignored) or env vars |
| Rename `FInances/` folder | Leave it — renaming requires a migration |

### 12.2 Frontend

| ❌ Don't | ✅ Do instead |
|---|---|
| `setState({ ...state, x })` in async | `setState(prev => ({ ...prev, x }))` |
| Use `fetch()` directly | Use `apiClient` from `common/services/api-client` |
| Construct `/storage/...` URLs manually | Use `resolveProtectedApiAssetUrl()` or `loadProtectedAssetObjectUrl()` |
| Use `localStorage.setItem()` directly | Use Zustand `persist` middleware |
| Use `any` type | Provide proper TypeScript types |
| Compare `subscriptionType` as a raw string | Use `isBasicSubscription(user?.subscriptionType)` |
| Call `useAuthStore()` hook outside components | Use `useAuthStore.getState()` |
| Put validation in Formik `onSubmit` | Put it in the Yup schema |

### 12.3 Naming Conventions

| Context | Convention |
|---|---|
| TypeScript (frontend) | `camelCase` for variables/props, `PascalCase` for types/components |
| C# (backend) | `PascalCase` for everything |
| API route params | `PascalCase` (e.g. `ClinicId`, `Que`, `pageStart`) |
| Feature folders (frontend) | `kebab-case` (e.g. `dental-lab-cases`) |
| Entity folders (backend) | `PascalCase` |

---

*Documentation generated: April 2026*
*Based on: OralSync-API CLAUDE.md, OralSync CLAUDE.md, .skills/ folder, SMTP_SETUP.md, SEMAPHORE_SMS_SETUP.md, PWA-SETUP.md, package.json, TODO.md*
