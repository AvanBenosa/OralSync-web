import { GetPatientDentalPhotoItems } from './api';
import { PatientDentalPhotoStateModel } from './types';

export const HandleGetPatientDentalPhotoItems = async (
  state: PatientDentalPhotoStateModel,
  setState: Function,
  patientId?: string
) => {
  const response = await GetPatientDentalPhotoItems(patientId);
  const selectedItem =
    response.find((item) => item.id === state.selectedItem?.id) ||
    response[0] ||
    undefined;

  setState((prev: PatientDentalPhotoStateModel) => ({
    ...prev,
    patientId,
    items: response,
    selectedItem,
    load: false,
    notFound: false,
  }));

  return response;
};
