export type SmsGatewayPhoneValidationResult = {
  isValid: boolean;
  errorMessage: string;
};

export type SmsGatewaySendRequest = {
  phoneNumber: string;
  message: string;
};

export type SmsGatewayTestRequest = {
  phoneNumber: string;
};
