import { isAxiosError } from 'axios';
import { CustomSuccessResponse, ExceptionResponse } from '../api/responses';
import { apiClient } from './api-client';

const SEND_CLINIC_FEEDBACK_ENDPOINT = '/api/dmd/clinic/send-feedback';

export type ClinicFeedbackRequestModel = {
  category: string;
  subject: string;
  message: string;
  replyToEmail: string;
};

export type ClinicFeedbackResponseModel = {
  queued: boolean;
  recipientEmail: string;
  replyToEmail: string;
  subject: string;
  queuedAt: string;
};

export const sendClinicFeedback = async (
  request: ClinicFeedbackRequestModel
): Promise<ClinicFeedbackResponseModel> => {
  try {
    const response = await apiClient.post<ClinicFeedbackResponseModel>(
      SEND_CLINIC_FEEDBACK_ENDPOINT,
      request
    );

    return CustomSuccessResponse(response, 'queued feedback email') as ClinicFeedbackResponseModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
