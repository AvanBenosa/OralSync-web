export type AuditLogModel = {
  id?: string;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  actorName?: string;
  actorId?: string;
  occurredAt?: string;
};

export type AuditLogResponseModel = {
  items: AuditLogModel[];
  totalCount: number;
  pageStart: number;
  pageEnd: number;
};

export type AuditLogStateModel = {
  items: AuditLogModel[];
  load: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  pageStart: number;
  pageEnd: number;
  totalItem: number;
};
