# OralSync System Manual

Updated: April 14, 2026

This manual is for clinic users, front desk staff, dentists, branch admins, and platform admins using the current OralSync product.

## 1. Product Summary

OralSync is a cloud-based dental clinic management system focused on day-to-day clinic operations. The current product includes:

- Clinic workspace for staff
- Admin portal for platform-level monitoring
- Patient records and patient profile modules
- Appointment scheduling and public appointment registration
- Dental chart and perio chart records
- Finance, invoice generation, subscription payments, and manual payment review
- Reports and analytics dashboards for finance, patients, and appointments
- Dental inventory and lab case tracking
- Android SMS Gateway configuration for supported clinics
- File uploads and protected clinic storage
- AI assistant with patient-aware context
- PWA install support

## 2. Access and Sign-In

### 2.1 Login behavior

Users sign in from the web app login page. After successful login, OralSync routes the user to one of two portals:

- Clinic portal: `/dashboard`
- Admin portal: `/admin/dashboard`

Portal routing is based on the authenticated user returned by the backend.

### 2.2 First login requirements

The current app enforces several checks after login:

- `Temporary password flow`: if the backend returns `mustChangePassword`, the user must set a new password before entering the system.
- `Clinic policy acceptance flow`: clinic users may be blocked by modal dialogs until they accept data privacy, contract policy, and beta testing acknowledgement.
- `Clinic lock handling`: if the clinic is locked, the user is forced back to the dashboard and shown a clinic locked dialog.

### 2.3 Session handling

The frontend stores the authenticated session in a persisted Zustand store. If the API returns:

- `401 Unauthorized`: the user is logged out
- `423 Locked`: the current user is marked as locked in the UI

## 3. Clinic Workspace

### 3.1 Main navigation

The clinic workspace navigation currently includes:

- Dashboard
- Patients
- Appointments
- Inventories
- Billing and Finance
- Invoice Generator
- Dental Lab Cases
- Reports
- Settings

Notes:

- On `Basic` subscription, the `Inventories` module is hidden and `/inventory` redirects to `/dashboard`.
- `Settings` is only available when the logged-in role passes the frontend gate for that module.
- On mobile, the main navigation is rendered through a top app bar with a slide-out drawer instead of the desktop side drawer.

### 3.2 Branch selector

A branch selector appears only when all of the following are true:

- The user has a clinic-wide role in the frontend
- The clinic has a premium subscription
- The clinic has branches available

When shown, the selector allows switching between `All Branches` and a specific branch context.

## 4. Clinic Modules

### 4.1 Dashboard

The dashboard is the default clinic landing page. In the current frontend it is composed from:

- Header
- Widgets
- Charts
- Lists
- Announcement content

From the surrounding code, the dashboard is intended to surface a clinic snapshot rather than detailed record editing.

### 4.2 Patients

The Patients module supports:

- Patient list browsing
- Search and pagination
- Create, update, and delete flows
- Profile picture upload
- XLSX patient import

Opening a patient record navigates to `/patient-profile/:patientId`.

### 4.3 Patient Profile

The patient profile currently exposes these tabs:

- Progress Notes
- Medical History
- Photos
- Dental Chart
- Perio Chart
- Forms
- Appointments
- Lab Cases

Important current-state notes:

- The `Lab Cases` tab exists in the tab list but currently renders an under-maintenance placeholder in the patient profile page.
- The older `Overview` tab is not active in the current frontend.

Other verified behavior:

- Email action is hidden on the `Basic` plan
- Protected profile images are loaded through authenticated storage helpers
- Patient profile routes also feed context into the AI assistant

### 4.4 Appointments

The appointment module supports:

- Appointment list and table views
- Calendar-based scheduling
- Create, update, and delete flows
- Tracking of today's appointment count in the side navigation badge

Public appointment registrations also create appointment requests through the backend.

### 4.5 Inventories

Inventory is subscription-gated and hidden for `Basic` plan clinics. The module supports:

- Inventory list browsing
- Create, update, and delete flows
- Stock and finance-related fields

### 4.6 Billing and Finance

The finance area currently has two views:

- Income
- Expenses

This section is separate from the invoice generator and subscription billing flow.

### 4.7 Invoice Generator

The invoice generator is a separate clinic module used to retrieve and render invoice-related records. It has its own list, header, form, and modal structure in the frontend.

### 4.8 Dental Lab Cases

The dental lab cases module supports:

- Lab case list and filtering
- Create, update, and delete flows
- Lab case tooth editing
- Attachment upload
- Summary download

### 4.9 Reports & Analytics

The Reports module is available at `/reports` and currently includes these tabs:

- Finance
- Patients
- Appointments

Verified current behavior from the frontend and backend:

- Date filtering supports presets and custom date ranges.
- Finance reports are role-gated in the frontend and shown only to `SuperAdmin`, `BranchAdmin`, or `Accountant`.
- Branch context is included automatically when a branch-scoped session or active branch filter is present.

Current report datasets:

