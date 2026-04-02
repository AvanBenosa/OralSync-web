import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { LabProviderFormValues, LabProviderModel, LabProviderResponseModel } from './types';

const GET_LAB_PROVIDERS_ENDPOINT = '/api/dmd/lab-provider/get-lab-provider';
const CREATE_LAB_PROVIDER_ENDPOINT = '/api/dmd/lab-provider/create-lab-provider';
const UPDATE_LAB_PROVIDER_ENDPOINT = '/api/dmd/lab-provider/put-lab-provider';
const DELETE_LAB_PROVIDER_ENDPOINT = '/api/dmd/lab-provider/delete-lab-provider';

export const GetLabProviders = async (
  clinicId?: string | null
): Promise<LabProviderResponseModel> => {
  try {
    const response = await apiClient.get<LabProviderResponseModel>(GET_LAB_PROVIDERS_ENDPOINT, {
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

export const CreateLabProvider = async (
  request: LabProviderFormValues
): Promise<LabProviderModel> => {
  try {
    const response = await apiClient.post<LabProviderModel>(CREATE_LAB_PROVIDER_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as LabProviderModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateLabProvider = async (
  request: LabProviderFormValues
): Promise<LabProviderModel> => {
  try {
    const response = await apiClient.put<LabProviderModel>(UPDATE_LAB_PROVIDER_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as LabProviderModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteLabProvider = async (id: string): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(DELETE_LAB_PROVIDER_ENDPOINT, {
      data: {
        id,
      },
    });
    return SuccessResponse(response, ResponseMethod.Delete) as string;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
