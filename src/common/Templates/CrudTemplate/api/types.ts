// ============================================================
// STEP 1 ▸ Replace every occurrence of the following tokens:
//   MODULE_NAME        → e.g. "Appointment", "Patient", "Invoice"
//   module_name        → lowercase version, e.g. "appointment"
//   MODULE_NOUN        → human label, e.g. "Appointment", "Patient Record"
//   MODULE_ICON        → MUI icon component name to use in the header
// ============================================================

// ─── Props ───────────────────────────────────────────────────────────────────

export type MODULE_NAMEProps = {
  clinicId?: string;
};

// ─── Enums & Option Lists ─────────────────────────────────────────────────────
// Add as many enums as needed. Remove this section entirely if no select fields.

export enum MODULE_NAMEStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  // TODO: add more values
}

export const MODULE_NAME_STATUS_OPTIONS = Object.values(MODULE_NAMEStatus);

export const MODULE_NAME_STATUS_LABELS: Record<MODULE_NAMEStatus, string> = {
  [MODULE_NAMEStatus.Active]: 'Active',
  [MODULE_NAMEStatus.Inactive]: 'Inactive',
  // TODO: match enum above
};

export const getMODULE_NAMEStatusLabel = (status?: MODULE_NAMEStatus | string): string => {
  if (!status) return '--';
  return (
    MODULE_NAME_STATUS_LABELS[status as MODULE_NAMEStatus] ??
    String(status).replace(/([a-z])([A-Z])/g, '$1 $2')
  );
};

// ─── Model ───────────────────────────────────────────────────────────────────

export type MODULE_NAMEModel = {
  id?: string;
  clinicProfileId?: string | null;
  name?: string;
  description?: string;
  status?: MODULE_NAMEStatus;
  isActive?: boolean;
  // TODO: add your domain fields here
};

// ─── Response ────────────────────────────────────────────────────────────────

export type MODULE_NAMEResponseModel = {
  items: MODULE_NAMEModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

// ─── State ───────────────────────────────────────────────────────────────────

export type MODULE_NAMEStateModel = {
  items: MODULE_NAMEModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: MODULE_NAMEModel;
  clinicProfileId?: string | null;
};

// ─── State Props ─────────────────────────────────────────────────────────────

export type MODULE_NAMEStateProps = {
  state: MODULE_NAMEStateModel;
  setState: Function;
  onReload?: () => void;
};
