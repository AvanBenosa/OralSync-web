import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../common/api/responses';
import { resolveClinicId } from '../../../common/components/ClinicId';
import { apiClient } from '../../../common/services/api-client';
import type { InvoiceGeneratorModel } from './types';

const INVOICE_GENERATOR_ENDPOINT = '/api/dmd/invoice-generator/get-invoice-generator';
const INVOICE_GENERATOR_CACHE_TTL_MS = 5000;

const invoiceGeneratorRequestCache = new Map<string, Promise<InvoiceGeneratorModel[]>>();
const invoiceGeneratorResponseCache = new Map<
  string,
  {
    data: InvoiceGeneratorModel[];
    cachedAt: number;
  }
>();

type InvoiceGeneratorQuery = {
  clinicId?: string | null;
  patientInfoId?: string;
  date?: string;
};

const normalizeQueryValue = (value?: string | null): string => value?.trim() ?? '';

const buildInvoiceGeneratorRequestKey = (query?: InvoiceGeneratorQuery): string => {
  const clinicId = normalizeQueryValue(query?.clinicId);
  const patientInfoId = normalizeQueryValue(query?.patientInfoId);
  const date = normalizeQueryValue(query?.date);

  return [
    `clinic:${clinicId || 'current'}`,
    `patient:${patientInfoId || 'none'}`,
    `date:${date || 'none'}`,
  ].join('|');
};

export const GetInvoiceGeneratorItems = async (
  query?: InvoiceGeneratorQuery,
  forceRefresh: boolean = false
): Promise<InvoiceGeneratorModel[]> => {
  const clinicId = resolveClinicId(query?.clinicId);
  const patientInfoId = normalizeQueryValue(query?.patientInfoId);
  const date = normalizeQueryValue(query?.date);
  const requestKey = buildInvoiceGeneratorRequestKey({
    clinicId,
    patientInfoId,
    date,
  });

  if (!clinicId || !patientInfoId || !date) {
    return [];
  }

  if (forceRefresh) {
    invoiceGeneratorResponseCache.delete(requestKey);
  }

  const cachedResponse = invoiceGeneratorResponseCache.get(requestKey);
  if (
    cachedResponse &&
    Date.now() - cachedResponse.cachedAt < INVOICE_GENERATOR_CACHE_TTL_MS
  ) {
    return cachedResponse.data;
  }

  const activeRequest = invoiceGeneratorRequestCache.get(requestKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<InvoiceGeneratorModel[]> => {
    try {
      const response = await apiClient.get<InvoiceGeneratorModel[]>(INVOICE_GENERATOR_ENDPOINT, {
        params: {
          ClinicId: clinicId || undefined,
          PatientInfoId: patientInfoId || undefined,
          Date: date || undefined,
        },
      });

      const responseData = SuccessResponse(response, ResponseMethod.Fetch, undefined, false) || [];
      invoiceGeneratorResponseCache.set(requestKey, {
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
      invoiceGeneratorRequestCache.delete(requestKey);
    }
  })();

  invoiceGeneratorRequestCache.set(requestKey, request);
  return request;
};
