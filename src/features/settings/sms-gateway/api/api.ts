import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import {
  createDefaultSmsGatewayConfiguration,
  type SmsGatewayConfigurationModel,
  type SmsGatewaySendRequest,
  type SmsGatewayTestRequest,
} from './types';

const GET_SMS_GATEWAY_CONFIGURATION_ENDPOINT = '/api/dmd/clinic/android-sms-gateway';
const SAVE_SMS_GATEWAY_CONFIGURATION_ENDPOINT = '/api/dmd/clinic/android-sms-gateway';
const SEND_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/send';
const TEST_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/test';

export const GetSmsGatewayConfiguration = async (): Promise<SmsGatewayConfigurationModel> => {
  try {
    const response = await apiClient.get<SmsGatewayConfigurationModel>(
      GET_SMS_GATEWAY_CONFIGURATION_ENDPOINT
    );

    return (
      (SuccessResponse(
        response,
        ResponseMethod.Fetch,
        undefined,
        false
      ) as SmsGatewayConfigurationModel) ?? createDefaultSmsGatewayConfiguration()
    );
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const SaveSmsGatewayConfiguration = async (
  request: SmsGatewayConfigurationModel
): Promise<SmsGatewayConfigurationModel> => {
  try {
    const response = await apiClient.put<SmsGatewayConfigurationModel>(
      SAVE_SMS_GATEWAY_CONFIGURATION_ENDPOINT,
      request
    );

    return (
      (SuccessResponse(response, ResponseMethod.Update) as SmsGatewayConfigurationModel) ?? request
    );
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

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
