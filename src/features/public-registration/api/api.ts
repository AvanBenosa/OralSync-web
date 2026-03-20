import { apiClient, getApiBaseUrl } from '../../../common/services/api-client';
import {
  PublicClinicRegistrationContextModel,
  PublicEmailVerificationCodePayload,
  PublicEmailVerificationCodeResponse,
  PublicEmailVerificationStatusPayload,
  PublicEmailVerificationStatusResponse,
  PublicExistingPatientLookupPayload,
  PublicExistingPatientLookupResponse,
  PublicPatientAppointmentRegistrationPayload,
  PublicPatientAppointmentRegistrationResponse,
} from './types';

const GET_PUBLIC_CLINIC_CONTEXT_ENDPOINT = '/api/public/registration/clinic';
const FIND_PUBLIC_EXISTING_PATIENT_ENDPOINT = '/api/public/registration/existing-patient';
const REQUEST_PUBLIC_EMAIL_VERIFICATION_CODE_ENDPOINT =
  '/api/public/registration/request-email-verification-code';
const VERIFY_PUBLIC_EMAIL_VERIFICATION_CODE_ENDPOINT =
  '/api/public/registration/verify-email-verification-code';
const CREATE_PUBLIC_PATIENT_APPOINTMENT_ENDPOINT =
  '/api/public/registration/create-patient-appointment';

const toDateOnlyValue = (value?: string): string | undefined => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue.split('T')[0];
};

export const getPublicClinicRegistrationContext = async (
  clinicId: string
): Promise<PublicClinicRegistrationContextModel> => {
  const response = await apiClient.get<PublicClinicRegistrationContextModel>(
    GET_PUBLIC_CLINIC_CONTEXT_ENDPOINT,
    {
      params: {
        ClinicId: clinicId.trim(),
      },
    }
  );

  return response.data;
};

export const findExistingPublicPatient = async (
  payload: PublicExistingPatientLookupPayload
): Promise<PublicExistingPatientLookupResponse> => {
  const response = await apiClient.get<PublicExistingPatientLookupResponse>(
    FIND_PUBLIC_EXISTING_PATIENT_ENDPOINT,
    {
      params: {
        ClinicId: payload.clinicId.trim(),
        FirstName: payload.firstName.trim(),
        LastName: payload.lastName.trim(),
        EmailAddress: payload.emailAddress.trim(),
      },
    }
  );

  return response.data;
};

export const createPublicPatientAppointment = async (
  payload: PublicPatientAppointmentRegistrationPayload
): Promise<PublicPatientAppointmentRegistrationResponse> => {
  const response = await apiClient.post<PublicPatientAppointmentRegistrationResponse>(
    CREATE_PUBLIC_PATIENT_APPOINTMENT_ENDPOINT,
    {
      ...payload,
      birthDate: toDateOnlyValue(payload.birthDate),
    }
  );

  return response.data;
};

export const requestPublicEmailVerificationCode = async (
  payload: PublicEmailVerificationCodePayload
): Promise<PublicEmailVerificationCodeResponse> => {
  const response = await apiClient.post<PublicEmailVerificationCodeResponse>(
    REQUEST_PUBLIC_EMAIL_VERIFICATION_CODE_ENDPOINT,
    {
      clinicId: payload.clinicId.trim(),
      emailAddress: payload.emailAddress.trim(),
    }
  );

  return response.data;
};

export const verifyPublicEmailVerificationCode = async (
  payload: PublicEmailVerificationStatusPayload
): Promise<PublicEmailVerificationStatusResponse> => {
  const response = await apiClient.post<PublicEmailVerificationStatusResponse>(
    VERIFY_PUBLIC_EMAIL_VERIFICATION_CODE_ENDPOINT,
    {
      clinicId: payload.clinicId.trim(),
      emailAddress: payload.emailAddress.trim(),
      verificationCode: payload.verificationCode.trim(),
    }
  );

  return response.data;
};

export const resolvePublicClinicBannerSrc = (bannerImagePath?: string): string => {
  if (!bannerImagePath?.trim()) {
    return '';
  }

  if (
    bannerImagePath.startsWith('http://') ||
    bannerImagePath.startsWith('https://') ||
    bannerImagePath.startsWith('blob:') ||
    bannerImagePath.startsWith('data:')
  ) {
    return bannerImagePath;
  }

  if (bannerImagePath.startsWith('/')) {
    return `${getApiBaseUrl()}${bannerImagePath}`;
  }

  return `${getApiBaseUrl()}/uploads/clinics/${bannerImagePath}`;
};
