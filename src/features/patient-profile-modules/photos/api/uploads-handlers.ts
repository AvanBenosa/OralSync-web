import {
  CreatePatientUploadItem,
  DeletePatientUploadItem,
  GetPatientUploadItems,
  UpdatePatientUploadItem,
} from './uploads-api';
import { PatientUploadModel, PatientUploadStateModel } from './types';

const getUploadSelectionId = (item: PatientUploadModel, index: number): string =>
  item.id || item.filePath || item.fileName || `upload-${index}`;

export const HandleGetPatientUploadItems = async (
  state: PatientUploadStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
) => {
  const response = await GetPatientUploadItems(patientId, forceRefresh);
  const selectedItem =
    response.find((item) => item.id === state.selectedItem?.id) || response[0] || undefined;
  const nextSelectedUploadIds = state.selectedUploadIds.filter((selectedId) =>
    response.some((item, index) => getUploadSelectionId(item, index) === selectedId)
  );

  setState((prev: PatientUploadStateModel) => ({
    ...prev,
    patientId,
    items: response,
    selectedItem,
    selectedUploadIds: nextSelectedUploadIds,
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
    selectedUploadIds: prev.selectedUploadIds.filter(
      (itemId) => itemId !== getUploadSelectionId(response, 0)
    ),
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
    selectedUploadIds: prev.selectedUploadIds,
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
    const selectedUpload = prev.items.find((item) => item.id === request.id) || prev.selectedItem;
    const selectedId = selectedUpload
      ? getUploadSelectionId(selectedUpload, prev.items.findIndex((item) => item.id === selectedUpload.id))
      : request.id;

    return {
      ...prev,
      items: prev.items.filter(
        (item, index) =>
          selectedId === undefined || getUploadSelectionId(item, index) !== selectedId
      ),
      selectedUploadIds: prev.selectedUploadIds.filter((itemId) => itemId !== selectedId),
      selectedItem:
        prev.selectedItem && getUploadSelectionId(prev.selectedItem, 0) === selectedId
          ? undefined
          : prev.selectedItem,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

export const HandleDeletePatientUploadItems = async (
  requests: Array<Pick<PatientUploadModel, 'id' | 'patientInfoId'>>,
  state: PatientUploadStateModel,
  setState: Function
): Promise<void> => {
  for (const request of requests) {
    if (!request.id || !request.patientInfoId) {
      continue;
    }

    await DeletePatientUploadItem(request);
  }

  const deletedIds = new Set(
    requests
      .map((request) => {
        const matchedItem = state.items.find((item) => item.id === request.id);
        return matchedItem ? getUploadSelectionId(matchedItem, state.items.indexOf(matchedItem)) : request.id;
      })
      .filter(Boolean)
  );

  setState((prev: PatientUploadStateModel) => ({
    ...prev,
    items: prev.items.filter((item, index) => !deletedIds.has(getUploadSelectionId(item, index))),
    selectedUploadIds: [],
    selectedItem:
      prev.selectedItem && deletedIds.has(getUploadSelectionId(prev.selectedItem, 0))
        ? undefined
        : prev.selectedItem,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
};
