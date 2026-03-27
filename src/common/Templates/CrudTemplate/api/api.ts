// TODO: Replace MODULE_NAME, module_name tokens (see types.ts header)

import { isAxiosError } from 'axios';

import { MODULE_NAMEModel, MODULE_NAMEResponseModel, MODULE_NAMEStateModel } from './types';
import { resolveClinicId } from '../../../components/ClinicId';
import { apiClient } from '../../../services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../api/responses';

// TODO: update these endpoints
const GET_ENDPOINT = '/api/dmd/module_names/get-module_names';
const CREATE_ENDPOINT = '/api/dmd/module_names/create-module_names';
const UPDATE_ENDPOINT = '/api/dmd/module_names/put-module_names';
const DELETE_ENDPOINT = '/api/dmd/module_names/delete-module_names';

const requestCache = new Map<string, Promise<MODULE_NAMEResponseModel>>();
const responseCache = new Map<string, { data: MODULE_NAMEResponseModel; cachedAt: number }>();
const CACHE_TTL_MS = 5000;

export const GetMODULE_NAMEs = async (
  state: MODULE_NAMEStateModel,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<MODULE_NAMEResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const query = String(state.search ?? '').trim();
  const pageStart =
    state.pageStart && state.totalItem && state.pageStart === state.totalItem
      ? state.pageStart - state.pageEnd
      : state.pageStart;
  const pageEnd = state.pageEnd;

  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    query: query || 'all',
    pageStart,
    pageEnd,
  });

  if (forceRefresh) responseCache.delete(requestKey);

  const cached = responseCache.get(requestKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.data;

  const active = requestCache.get(requestKey);
  if (active) return active;

  const request = (async (): Promise<MODULE_NAMEResponseModel> => {
    try {
      const response = await apiClient.get<MODULE_NAMEResponseModel>(GET_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          Que: query || 'all',
          pageStart,
          pageEnd,
        },
      });

      const data = (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as
        | MODULE_NAMEResponseModel
        | undefined) || { items: [], pageStart: 0, pageEnd, totalCount: 0 };

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

export const CreateMODULE_NAME = async (request: MODULE_NAMEModel): Promise<MODULE_NAMEModel> => {
  try {
    const response = await apiClient.post<MODULE_NAMEModel>(CREATE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as MODULE_NAMEModel;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

export const UpdateMODULE_NAME = async (request: MODULE_NAMEModel): Promise<MODULE_NAMEModel> => {
  try {
    const response = await apiClient.put<MODULE_NAMEModel>(UPDATE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as MODULE_NAMEModel;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

export const DeleteMODULE_NAME = async (request: MODULE_NAMEModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};
