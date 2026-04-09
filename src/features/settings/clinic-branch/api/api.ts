import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import {
  ClinicBranchBannerUploadResponse,
  ClinicBranchFormValues,
  ClinicBranchModel,
  ClinicBranchResponseModel,
} from './types';

const GET_CLINIC_BRANCHES_ENDPOINT = '/api/dmd/clinic-branch/get-clinic-branches';
const CREATE_CLINIC_BRANCH_ENDPOINT = '/api/dmd/clinic-branch/create-clinic-branch';
const UPDATE_CLINIC_BRANCH_ENDPOINT = '/api/dmd/clinic-branch/put-clinic-branch';
const DELETE_CLINIC_BRANCH_ENDPOINT = '/api/dmd/clinic-branch/delete-clinic-branch';
const UPLOAD_CLINIC_BRANCH_BANNER_ENDPOINT = '/api/dmd/clinic-branch/upload-banner';

export const GetClinicBranches = async (
  clinicId?: string | null
): Promise<ClinicBranchResponseModel> => {
  try {
    const response = await apiClient.get<ClinicBranchResponseModel>(GET_CLINIC_BRANCHES_ENDPOINT, {
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

export const CreateClinicBranch = async (
  request: ClinicBranchFormValues
): Promise<ClinicBranchModel> => {
  try {
    const response = await apiClient.post<ClinicBranchModel>(CREATE_CLINIC_BRANCH_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as ClinicBranchModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateClinicBranch = async (
  request: ClinicBranchFormValues
): Promise<ClinicBranchModel> => {
  try {
    const response = await apiClient.put<ClinicBranchModel>(UPDATE_CLINIC_BRANCH_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as ClinicBranchModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteClinicBranch = async (id: string): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(DELETE_CLINIC_BRANCH_ENDPOINT, {
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

export const UploadClinicBranchBanner = async (
  file: File,
  oldFilePath?: string
): Promise<ClinicBranchBannerUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (oldFilePath?.trim()) {
      formData.append('oldFilePath', oldFilePath);
    }

    const response = await apiClient.post<ClinicBranchBannerUploadResponse>(
      UPLOAD_CLINIC_BRANCH_BANNER_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
