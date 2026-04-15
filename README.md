# OralSync Frontend

React + TypeScript + MUI frontend for the OralSync dental SaaS platform.

This repo contains the clinic workspace, admin portal, PWA shell, and shared UI/service layers used by the OralSync web app. It works with the sibling backend repo at `../OralSync-API`.

## Current Feature Highlights

- Dashboard and clinic workspace shell
- Patients, patient profile modules, and uploads
- Appointment scheduling and public appointment registration
- Billing, expenses, and invoice generator
- Dental lab cases and inventory management
- Reports & Analytics module
  - Finance
  - Patients
  - Appointments
- Settings workspace
  - Clinic profile
  - User management
  - Build-up and templates
  - Data mapping
  - Audit logs
  - Export data
  - Subscriptions
  - Android SMS Gateway settings
- AI assistant with clinic-aware and patient-aware modes
- PWA install support

## Repo Pairing

- Frontend: `OralSync`
- Backend: `../OralSync-API`

The frontend expects the backend API to be available locally at `http://localhost:5002` unless overridden by environment variables.

## Getting Started

### Requirements

- Node.js LTS
- npm
- Running backend API from `../OralSync-API`

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Alternative dev profile:

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

## Documentation

- [Documentation Index](DOCUMENTATION.md)
- [System Manual](docs/system-manual.md)
- [Development Architecture](docs/development-architecture.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [PWA Setup](docs/PWA-SETUP.md)

## Notes

- The Reports & Analytics module is available at `/reports`.
- Android SMS Gateway settings are available in `Settings > SMS Gateway` for eligible clinics.
- The system can work with either Android SMS Gateway or Semaphore SMS, depending on backend setup.
