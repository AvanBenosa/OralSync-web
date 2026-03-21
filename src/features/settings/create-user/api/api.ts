import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { resolveClinicId } from '../../../../common/components/ClinicId';
import { CreateUserFormValues, SettingsUserModel, SettingsUserResponseModel } from './types';

const GET_USERS_ENDPOINT = '/api/dmd/user-profile/get-user-profiles';
const CREATE_USER_ENDPOINT = '/api/dmd/user-profile/create-user-profile';
const UPDATE_USER_ENDPOINT = '/api/dmd/user-profile/put-user-profile';
const DELETE_USER_ENDPOINT = '/api/dmd/user-profile/delete-user-profile';
const CLINIC_USERS_CACHE_TTL_MS = 5000;

const clinicUsersRequestCache = new Map<string, Promise<SettingsUserResponseModel>>();
const clinicUsersResponseCache = new Map<
  string,
  {
    data: SettingsUserResponseModel;
    cachedAt: number;
  }
>();

const buildClinicUsersCacheKey = (clinicId?: string | null): string =>
  resolveClinicId(clinicId) ?? 'current-clinic';

const invalidateClinicUsersCache = (): void => {
  clinicUsersRequestCache.clear();
  clinicUsersResponseCache.clear();
};

export const GetClinicUsers = async (
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<SettingsUserResponseModel> => {
  const cacheKey = buildClinicUsersCacheKey(clinicId);

  if (forceRefresh) {
    clinicUsersRequestCache.delete(cacheKey);
    clinicUsersResponseCache.delete(cacheKey);
  }

  const cachedResponse = clinicUsersResponseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < CLINIC_USERS_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = clinicUsersRequestCache.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<SettingsUserResponseModel> => {
    try {
      const response = await apiClient.get<SettingsUserResponseModel>(GET_USERS_ENDPOINT, {
        params: {
          ClinicId: resolveClinicId(clinicId) ?? undefined,
        },
      });

      const resolvedResponse =
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          items: [],
          totalCount: 0,
        };

      clinicUsersResponseCache.set(cacheKey, {
        data: resolvedResponse,
        cachedAt: Date.now(),
      });

      return resolvedResponse;
    } finally {
      clinicUsersRequestCache.delete(cacheKey);
    }
  })();

  clinicUsersRequestCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const CreateClinicUser = async (
  request: CreateUserFormValues
): Promise<SettingsUserModel> => {
  try {
    const response = await apiClient.post<SettingsUserModel>(CREATE_USER_ENDPOINT, request);
    const resolvedResponse = SuccessResponse(response, ResponseMethod.Create) as SettingsUserModel;
    invalidateClinicUsersCache();
    return resolvedResponse;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateClinicUser = async (
  request: CreateUserFormValues
): Promise<SettingsUserModel> => {
  try {
    const response = await apiClient.put<SettingsUserModel>(UPDATE_USER_ENDPOINT, request);
    const resolvedResponse = SuccessResponse(response, ResponseMethod.Update) as SettingsUserModel;
    invalidateClinicUsersCache();
    return resolvedResponse;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteClinicUser = async (id: string): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(`${DELETE_USER_ENDPOINT}/${id}`);
    const resolvedResponse = SuccessResponse(response, ResponseMethod.Delete) as string;
    invalidateClinicUsersCache();
    return resolvedResponse;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
