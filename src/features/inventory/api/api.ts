import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
  toastSuccess,
} from '../../../common/api/responses';
import { resolveClinicId } from '../../../common/components/ClinicId';
import { apiClient } from '../../../common/services/api-client';
import { InventoryModel, InventoryResponseModel, InventoryStateModel } from './types';

const INVENTORY_ENDPOINT = '/api/dmd/dental-inventories/get-dental-inventories';
const CREATE_INVENTORY_ENDPOINT = '/api/dmd/dental-inventories/create-dental-inventories';
const UPDATE_INVENTORY_ENDPOINT = '/api/dmd/dental-inventories/put-dental-inventories';
const DELETE_INVENTORY_ENDPOINT = '/api/dmd/dental-inventories/delete-dental-inventories';
const inventoryRequestCache = new Map<string, Promise<InventoryResponseModel>>();
const inventoryResponseCache = new Map<
  string,
  {
    data: InventoryResponseModel;
    cachedAt: number;
  }
>();
const INVENTORY_RESPONSE_CACHE_TTL_MS = 5000;

export const GetInventories = async (
  state: InventoryStateModel,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<InventoryResponseModel> => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const query = String(state.search ?? '').trim();
  const pageStart =
    state.pageStart && state.totalItem && state.pageStart === state.totalItem
      ? state.pageStart - state.pageEnd
      : state.pageStart;
  const pageEnd = state.pageEnd;
  const requestKey = JSON.stringify({
    clinicId: resolvedClinicId ?? 'current-clinic',
    query: query || 'all',
    pageStart,
    pageEnd,
  });

  if (forceRefresh) {
    inventoryResponseCache.delete(requestKey);
  }

  const cachedResponse = inventoryResponseCache.get(requestKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < INVENTORY_RESPONSE_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = inventoryRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<InventoryResponseModel> => {
    try {
      const response = await apiClient.get<InventoryResponseModel>(INVENTORY_ENDPOINT, {
        params: {
          ClinicId: resolvedClinicId ?? undefined,
          Que: query || 'all',
          pageStart,
          pageEnd,
        },
      });

      const responseData = (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as
        | InventoryResponseModel
        | undefined) || {
        items: [],
        pageStart: 0,
        pageEnd,
        totalCount: 0,
      };

      inventoryResponseCache.set(requestKey, {
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
      inventoryRequestCache.delete(requestKey);
    }
  })();

  inventoryRequestCache.set(requestKey, request);
  return request;
};

export const CreateInventory = async (request: InventoryModel): Promise<InventoryModel> => {
  try {
    const response = await apiClient.post<InventoryModel>(CREATE_INVENTORY_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create) as InventoryModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const UpdateInventory = async (request: InventoryModel): Promise<InventoryModel> => {
  try {
    const response = await apiClient.put<InventoryModel>(UPDATE_INVENTORY_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Update) as InventoryModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const DeleteInventory = async (request: InventoryModel): Promise<void> => {
  try {
    await apiClient.delete(DELETE_INVENTORY_ENDPOINT, { data: request });
    toastSuccess('Successfully Deleted!');
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};
