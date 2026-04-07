# CLAUDE.md — OralSync Web (Frontend)

> Context and skill reference for AI-assisted development on this repository.

---

## Project Overview

**OralSync Web** is the frontend for a Dental Management System (DMS). It is a **React 18 + TypeScript** SPA built with **Create React App**, using **Material UI v7** for components, **Zustand** for global state, **React Router v6** for routing, and **Axios** for API communication.

- **App name (package):** `dmd-web`
- **Version:** `0.1.0-beta`
- **Framework:** React 18, TypeScript (`strict` mode)
- **UI library:** MUI v7 (`@mui/material`)
- **State management:** Zustand (with `persist` middleware)
- **Routing:** React Router v6
- **HTTP client:** Axios (with JWT interceptors)
- **Forms:** Formik + Yup
- **Dev server proxy:** `http://localhost:5002` (OralSync API)

---

## Repository Structure

```
OralSync/
├── src/
│   ├── App.tsx                    → Root app component
│   ├── mainLayout.tsx             → Clinic user layout (SideNav, AI Assistant, consent dialogs)
│   ├── adminLayout.tsx            → Admin layout (AdminSideNav)
│   ├── index.tsx                  → React entry point
│   ├── common/                    → Shared utilities, services, components, stores
│   │   ├── api/                   → Response helpers (toasts, etc.)
│   │   ├── components/            → Shared UI components
│   │   ├── errors/                → Error pages (404, etc.)
│   │   ├── helpers/               → General helper functions
│   │   ├── hooks/                 → Custom React hooks
│   │   ├── lib/                   → Third-party lib wrappers
│   │   ├── loading/               → Post-login boot screen, loading states
│   │   ├── modal/                 → Shared modal utilities
│   │   ├── routes/                → Route definitions and route guards
│   │   ├── services/              → Axios API service modules
│   │   ├── sideNav/               → Clinic sidebar navigation
│   │   ├── adminNav/              → Admin sidebar navigation
│   │   ├── spinner/               → Loading spinner components
│   │   ├── store/                 → Zustand global stores
│   │   ├── styles/                → Global SCSS variables, mixins, animations
│   │   ├── Templates/             → Document/PDF templates
│   │   └── utils/                 → Utility functions (JWT, subscription, etc.)
│   └── features/                  → Feature modules (domain-scoped pages)
├── public/                        → Static assets
├── .env.local                     → Local environment (gitignored)
├── .env.development               → Dev environment config
├── .env.production                → Prod environment config
├── package.json
├── tsconfig.json
└── .prettierrc.json
```

---

## Environment Variables

All env vars are prefixed with `REACT_APP_` (CRA standard):

| Variable | Purpose |
|----------|---------|
| `REACT_APP_APP_NAME` | App display name (`OralSync`) |
| `REACT_APP_VERSION` | App version string |
| `REACT_APP_ENV` | Environment identifier (`development`, `production`) |
| `REACT_APP_API_URL` | Backend API base URL (e.g. `http://localhost:5002`) |
| `REACT_APP_ENABLE_LOGGING` | Toggle console logging |
| `REACT_APP_ENABLE_DEBUG` | Toggle debug tooling |
| `REACT_APP_SHOW_DEV_TOOLS` | Toggle dev-specific UI |

> ⚠️ **Never commit `.env.local`** — it is gitignored and holds real secrets.

---

## Routing Architecture

Routes are defined in `src/common/routes/routes.tsx` using React Router v6.

### Route Guards

| Guard | Purpose |
|-------|---------|
| `PublicRoute` | Accessible only when NOT logged in (login, logout pages) |
| `ClinicRoute` | Accessible only when logged in as a clinic user |
| `AdminRoute` | Accessible only when logged in as SuperAdmin |

### Route Map

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `Login` | PublicRoute |
| `/logout-success` | `LogoutThankYou` | PublicRoute |
| `/register-appointment` | `PublicRegistrationPage` | None |
| `/dashboard` | `UserIndexPage` | ClinicRoute + MainLayout |
| `/patient` | `PatientModule` | ClinicRoute + MainLayout |
| `/patient-profile/:patientId` | `PatientProfileModule` | ClinicRoute + MainLayout |
| `/appointment` | `AppointmentModule` | ClinicRoute + MainLayout |
| `/inventory` | `InventoryModule` | ClinicRoute + MainLayout (hidden on Basic plan) |
| `/dental-lab-cases` | `DentalLabCasesModule` | ClinicRoute + MainLayout |
| `/finance-overview` | `FinanceOverview` | ClinicRoute + MainLayout |
| `/invoice-generator` | `InvoiceGeneratorModule` | ClinicRoute + MainLayout |
| `/settings` | `SettingsModule` | ClinicRoute + MainLayout |
| `/admin/dashboard` | `AdminDashboard` | AdminRoute + AdminLayout |
| `/admin/clinic-locks` | `ClinicLockModule` | AdminRoute + AdminLayout |

