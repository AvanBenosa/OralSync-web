export type DashboardProps = {
  clinicId?: string | null;
};

export type DashboardPatientItemModel = {
  id?: string;
  patientNumber?: string;
  fullName?: string;
  latestActivity?: string;
};

export type DashboardAppointmentModel = {
  time: string;
  fullName: string;
  reason: string;
  highlight?: boolean;
};

export type MonthlyIncomeModel = {
  month?: string;
  income?: number;
  expenses?: number;
};

export type MonthlyRevenue = {
  treatment?: string;
  totalAmount?: number;
};

export type DashboardResponseModel = Omit<DashboardStateModel, 'load'>;

export type DashboardStateModel = {
  load: boolean;
  totalPatients: number;
  patientsToday: number;
  scheduledAppointments: number;
  pendingAppointments: number;
  incomeToday: number;
  totalIncomeMonthly: number;
  totalExpenseMonthly: number;
  latestPatients: DashboardPatientItemModel[];
  addPatients: boolean;
  addAppointment: boolean;
  monthlyIncome?: MonthlyIncomeModel[];
  monthlyRevenue?: MonthlyRevenue[];
  nextDayAppointment: DashboardAppointmentModel[];
  todayAppointment: DashboardAppointmentModel[];
  clinicId: string | null;
};

export type DashboardStateprops = {
  state?: DashboardStateModel;
  setState?: Function;
  onReload?: () => void;
};
