export type SmsGatewayPhoneValidationResult = {
  isValid: boolean;
  errorMessage: string;
};

export type SmsGatewayConfigurationModel = {
  isEnabled: boolean;
  baseUrl: string;
  sendEndpoint: string;
  apiKey: string | null;
  timeoutMilliseconds: number;
};

export type SmsGatewaySendRequest = {
  phoneNumber: string;
  message: string;
};

export type SmsGatewayTestRequest = {
  phoneNumber: string;
};

export const createDefaultSmsGatewayConfiguration = (): SmsGatewayConfigurationModel => ({
  isEnabled: false,
  baseUrl: '',
  sendEndpoint: '/message',
  apiKey: null,
  timeoutMilliseconds: 30000,
});
