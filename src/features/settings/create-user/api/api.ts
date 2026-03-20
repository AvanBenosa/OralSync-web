import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { CreateUserFormValues, SettingsUserModel, SettingsUserResponseModel } from './types';

const GET_USERS_ENDPOINT = '/api/dmd/user-profile/get-user-profiles';
const CREATE_USER_ENDPOINT = '/api/dmd/user-profile/create-user-profile';
const UPDATE_USER_ENDPOINT = '/api/dmd/user-profile/put-user-profile';
const DELETE_USER_ENDPOINT = '/api/dmd/user-profile/delete-user-profile';

export const GetClinicUsers = async (
  clinicId?: string | null
): Promise<SettingsUserResponseModel> => {
  try {
    const response = await apiClient.get<SettingsUserResponseModel>(GET_USERS_ENDPOINT, {
      params: {
        ClinicId: clinicId?.trim() || undefined,
      },
    });

    return (
      SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
        items: [],
        totalCount: 0,
      }
    );
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
    return SuccessResponse(response, ResponseMethod.Create) as SettingsUserModel;
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
    return SuccessResponse(response, ResponseMethod.Update) as SettingsUserModel;
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
    return SuccessResponse(response, ResponseMethod.Delete) as string;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
