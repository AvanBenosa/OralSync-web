import { GetDashboard } from './api';
import { DashboardStateModel } from './types';

export const HandleGetDashboard = async (
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetDashboard(clinicId, forceRefresh);

  setState((prev: DashboardStateModel) => ({
    ...prev,
    load: false,
    totalPatients: response.totalPatients ?? 0,
    patientsToday: response.patientsToday ?? 0,
    scheduledAppointments: response.scheduledAppointments ?? 0,
    pendingAppointments: response.pendingAppointments ?? 0,
    incomeToday: response.incomeToday ?? 0,
    totalIncomeMonthly: response.totalIncomeMonthly ?? 0,
    totalExpenseMonthly: response.totalExpenseMonthly ?? 0,
    latestPatients: response.latestPatients ?? [],
    addPatients: response.addPatients ?? false,
    addAppointment: response.addAppointment ?? false,
    monthlyIncome: response.monthlyIncome ?? [],
    monthlyRevenue: response.monthlyRevenue ?? [],
    nextDayAppointment: response.nextDayAppointment ?? [],
    todayAppointment: response.todayAppointment ?? [],
  }));
};
