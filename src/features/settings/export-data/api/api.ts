import { isAxiosError } from 'axios';
import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import type { ExportDatasetModel } from './types';

const GET_EXPORT_DATASETS_ENDPOINT = '/api/dmd/export-data/get-export-datasets';
const DOWNLOAD_EXPORT_CSV_ENDPOINT = '/api/dmd/export-data/download-csv';

export const getExportDatasets = async (): Promise<ExportDatasetModel[]> => {
  try {
    const response = await apiClient.get<ExportDatasetModel[]>(GET_EXPORT_DATASETS_ENDPOINT);
    return (
      (SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as ExportDatasetModel[]) ||
      []
    );
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};

export const downloadExportDatasetCsv = async (key: string, fileName?: string): Promise<void> => {
  try {
    const response = await apiClient.get<Blob>(DOWNLOAD_EXPORT_CSV_ENDPOINT, {
      params: {
        Key: key,
      },
      responseType: 'blob',
    });

    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName?.trim() || 'export-data.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};
