# OralSync API Reference

Updated: April 14, 2026

This is a high-level reference for the current backend route surface verified from `../OralSync-API/DMD/Controllers`.

## 1. Base Notes

- Most controllers inherit `BaseController` and are JWT-protected by default.
- Public routes explicitly use `[AllowAnonymous]`.
- Route naming is currently action-based rather than strictly resource-based.
- Common patterns include `get-*`, `create-*`, `put-*`, `delete-*`, and upload-specific actions.

## 2. Core Utility Endpoints

API host utility endpoints:

- `/`
- `/health`
- `/startup-log`
- `/swagger`

Hangfire worker endpoints:

- `/hangfire`
- `/health`

## 3. Controller Groups

| Area | Base route | Example actions |
|---|---|---|
| Auth | root routes such as `/login`, `/register/...`, `/forgot-password` | login, register clinic, register bootstrap user, registration status, forgot password, change password |
| Clinic | `/api/dmd/clinic` | create clinic, get current clinic profile, get audit logs, upload banner, update clinic profile, send feedback, data privacy status, accept policies, get/save Android SMS Gateway |
| Clinic Branch | `/api/dmd/clinic-branch` | get branches, create branch, update branch, delete branch, upload banner |
| Dashboard | `/api/dmd/dashboard` | get dashboard summary |
| Patient | `/api/dmd/patient` | get patients, create patient, update patient, delete patient, upload profile picture, upload XLSX |
| Patient Profile | `/api/dmd/patient-profile` | get patient profile, delete patient, send email, send SMS |
| Patient Progress Notes | `/api/dmd/patient-progress-note` | get, create, upload XLSX, update, delete |
| Patient Medical History | `/api/dmd/patient-medical-history` | get, create, update, delete |
| Patient Dental Chart | `/api/dmd/patient-dental-chart` | get, create, update, delete, upload chart image |
| Patient Perio Chart | `/api/dmd/patient-perio-chart` | get, create, update, delete |
| Patient Forms | `/api/dmd/patient-form` | get, create, update, delete |
| Patient Uploads | `/api/dmd/patient-uploads` | get, create, update, delete, upload file |
| Patient Appointment Record | `/api/dmd/patient-appointment-record` | get, create, update, delete |
| Patient Overview | `/api/dmd/patient-overview` | get patient overview |
| Patient Dental Photo | `/api/dmd/patient-dental-photo` | get patient dental photo |
| Patient Emergency Contact | `/api/dmd/patient-emergencyContact` | get, create, update, delete |
| Appointment | `/api/dmd/appointment` | get appointments, create appointment, update appointment, delete appointment |
| Dental Inventories | `/api/dmd/dental-inventories` | get, create, update, delete |
| Clinic Expenses | `/api/dmd/clinic-expenses` | get, create, update, delete |
| Invoice Generator | `/api/dmd/invoice-generator` | get invoice generator data |
| Lab Cases | `/api/dmd/lab-cases` | get lab cases, download summary, create, update, delete, upload attachment |
| Template Forms | `/api/dmd/template-form` | get, create, update, delete |
| Lab Providers | `/api/dmd/lab-provider` | get, create, update, delete |
| Employee | `/api/dmd/employee` | get, create, update, delete, upload profile picture |
| User Profile | `/api/dmd/user-profile` | get user profiles, create, update, delete |
| Export Data | `/api/dmd/export-data` | get export datasets, download CSV |
| Reports | `/api/dmd/reports` | revenue summary, expense breakdown, outstanding balances, profit/loss, patient growth, patient demographics, appointment volume, appointment funnel |
| Android SMS | `/api/dmd/android-sms` | send direct SMS, send test SMS |
| Payments | `/api/dmd/payments` | create payment link, upload manual proof, create manual payment, get manual status, get transactions, poll status, simulate paid, webhook |
| AI | `/api/dmd/ai` | chat |
| Storage | `/api/dmd/storage` and `/storage/...` | protected file fetch, public banner fetch, SAS URL |
| Public Registration | `/api/public/registration` | request email verification code, verify code, get clinic context, existing patient lookup, create patient appointment |
| Admin | `/api/dmd/admin` | dashboard summary, get clinics, set clinic lock, subscription histories, manual payment review |

## 4. Important Public Routes

Routes verified as public-facing or anonymous include:

- `/login`
- `/register/clinic/request-code`
- `/api/register/request-code`
- `/register/clinic`
- `/api/register/clinic`
- `/forgot-password`
- `/api/auth/forgot-password`
- `/api/public/registration/request-email-verification-code`
- `/api/public/registration/verify-email-verification-code`
- `/api/public/registration/clinic`
- `/api/public/registration/existing-patient`
- `/api/public/registration/create-patient-appointment`
- `/api/dmd/payments/webhook`
- `/storage/{*filePath}` for allowed public banner assets

## 5. Payment Routes

Current clinic subscription and payment routes:

- `/api/dmd/payments/create-payment-link`
- `/api/dmd/payments/upload-manual-payment-proof`
- `/api/dmd/payments/create-manual-payment`
- `/api/dmd/payments/manual-payment-status`
- `/api/dmd/payments/manual-payment-transactions`
- `/api/dmd/payments/status`
- `/api/dmd/payments/simulate-paid`
- `/api/dmd/payments/webhook`

## 6. Storage Routes

Current storage routes:

- `/storage/{*filePath}`: public file access, limited to allowed clinic banner paths
- `/api/dmd/storage/{*filePath}`: protected file access
- `/api/dmd/storage/sas/{*filePath}`: SAS URL generation where supported

## 7. Reports Routes

Current reports and analytics routes:

- `/api/dmd/reports/revenue-summary`
- `/api/dmd/reports/expense-breakdown`
- `/api/dmd/reports/outstanding-balances`
- `/api/dmd/reports/profit-loss`
- `/api/dmd/reports/patient-growth`
- `/api/dmd/reports/patient-demographics`
- `/api/dmd/reports/appointment-volume`
- `/api/dmd/reports/appointment-funnel`

Common query parameters used by the reports surface:

- `ClinicId`
- `BranchId`
- `DateFrom`
- `DateTo`

## 8. Android SMS Routes

Current Android SMS Gateway routes:

- `GET /api/dmd/clinic/android-sms-gateway`
- `PUT /api/dmd/clinic/android-sms-gateway`
- `POST /api/dmd/android-sms/send`
- `POST /api/dmd/android-sms/test`

## 9. Notes for Developers

- Locked clinics are blocked at the filter level for most API actions and receive `423 Locked`.
- Storage and clinic data are scoped by `clinicId`.
- The frontend relies on these routes as currently named, so route renames should be coordinated carefully across both repos.
