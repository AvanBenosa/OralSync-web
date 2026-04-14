import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import type { SmsGatewaySendRequest, SmsGatewayTestRequest } from './types';

const SEND_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/send';
const TEST_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/test';

export const SendSmsGatewaySms = async (request: SmsGatewaySendRequest): Promise<void> => {
  try {
    await apiClient.post(SEND_ANDROID_SMS_ENDPOINT, {
      phoneNumber: request.phoneNumber,
      message: request.message,
    });
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const SendSmsGatewayTest = async (request: SmsGatewayTestRequest): Promise<void> => {
  try {
    await apiClient.post(TEST_ANDROID_SMS_ENDPOINT, {
      phoneNumber: request.phoneNumber,
    });
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
