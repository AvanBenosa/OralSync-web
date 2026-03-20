import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { TemplateFormFormValues, TemplateFormModel, TemplateFormResponseModel } from './types';

const GET_TEMPLATE_FORMS_ENDPOINT = '/api/dmd/template-form/get-template-form';
const CREATE_TEMPLATE_FORM_ENDPOINT = '/api/dmd/template-form/create-template-form';
const UPDATE_TEMPLATE_FORM_ENDPOINT = '/api/dmd/template-form/put-template-form';
const DELETE_TEMPLATE_FORM_ENDPOINT = '/api/dmd/template-form/delete-template-form';

export const GetTemplateForms = async (
  clinicId?: string | null
): Promise<TemplateFormResponseModel> => {
  try {
    const response = await apiClient.get<TemplateFormResponseModel>(GET_TEMPLATE_FORMS_ENDPOINT, {
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

export const CreateTemplateForm = async (
  request: TemplateFormFormValues
): Promise<TemplateFormModel> => {
  try {
    const response = await apiClient.post<TemplateFormModel>(
      CREATE_TEMPLATE_FORM_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create) as TemplateFormModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateTemplateForm = async (
  request: TemplateFormFormValues
): Promise<TemplateFormModel> => {
  try {
    const response = await apiClient.put<TemplateFormModel>(UPDATE_TEMPLATE_FORM_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as TemplateFormModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteTemplateForm = async (id: string): Promise<string> => {
  try {
    const response = await apiClient.delete<string>(DELETE_TEMPLATE_FORM_ENDPOINT, {
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