> **Subscription gating:** The `/inventory` route redirects to `/dashboard` for `Basic` subscription users. Check `isBasicSubscription()` from `common/utils/subscription`.

---

## Layouts

### `MainLayout` (`src/mainLayout.tsx`)
Used by all clinic user routes. Responsibilities:
- Renders `SideNav` and the route `<Outlet />`
- Manages post-login boot screen (`usePostLoginBoot`)
- Handles consent dialogs in sequence:
  1. Data Privacy → 2. Contract Policy → 3. Beta Testing
- Shows `ClinicLockedDialog` when clinic is locked
- Polls clinic lock status every **30 minutes** (`getClinicDataPrivacyStatus`)
- Renders `AiAssistant` (mobile only — `isMobile` check)
- Provides route-aware AI context (`assistantContext`) based on `location.pathname`

### `AdminLayout` (`src/adminLayout.tsx`)
Used by all admin routes. Responsibilities:
- Renders `AdminSideNav` and the route `<Outlet />`
- Handles post-login boot screen
- Mobile-responsive padding adjustments

---

## Global State (Zustand Stores)

All stores are in `src/common/store/`.

### `authStore` (`dmd-auth` — persisted to localStorage)
| State | Type | Description |
|-------|------|-------------|
| `isLoggedIn` | `boolean` | Session status |
| `token` | `string \| null` | JWT token |
| `username` | `string` | Logged-in username |
| `user` | `AuthUser \| null` | Full user object (clinicId, roles, flags) |
| `requiresRegistration` | `boolean` | Whether clinic setup is pending |

Key actions: `setSession`, `logout`, `hydrateSession`, `updateUser`

- `hydrateSession` runs on app mount to validate and restore JWT session
- On `401` response → auto-logout via Axios interceptor
- On `423` response → sets `isLocked: true` on user object

### `themeStore` (`dmd-theme-mode` — persisted to localStorage)
| State | Description |
|-------|-------------|
| `mode` | `'light' \| 'dark'` — MUI palette mode |
| `toggleColorMode` | Toggles between light/dark |
| `resetColorMode` | Resets to `'light'` (called on logout) |

### `aiAssistantStore` (session only — not persisted)
| State | Description |
|-------|-------------|
| `isOpen` | Whether AI assistant panel is open |
| `open` / `close` | Toggle actions |

---

## API Layer

### `api-client.ts` (`src/common/services/api-client.ts`)
- Axios instance with `baseURL` from `REACT_APP_API_URL`
- **Request interceptor:** Attaches `Authorization: Bearer <token>` from `authStore`
- **Response interceptor:**
  - `401` → calls `logout()`
  - `423` → sets `user.isLocked = true`
- Default timeout: `30,000ms`

### Asset URL Helpers
| Function | Purpose |
|----------|---------|
| `resolveApiAssetUrl(path)` | Resolves relative paths to full API URLs |
| `resolveProtectedApiAssetUrl(path)` | Resolves `/storage/...` paths through the protected API endpoint |
| `loadProtectedAssetObjectUrl(path)` | Fetches a protected file as a Blob object URL (for images, docs) |
| `isProtectedStoragePath(path)` | Checks if path starts with `/storage/` |

### Service Files
- `auth-api.ts` — Login, logout, consent acceptance, registration status
- `ai-assistant-api.ts` — AI chat requests

---

## Features Directory

Each feature folder is a self-contained domain module under `src/features/`:

| Feature | Route | Description |
|---------|-------|-------------|
| `login` | `/` | Auth login, logout, clinic lock, consent dialogs |
| `dashboard` | `/dashboard` | Clinic analytics & summary |
| `patient` / `PatientList` | `/patient` | Patient list, search, creation |
| `patient-profile` | `/patient-profile/:patientId` | Patient profile shell/tabs |
| `patient-profile-modules` | (tabs) | Sub-modules: appointment-records, dental-chart, medical-history, overview, patient-forms, perio-chart, photos, progress-note |
| `appointment` | `/appointment` | Appointment scheduling (FullCalendar) |
| `inventory` | `/inventory` | Dental inventory management |
| `dental-lab-cases` | `/dental-lab-cases` | Lab case tracking |
| `finance-overview` | `/finance-overview` | Billing, expenses, revenue |
| `invoice-generator` | `/invoice-generator` | PDF invoice generation (jsPDF) |
| `settings` | `/settings` | Clinic profile & user settings |
| `admin-portal` | `/admin/*` | SuperAdmin dashboard & clinic lock management |
| `public-registration` | `/register-appointment` | Public patient self-registration |
| `register` | (disabled) | Staff registration (commented out) |

---

## Shared Components

