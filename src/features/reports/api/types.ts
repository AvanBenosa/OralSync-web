export type ReportsProps = {
  clinicId?: string | null;
};

export type ReportFilter = {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  dentistId?: string;
};

// ── Finance ───────────────────────────────────────────────────────────────

export type RevenueByMonthModel = {
  month: string;
  billed: number;
  collected: number;
};

export type RevenueSummaryModel = {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalDiscount: number;
  byMonth: RevenueByMonthModel[];
};

export type ExpenseByCategoryModel = {
  category: string;
  amount: number;
};

export type ExpenseByMonthModel = {
  month: string;
  amount: number;
};

export type ExpenseBreakdownModel = {
  totalExpenses: number;
  byCategory: ExpenseByCategoryModel[];
  byMonth: ExpenseByMonthModel[];
};

export type OutstandingBalanceItemModel = {
  patientId: string;
  patientNumber: string;
  fullName: string;
  totalBalance: number;
  lastVisit?: string;
};

export type OutstandingBalancesModel = {
  totalOutstanding: number;
  totalPatients: number;
  items: OutstandingBalanceItemModel[];
};

export type ProfitLossByMonthModel = {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
};

export type ProfitLossModel = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  byMonth: ProfitLossByMonthModel[];
};

// ── Patient ───────────────────────────────────────────────────────────────

export type PatientGrowthByMonthModel = {
  month: string;
  newPatients: number;
  cumulative: number;
};

export type PatientGrowthModel = {
  totalPatients: number;
  newThisPeriod: number;
  byMonth: PatientGrowthByMonthModel[];
};

export type DemographicBreakdownItem = {
  label: string;
  count: number;
};

export type PatientDemographicsModel = {
  byGender: DemographicBreakdownItem[];
  byAgeGroup: DemographicBreakdownItem[];
  byTag: DemographicBreakdownItem[];
};

// ── Appointment ───────────────────────────────────────────────────────────

export type AppointmentVolumeByMonthModel = {
  month: string;
  count: number;
};

export type AppointmentVolumeByTypeModel = {
  type: string;
  count: number;
};

export type AppointmentVolumeModel = {
  totalAppointments: number;
  byMonth: AppointmentVolumeByMonthModel[];
  byType: AppointmentVolumeByTypeModel[];
};

export type AppointmentFunnelModel = {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  noShowRate: number;
  cancellationRate: number;
};
