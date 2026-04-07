# .skills/ — OralSync Frontend Skill Index

> This folder contains context + prompt skill files for Claude.
> Each file teaches Claude a specific skill grounded in OralSync's real patterns.
> Reference these files by name when starting a prompt.

---

## Skill Files

| File | Skill | Use When |
|------|-------|----------|
| `code-explain.skill.md` | **Code Explain** | You want Claude to explain what a file/function does and how it fits the system |
| `frontend-component.skill.md` | **Frontend Component** | Writing or extending React components (header, table, form, modal, root module) |
| `api-integration.skill.md` | **API Integration** | Writing api.ts, handlers.ts, types.ts — the full HTTP + orchestration layer |
| `state-management.skill.md` | **State Management** | Working with useState feature state or Zustand global stores; debugging state bugs |
| `bug-fix.skill.md` | **Bug Fix** | Diagnosing and fixing bugs — includes checklists by bug category |
| `typescript-types.skill.md` | **TypeScript & Types** | Writing types, fixing TS errors, Yup + TypeScript integration |
| `forms-validation.skill.md` | **Forms & Validation** | Formik forms, Yup schemas, frontend ↔ backend validation sync |
| `auth-clinic-scope.skill.md` | **Auth & Clinic Scope** | JWT, route guards, clinicId scoping, subscription gating, consent flow |

---

## How to Use with Claude

### Option A — Reference by name
At the start of your prompt, tell Claude which skill to use:
```
Read the api-integration.skill.md from the .skills/ folder, then help me add a new API call to the inventory feature.
```

### Option B — Include the skill in context
Open the skill file and paste its content into your Claude conversation before your question.

### Option C — Use the CLAUDE-PROMPTS.md templates
The prompt templates in `CLAUDE-PROMPTS.md` already reference CLAUDE.md as context.
For extra precision, add: "also follow the {skill-name} skill rules."

---

## Quick Skill Selector

**"I need to add a new module"**
→ `frontend-component.skill.md` + `api-integration.skill.md`

**"I need to connect to a new backend endpoint"**
→ `api-integration.skill.md`

**"Something is broken"**
→ `bug-fix.skill.md`

**"My form is not working"**
→ `forms-validation.skill.md` + `bug-fix.skill.md`

**"I'm getting TypeScript errors"**
→ `typescript-types.skill.md`

**"State is behaving weirdly"**
→ `state-management.skill.md`

**"I don't understand this code"**
→ `code-explain.skill.md`

**"User can't see data / wrong clinic data"**
→ `auth-clinic-scope.skill.md`

**"I need to add role/subscription gating"**
→ `auth-clinic-scope.skill.md`

---

*Last updated: April 2026*
