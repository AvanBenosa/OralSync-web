import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { EmployeeFormValues, EmployeeModel, EmployeeResponseModel } from './types';

const GET_EMPLOYEES_ENDPOINT = '/api/dmd/employee/get-employee';
const CREATE_EMPLOYEE_ENDPOINT = '/api/dmd/employee/create-employee';
const UPDATE_EMPLOYEE_ENDPOINT = '/api/dmd/employee/put-employee';
const DELETE_EMPLOYEE_ENDPOINT = '/api/dmd/employee/delete-employee';
const UPLOAD_EMPLOYEE_PROFILE_PICTURE_ENDPOINT = '/api/dmd/employee/upload-profile-picture';

export type EmployeeProfilePictureUploadResponse = {
  fileName: string;
  filePath: string;
};

export const GetEmployees = async (clinicId?: string | null): Promise<EmployeeResponseModel> => {
  try {
    const response = await apiClient.get<EmployeeResponseModel>(GET_EMPLOYEES_ENDPOINT, {
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

export const CreateEmployee = async (request: EmployeeFormValues): Promise<EmployeeModel> => {
  try {
    const response = await apiClient.post<EmployeeModel>(CREATE_EMPLOYEE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as EmployeeModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateEmployee = async (request: EmployeeFormValues): Promise<EmployeeModel> => {
  try {
    const response = await apiClient.put<EmployeeModel>(UPDATE_EMPLOYEE_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as EmployeeModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteEmployee = async (id: string): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(DELETE_EMPLOYEE_ENDPOINT, {
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

export const UploadEmployeeProfilePicture = async (
  file: File,
  oldFilePath?: string
): Promise<EmployeeProfilePictureUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (oldFilePath?.trim()) {
      formData.append('oldFilePath', oldFilePath);
    }

    const response = await apiClient.post<EmployeeProfilePictureUploadResponse>(
      UPLOAD_EMPLOYEE_PROFILE_PICTURE_ENDPOINT,
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
