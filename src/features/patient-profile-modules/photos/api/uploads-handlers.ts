import {
  CreatePatientUploadItem,
  DeletePatientUploadItem,
  GetPatientUploadItems,
  UpdatePatientUploadItem,
} from './uploads-api';
import { PatientUploadModel, PatientUploadStateModel } from './types';

export const HandleGetPatientUploadItems = async (
  state: PatientUploadStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
) => {
  const response = await GetPatientUploadItems(patientId, forceRefresh);
  const selectedItem =
    response.find((item) => item.id === state.selectedItem?.id) || response[0] || undefined;

  setState((prev: PatientUploadStateModel) => ({
    ...prev,
    patientId,
    items: response,
    selectedItem,
    load: false,
    notFound: false,
  }));

  return response;
};

export const HandleCreatePatientUploadItem = async (
  request: PatientUploadModel,
  state: PatientUploadStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientUploadItem(request);
  setState((prev: PatientUploadStateModel) => ({
    ...prev,
    openModal: false,
    isUpdate: false,
    isDelete: false,
    selectedItem: response,
    items: [response, ...prev.items.filter((item) => item.id !== response.id)],
  }));
};

export const HandleUpdatePatientUploadItem = async (
  request: Pick<PatientUploadModel, 'id' | 'patientInfoId' | 'remarks'>,
  state: PatientUploadStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientUploadItem(request);
  setState((prev: PatientUploadStateModel) => ({
    ...prev,
    items: prev.items.map((item) => (item.id === response.id ? response : item)),
    selectedItem: response,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
};

export const HandleDeletePatientUploadItem = async (
  request: Pick<PatientUploadModel, 'id' | 'patientInfoId'>,
  state: PatientUploadStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientUploadItem(request);
  setState((prev: PatientUploadStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      selectedItem:
        prev.selectedItem?.id && prev.selectedItem.id === selectedId ? undefined : prev.selectedItem,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};
