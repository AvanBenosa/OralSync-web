export type FinanceOverviewProps = {
  clinicId?: string;
};

export type FinanceViewTab = 'income' | 'expenses';

export type FinanceModuleStateModel<T> = {
  items: T[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
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