### `common/components/`
| Component | Purpose |
|-----------|---------|
| `AiAssistant/` | Floating AI chat assistant panel (context-aware per route/patient) |
| `pwa-install-banner.tsx` | PWA install prompt banner |
| `RoundedPagination/` | Custom MUI pagination |
| `TableLoadingSkeleton/` | Skeleton loader for data tables |
| `ClinicId/` | Clinic ID display utility |
| `Highlight/` | Text highlight component |

### `common/hooks/`
| Hook | Purpose |
|------|---------|
| `use-pwa-install.ts` | Handles PWA install prompt lifecycle |
| `use-speech-recognition.ts` | Web Speech API — voice input |
| `use-speech-synthesis.ts` | Web Speech API — text-to-speech output |

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `@mui/material` v7 | UI component library |
| `@mui/x-charts` | Charts and data visualization |
| `@fullcalendar/react` | Appointment calendar (day/week/list views) |
| `@tiptap/react` | Rich text editor (progress notes, forms) |
| `react-odontogram` | Dental chart / tooth diagram component |
| `react-konva` / `konva` | Canvas drawing (dental photos annotation) |
| `formik` + `yup` | Form management and schema validation |
| `axios` | HTTP client |
| `zustand` | Global state management |
| `react-router-dom` v6 | Client-side routing |
| `react-toastify` | Toast notifications |
| `moment` | Date formatting and manipulation |
| `jspdf` + `html2canvas` | PDF generation from HTML |
| `xlsx` | Excel export |
| `qrcode.react` | QR code generation |
| `sass` | SCSS support |

---

## Styling

- **Primary:** MUI `sx` prop and `styled()` (Emotion under the hood)
- **Secondary:** SCSS modules (`.module.scss`) for component-scoped styles
- **Global SCSS:** `src/common/styles/`
  - `variables.scss` — color tokens, spacing, breakpoints
  - `mixins.scss` — reusable SCSS mixins
  - `animations.scss` — keyframe animations
- **Theme:** Light/dark mode via `themeStore`, applied via MUI `PaletteMode`
- **Code formatting:** Prettier (`.prettierrc.json`), run `npm run format`

---

## Running Locally

```bash
# Install dependencies
npm install

# Start with local env (.env.local)
npm start             # or: npm run start:local

# Start with development env (.env.development)
npm run start:dev

# Build for production
npm run build

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Run tests
npm test
```

> The dev server proxies API requests to `http://localhost:5002` (configured in `package.json`).

---

## TypeScript Notes

- **Strict mode** is enabled (`tsconfig.json`)
- Use `type` imports where possible: `import type { Foo } from './foo'`
- All component props should be typed — avoid `any`
- Nullable values from the API should be typed as `string | null`, not `string | undefined`
- Prefer optional chaining (`?.`) and nullish coalescing (`??`) over conditionals

---

## PWA Support

- The app is a **Progressive Web App** (CRA with `serviceWorkerRegistration.ts`)
- Install prompt is handled by `use-pwa-install.ts` hook
- `PwaInstallBanner` component renders install CTA

---

## AI Assistant Integration

The AI assistant is context-aware based on the current route:
- On `/patient-profile/:patientId?tab=*` → sends `patientId` + current tab as context
- On all other routes → sends the route label (e.g. `"Patients"`, `"Appointments"`) as context
- State managed by `aiAssistantStore` (open/close panel)
- API calls via `ai-assistant-api.ts`
- Speech input/output via `use-speech-recognition` and `use-speech-synthesis` hooks
- Currently rendered **mobile-only** in `MainLayout` — desktop rendering may be expanded

---

## Skills for AI Assistance

When working on this codebase, apply these patterns:

- **New feature page?** → Create a folder in `src/features/<feature-name>/`, add the route in `src/common/routes/routes.tsx`, protect with the appropriate guard
- **New API call?** → Add a typed function in the relevant service file under `src/common/services/`, always use `apiClient` (not raw axios)
- **New global state?** → Add to an existing Zustand store or create a new one in `src/common/store/`; use `persist` middleware only if the state must survive page refresh
- **Forms?** → Use Formik + Yup; define the validation schema alongside the form component
- **Toasts/notifications?** → Use `react-toastify` via helpers in `src/common/api/responses.ts`
- **Date formatting?** → Use `moment` for consistency
- **PDF/export?** → Use `jsPDF` + `html2canvas` (see `invoice-generator` feature for reference)
- **Protected images/files?** → Use `loadProtectedAssetObjectUrl()` or `resolveProtectedApiAssetUrl()` from `api-client.ts`, never construct storage URLs manually
- **Do not** use `localStorage` directly — use Zustand `persist` middleware
- **Do not** add business logic in components — keep feature components lean; extract to hooks or service files
- **Do not** use `any` — provide proper types or use `unknown` with type guards
- **Subscription gating?** → Use `isBasicSubscription(user?.subscriptionType)` from `common/utils/subscription`

---

*Last generated: April 2026*
