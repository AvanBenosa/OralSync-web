import { isAxiosError } from 'axios';

import {
  ExceptionResponse,
  ResponseMethod,
  SuccessResponse,
} from '../../../../common/api/responses';
import { apiClient } from '../../../../common/services/api-client';
import type { AuditLogResponseModel } from './types';

const GET_AUDIT_LOGS_ENDPOINT = '/api/dmd/clinic/get-audit-logs';
const AUDIT_LOGS_CACHE_TTL_MS = 5000;

const auditLogsRequestCache = new Map<string, Promise<AuditLogResponseModel>>();
const auditLogsResponseCache = new Map<
  string,
  {
    data: AuditLogResponseModel;
    cachedAt: number;
  }
>();

const buildAuditLogsCacheKey = (
  search: string = '',
  dateFrom: string = '',
  dateTo: string = '',
  pageStart: number,
  pageEnd: number
): string =>
  JSON.stringify({
    search: search?.trim() || '',
    dateFrom: dateFrom || '',
    dateTo: dateTo || '',
    pageStart,
    pageEnd,
  });

export const GetAuditLogs = async (
  search: string = '',
  dateFrom: string = '',
  dateTo: string = '',
  pageStart: number,
  pageEnd: number,
  forceRefresh: boolean = false
): Promise<AuditLogResponseModel> => {
  const cacheKey = buildAuditLogsCacheKey(search, dateFrom, dateTo, pageStart, pageEnd);
  const normalizedSearch = search.trim() || undefined;
  const normalizedDateFrom = dateFrom || undefined;
  const normalizedDateTo = dateTo || undefined;

  if (forceRefresh) {
    auditLogsRequestCache.delete(cacheKey);
    auditLogsResponseCache.delete(cacheKey);
  }

  const cachedResponse = auditLogsResponseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.cachedAt < AUDIT_LOGS_CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  const activeRequest = auditLogsRequestCache.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = (async (): Promise<AuditLogResponseModel> => {
    try {
      const response = await apiClient.get<AuditLogResponseModel>(GET_AUDIT_LOGS_ENDPOINT, {
        params: {
          Que: normalizedSearch,
          DateFrom: normalizedDateFrom,
          DateTo: normalizedDateTo,
          PageStart: pageStart,
          PageEnd: pageEnd,
        },
      });

      const resolvedResponse =
        (SuccessResponse(
          response,
          ResponseMethod.Fetch,
          undefined,
          false
        ) as AuditLogResponseModel) || {
          items: [],
          totalCount: 0,
          pageStart,
          pageEnd,
        };

      auditLogsResponseCache.set(cacheKey, {
        data: resolvedResponse,
        cachedAt: Date.now(),
      });

      return resolvedResponse;
    } finally {
      auditLogsRequestCache.delete(cacheKey);
    }
  })();

  auditLogsRequestCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }

    throw error;
  }
};
