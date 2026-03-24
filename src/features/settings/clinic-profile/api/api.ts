import { isAxiosError } from 'axios';
import { apiClient } from '../../../../common/services/api-client';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { ClinicProfileModel } from './types';

const GET_CURRENT_CLINIC_PROFILE_ENDPOINT = '/api/dmd/clinic/get-current-clinic-profile';
const UPDATE_CLINIC_PROFILE_ENDPOINT = '/api/dmd/clinic/put-clinic-profile';
const UPLOAD_CLINIC_BANNER_ENDPOINT = '/api/dmd/clinic/upload-banner';
const clinicProfileRequestCache = new Map<string, Promise<ClinicProfileModel>>();
const clinicProfileResponseCache = new Map<
  string,
  {
    data: ClinicProfileModel;
    cachedAt: number;
  }
>();
const CLINIC_PROFILE_RESPONSE_CACHE_TTL_MS = 5000;

const toWorkingDays = (item?: Partial<ClinicProfileModel> | null): string[] => {
  const workingDays: string[] = [];

  if (item?.isMondayOpen) workingDays.push('Monday');
  if (item?.isTuesdayOpen) workingDays.push('Tuesday');
  if (item?.isWednesdayOpen) workingDays.push('Wednesday');
  if (item?.isThursdayOpen) workingDays.push('Thursday');
  if (item?.isFridayOpen) workingDays.push('Friday');
  if (item?.isSaturdayOpen) workingDays.push('Saturday');
  if (item?.isSundayOpen) workingDays.push('Sunday');

  return workingDays;
};

const normalizeClinicProfileModel = (item?: ClinicProfileModel | null): ClinicProfileModel => {
  const fallbackWorkingDays = item?.workingDays?.length
    ? item.workingDays
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const normalizedItem: ClinicProfileModel = {
    id: item?.id || '',
    clinicName: item?.clinicName || '',
    bannerImagePath: item?.bannerImagePath || '',
    qrCodeValue: item?.qrCodeValue || '',
    address: item?.address || '',
    emailAddress: item?.emailAddress || '',
    contactNumber: item?.contactNumber || '',
    isDataPrivacyAccepted: Boolean(item?.isDataPrivacyAccepted),
    isContractPolicyAccepted: Boolean(item?.isContractPolicyAccepted),
    forBetaTestingAccepted: Boolean(item?.forBetaTestingAccepted),
    openingTime: item?.openingTime || '09:00',
    closingTime: item?.closingTime || '18:00',
    lunchStartTime: item?.lunchStartTime || '12:00',
    lunchEndTime: item?.lunchEndTime || '13:00',
    isMondayOpen: item?.isMondayOpen ?? fallbackWorkingDays.includes('Monday'),
    isTuesdayOpen: item?.isTuesdayOpen ?? fallbackWorkingDays.includes('Tuesday'),
    isWednesdayOpen: item?.isWednesdayOpen ?? fallbackWorkingDays.includes('Wednesday'),
    isThursdayOpen: item?.isThursdayOpen ?? fallbackWorkingDays.includes('Thursday'),
    isFridayOpen: item?.isFridayOpen ?? fallbackWorkingDays.includes('Friday'),
    isSaturdayOpen: item?.isSaturdayOpen ?? fallbackWorkingDays.includes('Saturday'),
    isSundayOpen: item?.isSundayOpen ?? fallbackWorkingDays.includes('Sunday'),
    subscriptionType: item?.subscriptionType || '',
    validityDate: item?.validityDate || '',
    patientCount: Math.max(Number(item?.patientCount ?? 0) || 0, 0),
    uploadedFileCount: Math.max(Number(item?.uploadedFileCount ?? 0) || 0, 0),
    userCount: Math.max(Number(item?.userCount ?? 0) || 0, 0),
  };

  normalizedItem.workingDays = toWorkingDays(normalizedItem);

  return normalizedItem;
};

export type ClinicBannerUploadResponse = {
  fileName: string;
  filePath: string;
};

export const GetCurrentClinicProfile = async (
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<ClinicProfileModel> => {
  const requestKey = clinicId?.trim() || 'current-clinic';

  if (forceRefresh) {
    clinicProfileResponseCache.delete(requestKey);
  }

  const cachedResponse = clinicProfileResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < CLINIC_PROFILE_RESPONSE_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = clinicProfileRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<ClinicProfileModel> => {
    try {
      const response = await apiClient.get<ClinicProfileModel>(
        GET_CURRENT_CLINIC_PROFILE_ENDPOINT,
        {
          params: {
            ClinicId: clinicId?.trim() || undefined,
          },
        }
      );

      const responseData = normalizeClinicProfileModel(
        SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || {
          id: '',
          clinicName: '',
          bannerImagePath: '',
          qrCodeValue: clinicId?.trim() || '',
          address: '',
          emailAddress: '',
          contactNumber: '',
          isDataPrivacyAccepted: false,
          isContractPolicyAccepted: false,
          forBetaTestingAccepted: false,
          openingTime: '09:00',
          closingTime: '18:00',
          lunchStartTime: '12:00',
          lunchEndTime: '13:00',
          isMondayOpen: true,
          isTuesdayOpen: true,
          isWednesdayOpen: true,
          isThursdayOpen: true,
          isFridayOpen: true,
          isSaturdayOpen: false,
          isSundayOpen: false,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          subscriptionType: '',
          validityDate: '',
          patientCount: 0,
          uploadedFileCount: 0,
          userCount: 0,
        }
      );

      clinicProfileResponseCache.set(requestKey, {
        data: responseData,
        cachedAt: Date.now(),
      });

      return responseData;
    } catch (error) {
      if (isAxiosError(error)) {
        await ExceptionResponse(error);
      }
      throw error;
    } finally {
      clinicProfileRequestCache.delete(requestKey);
    }
  })();

  clinicProfileRequestCache.set(requestKey, request);
  return request;
};

export const UpdateClinicProfile = async (
  request: ClinicProfileModel
): Promise<ClinicProfileModel> => {
  try {
    const normalizedRequest = normalizeClinicProfileModel(request);
    const response = await apiClient.put<ClinicProfileModel>(UPDATE_CLINIC_PROFILE_ENDPOINT, {
      ...normalizedRequest,
      workingDays: toWorkingDays(normalizedRequest),
    });
    return normalizeClinicProfileModel(
      SuccessResponse(response, ResponseMethod.Update) as ClinicProfileModel
    );
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UploadClinicBanner = async (
  file: File,
  oldFilePath?: string
): Promise<ClinicBannerUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (oldFilePath?.trim()) {
      formData.append('oldFilePath', oldFilePath);
    }

    const response = await apiClient.post<ClinicBannerUploadResponse>(
      UPLOAD_CLINIC_BANNER_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