- `Finance`: revenue summary, expense breakdown, outstanding balances, and profit/loss
- `Patients`: patient growth and demographics
- `Appointments`: appointment volume and appointment funnel

### 4.10 Settings

The current Settings module is divided into these tabs:

- Clinic Profile
- Create User
- Build Up
- Data Mapping
- Audit Logs
- Export Data
- Subscriptions
- SMS Gateway

What each section is used for:

- `Clinic Profile`: clinic identity, contact details, banner, and profile maintenance
- `Create User`: clinic user management
- `Build Up`: template forms, lab providers, and employee setup
- `Data Mapping`: data conversion and migration helpers
- `Audit Logs`: review change history and operational trace data
- `Export Data`: download clinic datasets as CSV
- `Subscriptions`: review current plan, validity, and related status
- `SMS Gateway`: configure and test the Android SMS Gateway used by the clinic when the plan and role allow access

SMS Gateway notes from the current implementation:

- The tab is hidden for `Basic` subscription clinics.
- Only clinic-wide administrators can configure and test gateway settings.
- Clinics save a per-clinic Android device `Base URL`, send endpoint, optional API key, timeout, and enabled state.
- The UI includes an in-app test SMS action for validating device connectivity.

### 4.11 Subscription and Payments

The subscription module uses a 4-step flow:

1. Choose Plan
2. Payment
3. Confirm
4. Done

Supported payment channels in the current frontend:

- `PayMongo`
- `Manual Payment`

Manual payment methods currently exposed:

- `GCash`
- `BPI Account`

Current subscription plans defined in the code:

| Plan | Monthly options shown in UI | Notes |
|---|---|---|
| Basic | 3, 6, 12 months | Inventory excluded |
| Standard | 3, 6, 12 months | Inventory included |
| Premium | 3, 6, 12 months | Includes branch management |

Current plan features in code:

| Plan | Included features |
|---|---|
| Basic | Up to 2 users, up to 1,000 patients, up to 500 patient files/photos, no SMS reminders, no email notifications, no inventory |
| Standard | Up to 5 users, up to 1,000 patients, up to 1,000 patient files/photos, SMS reminders, email notifications, inventory |
| Premium | Up to 10 users, up to 2,000 patients, up to 2,000 patient files/photos, SMS reminders, email notifications, inventory, clinic branch management |

### 4.12 AI Assistant

The AI assistant is available inside the clinic workspace and changes behavior depending on where the user is.

Current behavior from the frontend:

- General clinic mode on normal workspace routes
- Patient-aware mode inside `/patient-profile/:patientId`
- Suggested prompts based on page context
- Voice input support through browser speech recognition
- Voice reply support through browser speech synthesis

The assistant is explicitly presented as a helper. The UI warns users that AI can be wrong and that clinical content should be reviewed before acting on it.

### 4.13 About and feedback

The clinic side navigation includes an About/Feedback dialog that lets a clinic send feature suggestions, bug reports, billing concerns, and general feedback to the OralSync team.

## 5. Public Appointment Registration

The public registration page is available at:

- `/register-appointment?clinicId=<value>`

The current public flow supports:

- Loading clinic branding and schedule context from the QR or shared link
- Showing clinic details such as address, contact info, open days, hours, and lunch break
- Registering a new patient appointment
- Looking up an existing patient
- Email verification for appointment registration

The frontend states that public registrations are saved as appointment requests tied to the target clinic.

## 6. Admin Portal

The admin portal currently has three pages:

- Dashboard
- Clinic Locks
- Payment Request

Current dashboard behavior includes:

- Total clinic count
- Total doctor count
- Total patient count
- Daily patient creation trends
- Clinic owners list
- Clinic breakdown with privacy and lock status

The admin payment request view is backed by pending manual subscription payment APIs.

## 7. Files, Uploads, and Media

The current system supports multiple upload flows, including:

- Clinic banner upload
- Branch banner upload
- Patient profile picture upload
- Employee profile picture upload
- Lab case attachment upload
- Manual payment proof upload
- Patient upload files
- Dental chart image upload

Important storage behavior:

- Public clinic banners can be served from `/storage/...`
- Protected clinic assets are fetched through authenticated storage URLs
- The frontend does not manually build storage URLs for protected files

## 8. Notifications and Background Behavior

The backend and Hangfire worker currently support:

- Appointment reminder SMS
- Birthday greeting SMS
- Trial ending reminders
- Automatic clinic locking when validity expires

Current SMS delivery note:

- Patient-facing and scheduled SMS delivery can use either the Android SMS Gateway or Semaphore depending on the active backend SMS provider setup.

Default job schedules are documented in [development-architecture.md](development-architecture.md).

## 9. PWA Behavior

The web app is installable as a standalone PWA.

Verified from `public/manifest.json` and `public/service-worker.js`:

- App shell files are cached
- Static frontend assets are cached
- API requests and protected storage requests are not cached by the service worker
- Offline fallback is shell-oriented, not live-data offline mode

This means OralSync can cache the app shell, but patient and clinic data still depend on live backend access.
