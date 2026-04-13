# OralSync PWA Setup Guide

This guide explains the Progressive Web App setup used in OralSync and how to test, maintain, and deploy it safely.

## Goal

OralSync uses a **safe PWA setup**:

- the app shell can be installed like an app
- static frontend assets can be cached for faster reopen
- live cloud data still comes from the backend
- patient data, billing data, uploads, and API responses are **not cached offline**

This is important for a clinic system so users do not see stale patient records from an aggressive offline cache.

## Main Files

These are the main files used for the OralSync PWA setup:

- `src/index.tsx`
- `src/serviceWorkerRegistration.ts`
- `src/common/hooks/use-pwa-install.ts`
- `src/common/components/pwa-install-banner.tsx`
- `src/mainLayout.tsx`
- `public/service-worker.js`
- `public/manifest.json`
- `public/index.html`
- `public/offline.html`
- `public/_staticwebapp.config.json`
- `public/staticwebapp.config.json`

## How OralSync PWA Works

### 1. Manifest

The manifest tells the browser that OralSync is installable.

File:

- `public/manifest.json`

What it defines:

- app name
- short name
- icons
- theme color
- standalone display mode

### 2. Service Worker Registration

The service worker is only registered in **production**.

Files:

- `src/index.tsx`
- `src/serviceWorkerRegistration.ts`

Important behavior:

- no registration during normal development mode
- registration happens after the app loads in production
- if there is an updated version, the browser can replace the old cached shell

### 3. Service Worker Cache Rules

File:

- `public/service-worker.js`

What it caches:

- `index.html`
- `offline.html`
- manifest
- icons
- static build files under `/static/*`

What it does **not** cache:

- `/api/*`
- `/storage/*`
- protected files
- live backend data

This is the clinic-safe part of the setup.

### 4. Offline Fallback

File:

- `public/offline.html`

If the internet is unavailable and OralSync cannot load live data, the user sees a simple offline page instead of stale medical/business content.

### 5. Install Banner

Files:

- `src/common/hooks/use-pwa-install.ts`
- `src/common/components/pwa-install-banner.tsx`
- `src/mainLayout.tsx`

How it works:

- listens for the browser `beforeinstallprompt` event
- shows the `Install OralSync` banner when install is available
- hides itself when the app is already installed
- supports a manual message for iPhone/iPad Safari

## Step-by-Step Setup

If you need to recreate or understand the setup from scratch, follow this order:

### Step 1. Add the manifest

Create:

- `public/manifest.json`

Make sure it includes:

- app name
- short name
- icons
- `display: "standalone"`
- theme/background colors

### Step 2. Link the manifest in HTML

Edit:

- `public/index.html`

Make sure it includes:

- `<link rel="manifest" href="%PUBLIC_URL%/manifest.json" />`
- `theme-color`
- apple mobile web app meta tags
- apple touch icon

### Step 3. Add the service worker file

Create:

- `public/service-worker.js`

Recommended strategy for OralSync:

- cache only shell/static assets
- keep live API data network-based
- show `offline.html` when navigation fails offline

### Step 4. Register the service worker

Create:

- `src/serviceWorkerRegistration.ts`

Then call it from:

- `src/index.tsx`

Important:

- register only in production
- avoid forcing this in development

### Step 5. Add the offline page

Create:

- `public/offline.html`

This page should explain:

- the shell is available
- cloud data still needs connection
- no sensitive live records are stored offline

### Step 6. Add install prompt support

Create:

- `src/common/hooks/use-pwa-install.ts`

This hook should:

- detect `beforeinstallprompt`
- detect installed/standalone mode
- allow dismissing the install banner
- support Safari manual instructions

### Step 7. Add the install UI

Create:

- `src/common/components/pwa-install-banner.tsx`

Mount it in:

- `src/mainLayout.tsx`

This keeps the install experience inside OralSync.

### Step 8. Add correct hosting cache headers

Edit:

- `public/_staticwebapp.config.json`
- `public/staticwebapp.config.json`

Recommended rules:

- `index.html`, `manifest.json`, `service-worker.js`, and `offline.html` should be `no-cache`
- `/static/*` files should be long-cache and immutable
- icons can use shorter public cache

These files apply to Azure Static Web Apps. They do not configure Azure App Service Linux.

## How To Test Locally

The PWA install flow should be tested using the production build.

### Step 1. Build

```powershell
npm run build
```

### Step 2. Serve the build

```powershell
npx serve -s build
```

### Step 3. Open the app

Open the local URL shown by `serve`.

Example:

```text
http://localhost:3000
```

### Step 4. Log in

Open the normal OralSync app and log in.

### Step 5. Look for install UI

You should see one of these:

- the `Install OralSync` banner inside the app
- the browser install icon in Chrome or Edge

### Step 6. Install the app

Desktop Chrome/Edge:

- click `Install OralSync`

Android Chrome:

- accept the browser install prompt

iPhone/iPad Safari:

- tap `Share`
- tap `Add to Home Screen`

## Why Install May Not Appear

If the install button is not showing, check these:

- you are using the production build, not `npm start`
- the app is already installed
- the browser already dismissed the install prompt
- the browser does not support install prompt the same way
- the app is not served in a valid installable context

To retest:

- uninstall the app if already installed
- clear site data/service worker in browser dev tools
- refresh the served production build

## How To Check Service Worker

In Chrome or Edge:

1. Open DevTools
2. Go to `Application`
3. Open `Service Workers`
4. Check if `service-worker.js` is registered

You can also inspect:

- Cache Storage
- Manifest
- installability status

## Cloud Deployment Notes

OralSync can still run fully in the cloud as a PWA.

The PWA does **not** replace:

- your backend API
- your cloud database
- authentication
- protected uploads

It only improves:

- installability
- startup speed
- shell caching
- app-like experience

Recommended production setup:

- use HTTPS
- keep live API data network-first
- do not cache sensitive medical/business API responses offline
- keep service worker and manifest files no-cache so updates roll out correctly

Azure App Service Linux deployment notes:

- deploy the built file contents so `manifest.json`, `service-worker.js`, and `index.html` exist directly under `/home/site/wwwroot`
- `public/web.config` is only used by IIS on Windows App Service
- `public/staticwebapp.config.json` is only used by Azure Static Web Apps
- use a Linux startup command that serves `wwwroot` as an SPA, for example:

```bash
pm2 serve /home/site/wwwroot --no-daemon --spa --port 8080
```

## What To Change Later

If you want to improve the PWA later, these are safe next steps:

- add an update available toast/banner
- add better app icons and splash assets
- add a settings toggle for install help
- add push notifications later if your workflow needs them

Avoid this unless you design it carefully:

- offline caching of patient records
- offline caching of billing totals
- offline caching of appointment changes
- offline caching of protected uploads

## Quick Summary

OralSync now supports:

- install banner
- manifest
- service worker
- offline fallback page
- safe shell caching

OralSync intentionally does **not** support:

- offline patient-data mode
- offline API-data cache

That is the correct and safer starting point for a cloud-based clinic system.
