import { GetAuditLogs } from './api';
import type { AuditLogStateModel } from './types';

export const HandleGetAuditLogs = async (
  state: AuditLogStateModel,
  setState: Function,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetAuditLogs(
    state.search,
    state.dateFrom,
    state.dateTo,
    state.pageStart,
    state.pageEnd,
    forceRefresh
  );

  setState({
    ...state,
    load: false,
    items: response.items || [],
    totalItem: response.totalCount || 0,
    pageStart: response.pageStart ?? state.pageStart,
    pageEnd: response.pageEnd ?? state.pageEnd,
  });
};
