# OralSync Deployment Guide

Updated: April 14, 2026

This document covers local development setup, runtime hosts, configuration areas, and deployment-oriented notes based on the current frontend repo (`OralSync`) and sibling backend repo (`../OralSync-API`).

## 1. Local Development

### 1.1 Frontend

Current frontend scripts:

```bash
npm start
npm run start:dev
npm run build
npm run test
npm run format
npm run format:check
```

The frontend package config currently proxies local API traffic to:

```text
http://localhost:5002
```

### 1.2 Backend API

Run from the API project:

```bash
cd ../OralSync-API/DMD
dotnet run
```

Current root utility endpoints:

- `/`
- `/health`
- `/startup-log`
- `/swagger`

Development-only startup behavior:

- Applies migrations automatically
- Seeds the database automatically
- Attempts to ensure the Hangfire database exists

### 1.3 Hangfire worker

Run from the worker project:

```bash
cd ../OralSync-API/DMD.HANGFIRE
dotnet run
```

Worker endpoints:

- `/hangfire`
- `/health`

## 2. Runtime Hosts

Current runtime pieces:

- Frontend SPA
- ASP.NET Core API host
- Separate Hangfire worker host
- SQL Server application database
- SQL Server Hangfire database

External integrations currently wired into runtime:

- OpenAI Responses API
- Semaphore SMS
- Android phone running SMS Gateway API
- Gmail SMTP
- PayMongo
- Local storage or Azure Blob Storage

## 3. Frontend Configuration

The frontend uses `.env.*` files for values such as:

- `REACT_APP_API_URL`
- endpoint overrides for auth routes
- `REACT_APP_VERSION`

Related PWA setup details are documented in [PWA-SETUP.md](PWA-SETUP.md).

## 4. Backend Configuration

The backend appsettings files currently include sections for:

- `ConnectionStrings`
- `Cors`
- `Jwt`
- `Seed`
- `EmailSettings`
- `SemaphoreSmsSettings`
- `OpenAI`
- `Storage`
- `PayMongo`

The backend also relies on database-backed setup for:

- global `ActiveSMSConfig` selection from the admin setup screen
- per-clinic Android SMS Gateway configuration stored in the application database

The Hangfire worker currently includes sections for:

- `ConnectionStrings`
- `EmailSettings`
- `SemaphoreSmsSettings`
- `AppointmentReminderSettings`
- `ClinicAutoLockSettings`
- `TrialEndingReminderSettings`
- `BirthdayGreetingSettings`

Important SMS note:

- Android SMS Gateway does not require a dedicated appsettings section because gateway connection details are saved per clinic through the OralSync settings UI.

## 5. Storage Deployment Notes

Storage is abstracted behind `IClinicStorageService`.

Supported providers:

- Local file storage
- Azure Blob Storage

Provider selection is based on `Storage:Provider`.

Current clinic file layout is organized under:

```text
/storage/clinics/{clinicId}/...
```

## 6. Background Jobs

Verified recurring jobs in the current Hangfire worker:

- `patient-appointment-sms-reminders-evening-before`
- `patient-appointment-sms-reminders-morning-of`
- `clinic-profile-auto-lock-expired-validity`
- `clinic-profile-trial-ending-reminders`
- `patient-birthday-sms-greetings`

Default worker timezone in job settings is currently `Asia/Manila`.

## 7. Production Notes

Current production-oriented behavior visible in the code:

- The API skips automatic database setup when running in production.
- The Hangfire worker ensures Hangfire storage exists before registering jobs.
- The frontend PWA caches the app shell but not live API data.
- The API host enables response compression and output caching.

## 8. Secret Handling

Operational note:

- Real secrets should be moved to environment variables or a secret store for production deployments.
- Documentation should never copy literal API keys, SMTP passwords, or webhook secrets into docs.

## 9. Recommended Deployment Checklist

- Configure frontend `REACT_APP_API_URL`
- Configure backend connection strings
- Configure JWT settings
- Configure SMTP settings
- Configure the active SMS provider
- Configure Semaphore SMS settings if Semaphore is enabled
- Configure each clinic's Android SMS Gateway settings if Android SMS Gateway is enabled
- Configure OpenAI settings if AI is enabled
- Configure PayMongo settings if subscription billing is enabled
- Configure storage provider settings
- Start the API host
- Start the Hangfire worker
- Verify `/health`, `/swagger`, and `/hangfire`
