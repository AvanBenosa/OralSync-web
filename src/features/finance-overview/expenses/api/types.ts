import type {
  FinanceModuleStateModel,
  FinanceSummaryModel,
} from '../../api/types';

export enum ClinicExpenseCategory {
  Utilities = 'Utilities',
  RentAndFacility = 'RentAndFacility',
  Salaries = 'Salaries',
  DentalSupplies = 'DentalSupplies',
  Equipment = 'Equipment',
  Medications = 'Medications',
  Marketing = 'Marketing',
  Software = 'Software',
  OfficeSupplies = 'OfficeSupplies',
  Taxes = 'Taxes',
  Financial = 'Financial',
  Miscellaneous = 'Miscellaneous',
}

export const CLINIC_EXPENSE_CATEGORY_OPTIONS = Object.values(ClinicExpenseCategory);

export const CLINIC_EXPENSE_CATEGORY_LABELS: Record<ClinicExpenseCategory, string> = {
  [ClinicExpenseCategory.Utilities]: 'Utilities',
  [ClinicExpenseCategory.RentAndFacility]: 'Rent and Facility',
  [ClinicExpenseCategory.Salaries]: 'Salaries',
  [ClinicExpenseCategory.DentalSupplies]: 'Dental Supplies',
  [ClinicExpenseCategory.Equipment]: 'Equipment',
  [ClinicExpenseCategory.Medications]: 'Medications',
  [ClinicExpenseCategory.Marketing]: 'Marketing',
  [ClinicExpenseCategory.Software]: 'Software',
  [ClinicExpenseCategory.OfficeSupplies]: 'Office Supplies',
  [ClinicExpenseCategory.Taxes]: 'Taxes',
  [ClinicExpenseCategory.Financial]: 'Financial',
  [ClinicExpenseCategory.Miscellaneous]: 'Miscellaneous',
};

export type FinanceExpenseModel = {
  id?: string;
  clinicProfileId?: string;
  remarks?: string;
  category?: ClinicExpenseCategory;
  date?: string | Date;
  amount?: number;
};

export type FinanceExpenseResponseModel = {
  items: FinanceExpenseModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
} & FinanceSummaryModel;

export type FinanceExpenseStateModel = FinanceModuleStateModel<FinanceExpenseModel> &
  FinanceSummaryModel;

export type FinanceExpenseStateProps = {
  state: FinanceExpenseStateModel;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};

export const getClinicExpenseCategoryLabel = (
  category?: ClinicExpenseCategory | string
): string => {
  if (!category) {
    return '--';
  }

  return (
    CLINIC_EXPENSE_CATEGORY_LABELS[category as ClinicExpenseCategory] ??
    String(category).replace(/([a-z])([A-Z])/g, '$1 $2')
  );
};
