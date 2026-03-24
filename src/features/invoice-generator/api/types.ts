import type { Dispatch, SetStateAction } from 'react';

export type InvoiceGeneratorProps = {
  clinicId?: string;
};

export type InvoiceGeneratorModel = {
  id?: string;
  patientInfoId?: string;
  patientName?: string;
  patientNumber?: string;
  date?: string | Date;
  procedure?: string;
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
};

export type InvoiceGeneratorSummaryModel = {
  totalAmount: number;
  amountPaid: number;
  balance: number;
};

export type InvoiceGeneratorStateModel = {
  items: InvoiceGeneratorModel[];
  load: boolean;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  clinicId?: string | null;
  selectedPatientId?: string;
  selectedPatientName?: string;
  filterDate?: string;
  openModal: boolean;
};

export type InvoiceGeneratorStateProps = {
  state: InvoiceGeneratorStateModel;
  setState: Dispatch<SetStateAction<InvoiceGeneratorStateModel>>;
  clinicId?: string | null;
  onReload?: () => void;
};

export type InvoiceGeneratorHeaderProps = InvoiceGeneratorStateProps & {
  onOpenPreview: () => void;
  canPreview: boolean;
};

export type InvoiceGeneratorFormProps = InvoiceGeneratorStateProps & {
  summary: InvoiceGeneratorSummaryModel;
};

export type InvoiceGeneratorTableProps = {
  state: InvoiceGeneratorStateModel;
  items: InvoiceGeneratorModel[];
  hasReadyFilters: boolean;
};

export type InvoiceGeneratorModalProps = {
  open: boolean;
  onClose: () => void;
  clinicId?: string | null;
  patientName?: string;
  patientNumber?: string;
  filterDate?: string;
  items: InvoiceGeneratorModel[];
  summary: InvoiceGeneratorSummaryModel;
};
