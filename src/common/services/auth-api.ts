import { apiClient } from './api-client';
import type { PortalType } from '../utils/portal';

const LOGIN_ENDPOINT = process.env.REACT_APP_LOGIN_ENDPOINT || '/login';
const REGISTER_ENDPOINT = process.env.REACT_APP_REGISTER_ENDPOINT || '/api/register/create';
const REGISTRATION_STATUS_ENDPOINT =
  process.env.REACT_APP_REGISTRATION_STATUS_ENDPOINT || '/api/register/status';
const REQUEST_REGISTRATION_CODE_ENDPOINT =
  process.env.REACT_APP_REQUEST_REGISTRATION_CODE_ENDPOINT || '/api/register/request-code';
const REGISTER_CLINIC_ENDPOINT =
  process.env.REACT_APP_REGISTER_CLINIC_ENDPOINT || '/api/register/clinic';
const CLINIC_DATA_PRIVACY_STATUS_ENDPOINT =
  process.env.REACT_APP_CLINIC_DATA_PRIVACY_STATUS_ENDPOINT ||
  '/api/dmd/clinic/data-privacy-status';
const ACCEPT_CLINIC_DATA_PRIVACY_ENDPOINT =
  process.env.REACT_APP_ACCEPT_CLINIC_DATA_PRIVACY_ENDPOINT ||
  '/api/dmd/clinic/accept-data-privacy';
const AUTH_RESPONSE_CACHE_TTL_MS = 5000;

export interface LoginPayload {
  username: string;
  email?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  clinicId?: string | null;
  clinicName?: string;
  isDataPrivacyAccepted?: boolean;
  isLocked?: boolean;
  role: string;
  roleLabel: string;
  contactNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  portalType?: PortalType;
}

export interface RegisterPayload {
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  birthDate?: string;
  contactNumber: string;
  address: string;
  suffix: number;
  preffix: number;
  religion: string;
  startDate?: string;
  employmentType: number;
  bio: string;
  role: number;
  clinicName: string;
  clinicAddress: string;
  clinicEmailAddress: string;
  clinicContactNumber: string;
  password: string;
  confirmPassword: string;
}

export interface PublicClinicRegistrationPayload {
  verificationCode: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  birthDate?: string;
  contactNumber: string;
  address: string;
  suffix: number;
  preffix: number;
  religion: string;
  startDate?: string;
  employmentType: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  clinicEmailAddress: string;
  clinicContactNumber: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  requiresRegistration: boolean;
}

export interface RegistrationStatusResponse {
  requiresRegistration: boolean;
}

export interface RequestRegistrationCodePayload {
  email: string;
}

export interface VerificationCodeResponse {
  email: string;
  expiresInMinutes: number;
}

export interface ClinicDataPrivacyStatusResponse {
  clinicId: string;
  clinicName: string;
  isDataPrivacyAccepted: boolean;
  isLocked: boolean;
}

const registrationStatusRequestCache = new Map<string, Promise<RegistrationStatusResponse>>();
const registrationStatusResponseCache = new Map<
  string,
  {
    data: RegistrationStatusResponse;
    cachedAt: number;
  }
>();

const clinicDataPrivacyRequestCache = new Map<string, Promise<ClinicDataPrivacyStatusResponse>>();
const clinicDataPrivacyResponseCache = new Map<
  string,
  {
    data: ClinicDataPrivacyStatusResponse;
    cachedAt: number;
  }
>();

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(LOGIN_ENDPOINT, payload);
  return response.data;
};

export const registerBootstrapUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(REGISTER_ENDPOINT, payload);
  return response.data;
};

export const getRegistrationStatus = async (): Promise<RegistrationStatusResponse> => {
  const requestKey = 'registration-status';
  const cachedResponse = registrationStatusResponseCache.get(requestKey);

  if (cachedResponse && Date.now() - cachedResponse.cachedAt < AUTH_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = registrationStatusRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<RegistrationStatusResponse> => {
    try {
      const response = await apiClient.get<RegistrationStatusResponse>(REGISTRATION_STATUS_ENDPOINT);
      registrationStatusResponseCache.set(requestKey, {
        data: response.data,
        cachedAt: Date.now(),
      });
      return response.data;
    } finally {
      registrationStatusRequestCache.delete(requestKey);
    }
  })();

  registrationStatusRequestCache.set(requestKey, request);
  return request;
};

export const requestClinicRegistrationCode = async (
  payload: RequestRegistrationCodePayload
): Promise<VerificationCodeResponse> => {
  const response = await apiClient.post<VerificationCodeResponse>(
    REQUEST_REGISTRATION_CODE_ENDPOINT,
    payload
  );
  return response.data;
};

export const registerClinic = async (
  payload: PublicClinicRegistrationPayload
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(REGISTER_CLINIC_ENDPOINT, payload);
  return response.data;
};

export const getClinicDataPrivacyStatus = async (): Promise<ClinicDataPrivacyStatusResponse> => {
  const requestKey = 'clinic-data-privacy-status';
  const cachedResponse = clinicDataPrivacyResponseCache.get(requestKey);

  if (cachedResponse && Date.now() - cachedResponse.cachedAt < AUTH_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = clinicDataPrivacyRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<ClinicDataPrivacyStatusResponse> => {
    try {
      const response = await apiClient.get<ClinicDataPrivacyStatusResponse>(
        CLINIC_DATA_PRIVACY_STATUS_ENDPOINT
      );
      clinicDataPrivacyResponseCache.set(requestKey, {
        data: response.data,
        cachedAt: Date.now(),
      });
      return response.data;
    } finally {
      clinicDataPrivacyRequestCache.delete(requestKey);
    }
  })();

  clinicDataPrivacyRequestCache.set(requestKey, request);
  return request;
};

export const acceptClinicDataPrivacy = async (): Promise<ClinicDataPrivacyStatusResponse> => {
  const response = await apiClient.post<ClinicDataPrivacyStatusResponse>(
    ACCEPT_CLINIC_DATA_PRIVACY_ENDPOINT
  );
  clinicDataPrivacyResponseCache.set('clinic-data-privacy-status', {
    data: response.data,
    cachedAt: Date.now(),
  });
  return response.data;
};

export const getAuthEndpoints = () => ({
  login: LOGIN_ENDPOINT,
  register: REGISTER_ENDPOINT,
  registrationStatus: REGISTRATION_STATUS_ENDPOINT,
  requestRegistrationCode: REQUEST_REGISTRATION_CODE_ENDPOINT,
  registerClinic: REGISTER_CLINIC_ENDPOINT,
  //clinicDataPrivacyStatus: CLINIC_DATA_PRIVACY_STATUS_ENDPOINT, // UNCOMMENT THIS
  acceptClinicDataPrivacy: ACCEPT_CLINIC_DATA_PRIVACY_ENDPOINT,
});
