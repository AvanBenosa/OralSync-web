export type FinanceOverviewProps = {
  clinicId?: string;
};

export type FinanceViewTab = 'income' | 'expenses';

export type FinanceSummaryModel = {
  amount: number;
  hasDateFilter: boolean;
};

export type FinanceIncomeSummaryModel = FinanceSummaryModel;

export type FinanceModuleStateModel<T> = {
  items: T[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: T;
  clinicId?: string | null;
};

export type FinanceModuleStateProps<T> = {
  state: FinanceModuleStateModel<T>;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};
