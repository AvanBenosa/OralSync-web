import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import { ExceptionResponse, SuccessResponse, ResponseMethod } from '../../../../common/api/responses';

const GET_ANDROID_SMS_GATEWAY_ENDPOINT = '/api/dmd/clinic/android-sms-gateway';
const SAVE_ANDROID_SMS_GATEWAY_ENDPOINT = '/api/dmd/clinic/android-sms-gateway';
const SEND_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/send';
const TEST_ANDROID_SMS_ENDPOINT = '/api/dmd/android-sms/test';

export type AndroidSmsGatewayModel = {
  isEnabled: boolean;
  baseUrl: string;
  sendEndpoint: string;
  apiKey: string | null;
  timeoutMilliseconds: number;
};

export const defaultAndroidSmsGatewayModel = (): AndroidSmsGatewayModel => ({
  isEnabled: false,
  baseUrl: '',
  sendEndpoint: '/message',
  apiKey: null,
  timeoutMilliseconds: 30000,
});

export const GetAndroidSmsGateway = async (): Promise<AndroidSmsGatewayModel> => {
  try {
    const response = await apiClient.get<AndroidSmsGatewayModel>(GET_ANDROID_SMS_GATEWAY_ENDPOINT);
    return (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as AndroidSmsGatewayModel)
      ?? defaultAndroidSmsGatewayModel();
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

export const SaveAndroidSmsGateway = async (
  model: AndroidSmsGatewayModel
): Promise<AndroidSmsGatewayModel> => {
  try {
    const response = await apiClient.put<AndroidSmsGatewayModel>(
      SAVE_ANDROID_SMS_GATEWAY_ENDPOINT,
      model
    );
    return (SuccessResponse(response, ResponseMethod.Update) as AndroidSmsGatewayModel)
      ?? model;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

export const SendAndroidSms = async (
  phoneNumber: string,
  message: string
): Promise<void> => {
  try {
    await apiClient.post(SEND_ANDROID_SMS_ENDPOINT, { phoneNumber, message });
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

export const TestAndroidSmsGateway = async (phoneNumber: string): Promise<void> => {
  try {
    await apiClient.post(TEST_ANDROID_SMS_ENDPOINT, { phoneNumber });
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};
