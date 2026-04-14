import { toastSuccess } from '../../../../common/api/responses';
import { SendSmsGatewaySms, SendSmsGatewayTest } from './api';
import type {
  SmsGatewayPhoneValidationResult,
  SmsGatewaySendRequest,
  SmsGatewayTestRequest,
} from './types';

const PH_MOBILE_PATTERN = /^(09|\+?639)\d{9}$/;

export const ValidateSmsGatewayPhone = (
  value: string
): SmsGatewayPhoneValidationResult => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      isValid: false,
      errorMessage: 'Phone number is required.',
    };
  }

  if (!PH_MOBILE_PATTERN.test(normalizedValue)) {
    return {
      isValid: false,
      errorMessage: 'Enter a valid PH mobile number (e.g. 09171234567).',
    };
  }

  return {
    isValid: true,
    errorMessage: '',
  };
};

export const HandleSendSmsGatewayTest = async (
  request: SmsGatewayTestRequest
): Promise<void> => {
  await SendSmsGatewayTest({
    phoneNumber: request.phoneNumber.trim(),
  });

  toastSuccess('Test SMS sent successfully via Android Gateway.');
};

export const HandleSendSmsGateway = async (
  request: SmsGatewaySendRequest
): Promise<void> => {
  await SendSmsGatewaySms({
    phoneNumber: request.phoneNumber.trim(),
    message: request.message.trim(),
  });

  toastSuccess('SMS sent successfully via Android Gateway.');
};
