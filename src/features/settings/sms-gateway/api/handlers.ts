import type { SmsGatewayPhoneValidationResult } from './types';

const PH_MOBILE_PATTERN = /^(09|\+?639)\d{9}$/;

export const ValidateSmsGatewayPhone = (value: string): SmsGatewayPhoneValidationResult => {
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
