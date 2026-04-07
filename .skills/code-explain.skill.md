# Skill: Code Explain
# OralSync Frontend — Code Explanation Skill

> Use this skill when you want Claude to explain any piece of OralSync frontend code clearly —
> what it does, why it works, and how it fits into the larger system.

---

## What This Skill Does

Claude will explain code by covering:
1. **What** the code does (plain English summary)
2. **Why** it's written this way (design decision / pattern)
3. **How** it fits into the OralSync architecture
4. **Gotchas** — things that could go wrong or that are easy to misunderstand
5. **Related files** — other files you'd need to touch if you changed this

---

## Prompt Template

```
Explain the following OralSync frontend code to me. Use CLAUDE.md as context.

## Code to explain
File: {FILE_PATH}

```{PASTE_CODE}```

## What I want to understand
[ ] What does this code do overall?
[ ] Why is it structured this way?
[ ] How does it connect to the rest of the app?
[ ] What are the edge cases or gotchas?
[ ] What other files are involved?

## My level
[ ] I'm new to this codebase — explain from scratch
[ ] I understand React/TS — focus on OralSync-specific patterns
[ ] I already understand the pattern — just explain this specific logic
```

---

## Examples of When to Use This

### Explain the state pattern
```
Explain the following OralSync frontend code to me.

File: src/features/inventory/index.tsx

[paste the state initialization and loadInventories function]

What I want to understand:
- Why does loadInventories take forceRefresh and shouldSetLoadingState params?
- Why are there two separate timeout refs (reloadTimeoutRef, searchTimeoutRef)?
- Why does the useEffect have that specific dependency array?
```

### Explain the auth flow
```
Explain the following OralSync frontend code to me.

File: src/common/store/authStore.tsx

[paste hydrateSession and setSession]

What I want to understand:
- What is hydrateSession doing exactly and when is it called?
- Why does logout also call useThemeStore.getState().resetColorMode()?
- What's the "dmd-auth" key in localStorage?
```

### Explain the API client interceptors
```
Explain the following OralSync frontend code to me.

File: src/common/services/api-client.ts

[paste the interceptors]

What I want to understand:
- What happens on a 401 response?
- What happens on a 423 response and what does isLocked: true do downstream?
- Why do we call useAuthStore.getState() instead of the hook inside an interceptor?
```

---

## OralSync-Specific Concepts Claude Will Reference

When explaining code, Claude uses these OralSync-specific terms correctly:

| Term | Meaning |
|------|---------|
| `resolvedClinicId` | The clinicId resolved from prop or fallback to authStore user's clinicId via `useClinicId()` |
| `StateModel` | Feature-level state object (items, load, pagination, modal flags, selectedItem) |
| `StateProps` | Props type passed to child components: `{ state, setState, onReload? }` |
| `handlers.ts` | Orchestration layer between api.ts and the React setState — no UI logic |
| `api.ts` | Pure HTTP layer — cache, dedup, apiClient calls, error handling |
| `SuccessResponse` | Wrapper that extracts `response.data` and fires a success toast |
| `ExceptionResponse` | Wrapper that extracts error message and fires an error toast |
| `forceRefresh` | Bypasses the 5s response cache to force a fresh API fetch |
| `persist` middleware | Zustand middleware that syncs a store slice to localStorage |
| `hydrateSession` | Restores auth state on page load, clears if token is expired |
| `useClinicId(clinicId)` | Hook that resolves clinicId from prop OR falls back to authStore |
| `resolveProtectedApiAssetUrl` | Converts `/storage/...` paths to authenticated API URLs |
| `isBasicSubscription` | Returns true if user is on the Basic plan (limits feature access) |

---

*Last updated: April 2026*
