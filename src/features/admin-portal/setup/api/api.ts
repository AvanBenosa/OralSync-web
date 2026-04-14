import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import { ExceptionResponse } from '../../../../common/api/responses';
import type { SetupModel, UpdateSetupRequest } from './types';

const ADMIN_GET_SETUP_ENDPOINT = '/api/dmd/admin/get-setup';
const ADMIN_UPDATE_SETUP_ENDPOINT = '/api/dmd/admin/update-setup';

export const getSetup = async (): Promise<SetupModel> => {
  try {
    const response = await apiClient.get<SetupModel>(ADMIN_GET_SETUP_ENDPOINT);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const updateSetup = async (request: UpdateSetupRequest): Promise<SetupModel> => {
  try {
    const response = await apiClient.put<SetupModel>(ADMIN_UPDATE_SETUP_ENDPOINT, request);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
