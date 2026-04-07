# Skill: API Integration
# OralSync Frontend — API Layer Skill

> Use this skill when writing or modifying anything in a feature's `api/` folder:
> api.ts, handlers.ts, types.ts, and the service files under common/services/.

---

## The 3-Layer API Architecture

```
Component / Page
      ↓  calls
handlers.ts          ← orchestration: calls api.ts, then updates setState
      ↓  calls
api.ts               ← HTTP layer: apiClient, caching, error handling
      ↓  uses
apiClient            ← Axios instance (src/common/services/api-client.ts)
                        auto-attaches JWT, handles 401/423
```

Never call `apiClient` directly from a component or handler. Each layer has one job.

---

## api.ts Rules

### Structure every function like this:
```ts
export const GetItems = async (
  state: ItemStateModel,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<ItemResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const requestKey = JSON.stringify({ clinicId: resolvedClinicId, ...pagination });

  // 1. Force refresh clears cache
  if (forceRefresh) {
    responseCache.delete(requestKey);
  }

  // 2. Return cached response if still fresh (5s TTL)
  const cached = responseCache.get(requestKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  // 3. Deduplicate in-flight requests
  const active = requestCache.get(requestKey);
  if (active) return active;

  // 4. Make the actual request
  const request = (async (): Promise<ItemResponseModel> => {
    try {
      const response = await apiClient.get<ItemResponseModel>(ENDPOINT, { params: { ... } });
      const data = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || defaultValue;
      responseCache.set(requestKey, { data, cachedAt: Date.now() });
      return data;
    } catch (error) {
      if (isAxiosError(error)) await ExceptionResponse(error);
      throw error;
    } finally {
      requestCache.delete(requestKey);
    }
  })();

  requestCache.set(requestKey, request);
  return request;
};
```

### Mutation functions (POST/PUT/DELETE) are simpler:
```ts
export const CreateItem = async (request: ItemModel): Promise<ItemModel> => {
  try {
    const response = await apiClient.post<ItemModel>(CREATE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as ItemModel;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};
```

### Cache constants:
```ts
const CACHE_TTL_MS = 5000;
const requestCache = new Map<string, Promise<ItemResponseModel>>();
const responseCache = new Map<string, { data: ItemResponseModel; cachedAt: number }>();
```

---

## handlers.ts Rules

Handlers are the only place that call `setState`. They are `async` and `void`.

```ts
export const HandleGetItems = async (
  state: ItemStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetItems(state, clinicId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response.items || [],
    pageStart: response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
  });
};

export const HandleCreateItem = async (
  request: ItemModel,
  state: ItemStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
    totalItem: state.totalItem + 1,
  });
};

export const HandleDeleteItem = async (
  request: ItemModel,
  state: ItemStateModel,
  setState: Function
): Promise<void> => {
  await DeleteItem(request);
  setState((prev: ItemStateModel) => ({
    ...prev,
    items: prev.items.filter(item => item.id !== (prev.selectedItem?.id ?? request.id)),
    openModal: false,
    totalItem: Math.max(prev.totalItem - 1, 0),
  }));
};
```

---

## types.ts Rules

```ts
// 1. Props — what the module page receives from the route
export type ItemProps = { clinicId?: string };

// 2. Model — maps 1:1 to backend DTO, all fields optional/nullable
export type ItemModel = {
  id?: string;
  clinicProfileId?: string | null;
  name?: string;
  // ... all other fields optional
};

// 3. Response model — matches paginated API response shape
export type ItemResponseModel = {
  items: ItemModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

// 4. State model — everything the module page manages
export type ItemStateModel = {
  items: ItemModel[];
  load: boolean;
  search?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: ItemModel;
  initial: number;
  pageStart: number;
  pageEnd: number;
  totalItem: number;
  clinicProfileId?: string | null;
};

// 5. State props — what child components receive
export type ItemStateProps = {
  state: ItemStateModel;
  setState: Function;
  onReload?: () => void;
};
```

---

## SuccessResponse / ExceptionResponse Reference

From `src/common/api/responses.ts`:

| Function | When to use | Toast behavior |
|----------|------------|----------------|
| `SuccessResponse(res, ResponseMethod.Fetch, undefined, false)` | GET — no toast | None |
| `SuccessResponse(res, ResponseMethod.Create)` | POST | "Successfully Created!" |
| `SuccessResponse(res, ResponseMethod.Update)` | PUT | "Successfully Updated!" |
| `toastSuccess('Your message')` | Manual success toast | Custom message |
| `ExceptionResponse(error)` | Any catch block | Error message from API |
| `toastError('Your message')` | Manual error toast | Custom message |

---

## Protected Asset URLs

For files stored under `/storage/`:
```ts
import { resolveProtectedApiAssetUrl, loadProtectedAssetObjectUrl } from 'common/services/api-client';

// For <img src={...}> — returns the API URL with auth baked in via fetch
const objectUrl = await loadProtectedAssetObjectUrl(path); // returns blob: URL

// For passing to an anchor href or displaying an image URL
const url = resolveProtectedApiAssetUrl(path); // returns https://api.../api/dmd/storage/...
```

Never construct `/storage/` URLs manually. Always use these helpers.

---

## Prompt Template — Write API Layer for a New Feature

```
Write the full api/ layer for a new OralSync frontend feature. Follow the API integration skill rules.

## Feature: {FEATURE_NAME}
Folder: src/features/{FEATURE_FOLDER}/api/

## Backend endpoints
GET    {GET_ENDPOINT}     — query params: ClinicId, Que, pageStart, pageEnd
POST   {CREATE_ENDPOINT}  — body: {REQUEST_SHAPE}
PUT    {UPDATE_ENDPOINT}  — body: {REQUEST_SHAPE}
DELETE {DELETE_ENDPOINT}  — body: { id }

## Model fields
{FIELD}: {TS_TYPE}

## Enums (if any)
{ENUM_NAME}: {VALUES}

## Generate
1. types.ts — Props, Model, ResponseModel, StateModel, StateProps, enums + label maps
2. api.ts — GET with 5s cache + dedup, CREATE, UPDATE, DELETE
3. handlers.ts — HandleGet, HandleCreate, HandleUpdate, HandleDelete
4. validation.ts — Yup schema for create/edit form

## Rules
- GET cache TTL: 5000ms
- forceRefresh param on GET and HandleGet
- All catch blocks: if (isAxiosError(error)) await ExceptionResponse(error); throw error;
- DELETE handler must use functional setState with prev => filter pattern
- All model fields optional/nullable
```

---

## Prompt Template — Add a New API Call to Existing Feature

```
Add a new API call to an existing OralSync feature. Follow the API integration skill rules.

## Feature: {FEATURE_NAME}
## New operation: {WHAT_IT_DOES}

## Endpoint
Method: {GET|POST|PUT|DELETE}
URL: /api/dmd/{PATH}
Request: {REQUEST_SHAPE}
Response: {RESPONSE_SHAPE}

## Add to api.ts:
- Function name: {FUNCTION_NAME}
- {Cache needed: YES/NO} — if GET, follow the 5s cache + dedup pattern
- {Mutation: YES/NO} — if mutation, use SuccessResponse with appropriate ResponseMethod

## Add to handlers.ts:
- Handler name: {HANDLER_NAME}
- State update: {DESCRIBE_HOW_STATE_CHANGES}

## Do not change:
- Existing functions in api.ts
- Existing StateModel shape (unless adding a new field)
```

---

*Last updated: April 2026*
