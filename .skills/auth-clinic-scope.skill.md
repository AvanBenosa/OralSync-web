# Skill: Auth & Clinic Scope
# OralSync Frontend — Auth and Clinic Scoping Skill

> Use this skill when working with authentication, JWT tokens, route guards,
> clinic data isolation, and subscription-gated features.

---

## Auth Flow Summary

```
User submits login
  → loginUser() in auth-api.ts
  → API returns { token, user: AuthUser, requiresRegistration }
  → authStore.setSession(token, username, requiresRegistration, user)
  → token + user persisted to localStorage ("dmd-auth")

On page reload / app mount
  → App.tsx calls hydrateSession()
  → If token expired → logout(), clear store
  → If token valid → restore isLoggedIn, user, username

On API 401 response
  → apiClient interceptor calls logout()
  → User redirected to login

On API 423 response (clinic locked)
  → apiClient interceptor sets user.isLocked = true
  → mainLayout shows ClinicLockedDialog
```

---

## Clinic Data Scoping

Every piece of clinic data requires a `clinicId`. This is resolved in two steps:

### Step 1 — Route passes clinicId as prop
In `routes.tsx`:
```tsx
<Route
  path="/inventory"
  element={<InventoryModule clinicId={user?.clinicId ?? undefined} />}
/>
```

### Step 2 — Module resolves clinicId
In every module's root `index.tsx`:
```ts
const resolvedClinicId = useClinicId(clinicId);
// useClinicId: takes the prop, falls back to authStore user.clinicId if prop is null/undefined
```

### Step 3 — Pass to api.ts functions
```ts
await HandleGetInventories(state, setState, resolvedClinicId, forceRefresh);
```

### Step 4 — api.ts sends it to backend
```ts
params: {
  ClinicId: resolvedClinicId ?? undefined,
  // ...
}
```

**If `resolvedClinicId` is null, no API call should be made.** Always guard:
```ts
if (!resolvedClinicId) {
  setState(prev => ({ ...prev, load: false }));
  return;
}
```

---

## AuthUser Fields Reference

```ts
interface AuthUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  clinicId?: string | null;          // Clinic this user belongs to
  clinicName?: string;               // Display name
  role: string;                      // 'SuperAdmin', 'Admin', 'Staff', etc.
  roleLabel: string;
  subscriptionType?: string;         // 'basic' | 'standard' | 'pro'
  validityDate?: string;             // Subscription expiry
  isLocked?: boolean;                // Clinic is locked
  isDataPrivacyAccepted?: boolean;
  isContractPolicyAccepted?: boolean;
  forBetaTestingAccepted?: boolean;
  portalType?: PortalType;
}
```

---

## Route Guards

| Guard | File | Allows |
|-------|------|--------|
| `PublicRoute` | common/routes/ | Only when NOT logged in |
| `ClinicRoute` | common/routes/ | Logged in + clinic user |
| `AdminRoute` | common/routes/ | Logged in + SuperAdmin role |

Usage in routes.tsx:
```tsx
<Route element={<ClinicRoute />}>
  <Route element={<MainLayout />}>
    <Route path="/inventory" element={<InventoryModule clinicId={user?.clinicId ?? undefined} />} />
  </Route>
</Route>
```

---

## Subscription Gating

Feature access based on subscription plan:

```ts
import { isBasicSubscription } from 'common/utils/subscription';

// In routes:
element={
  isBasicSubscription(user?.subscriptionType)
    ? <Navigate to="/dashboard" replace />
    : <InventoryModule clinicId={user?.clinicId ?? undefined} />
}
```

Subscription tiers:
| Type | `subscriptionType` value | User limit |
|------|--------------------------|------------|
| Basic | `'basic'` | 2 |
| Standard | `'standard'` | 10 |
| Pro/Premium | `'pro'` (normalized from `'premium'`) | unlimited |

Always use `isBasicSubscription(user?.subscriptionType)` — never compare the string directly (it normalizes typos like 'premuim').

---

## Consent / Lock Flow (mainLayout.tsx)

On every session, mainLayout checks these flags in order:

```
1. isLocked = true → show ClinicLockedDialog (blocks all navigation)
2. isDataPrivacyAccepted = false → show DataPrivacyConsentDialog
3. isContractPolicyAccepted = false → show ContractPolicyDialog
4. forBetaTestingAccepted = false → show BetaTestingDialog
5. All accepted → show normal app content
```

The clinic status is polled every **30 minutes** via `getClinicDataPrivacyStatus()`.

---

## JWT Utilities

From `src/common/utils/jwt.ts`:

```ts
import { decodeJwt, getUsernameFromToken, isTokenExpired } from 'common/utils/jwt';

// Decode JWT payload
const decoded = decodeJwt(token);
// decoded.exp — expiry timestamp (seconds)
// decoded.nameid — user ID
// decoded.unique_name — username

// Check expiry
const expired = isTokenExpired(token); // true if expired or no exp claim

// Extract username
const username = getUsernameFromToken(token);
```

---

## Prompt Template — Fix an Auth or Scope Bug

```
There's an auth/clinic scope bug in OralSync. Read CLAUDE.md and auth skill before answering.

## Bug
{DESCRIBE_ISSUE — e.g. "data not loading", "wrong clinic data showing", "redirect loop"}

## Auth state at time of bug
isLoggedIn: {true/false}
token: {present/expired/null}
user.clinicId: {VALUE or null}
user.role: {VALUE}
user.subscriptionType: {VALUE}

## Component
File: {FILE_PATH}
resolvedClinicId at load time: {VALUE or "unknown"}

## Relevant code
{PASTE}

## Check these
[ ] useClinicId(clinicId) called and result used (not the raw prop)
[ ] Guard: if (!resolvedClinicId) return early before API call
[ ] useAuthStore.getState() used in non-hook context (not useAuthStore hook)
[ ] Route protected with correct guard (ClinicRoute vs AdminRoute)
[ ] isBasicSubscription() used for subscription gating (not raw string compare)
[ ] mainLayout polling clinic status — is isLocked blocking access?
```

## Prompt Template — Add a Subscription-Gated Feature

```
I need to gate a feature by subscription type in OralSync.

## Feature: {FEATURE_NAME}
## Route: /{ROUTE_PATH}
## Who can access it: {STANDARD and PRO only / PRO only / ALL}

## Steps
1. In routes.tsx — wrap the route element:
   element={
     isBasicSubscription(user?.subscriptionType)
       ? <Navigate to="/dashboard" replace />
       : <{Feature}Module clinicId={user?.clinicId ?? undefined} />
   }

2. Optionally hide the nav link in sideNav when basic:
   { !isBasicSubscription(user?.subscriptionType) && <NavItem ... /> }

3. Optionally show an upgrade prompt inside the component:
   if (isBasicSubscription(user?.subscriptionType)) {
     return <UpgradePrompt message="This feature requires Standard or Pro." />;
   }

## Rules
- Always use isBasicSubscription() from common/utils/subscription
- Never compare subscriptionType string directly (it may have typos from API)
- Redirect to /dashboard as the standard fallback for locked routes
```

---

*Last updated: April 2026*
