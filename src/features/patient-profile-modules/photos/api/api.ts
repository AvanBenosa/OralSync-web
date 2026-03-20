import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import { PatientDentalPhotoModel } from './types';

const DENTAL_PHOTO_ENDPOINT = '/api/dmd/patient-dental-photo/get-patient-dental-photo';

export const GetPatientDentalPhotoItems = async (
  patientId?: string
): Promise<PatientDentalPhotoModel[]> => {
  try {
    const response = await apiClient.get<PatientDentalPhotoModel[]>(DENTAL_PHOTO_ENDPOINT, {
      params: {
        PatientInfoId: patientId,
      },
    });

    return (
      (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as PatientDentalPhotoModel[]) ||
      []
    );
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
