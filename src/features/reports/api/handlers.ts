import {
  GetAppointmentFunnel,
  GetAppointmentVolume,
  GetExpenseBreakdown,
  GetOutstandingBalances,
  GetPatientDemographics,
  GetPatientGrowth,
  GetProfitLoss,
  GetRevenueSummary,
} from './api';
import type {
  AppointmentFunnelModel,
  AppointmentVolumeModel,
  ExpenseBreakdownModel,
  OutstandingBalancesModel,
  PatientDemographicsModel,
  PatientGrowthModel,
  ProfitLossModel,
  ReportFilter,
  RevenueSummaryModel,
} from './types';

export const HandleGetRevenueSummary = async (
  setData: (data: RevenueSummaryModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetRevenueSummary(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetExpenseBreakdown = async (
  setData: (data: ExpenseBreakdownModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetExpenseBreakdown(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetOutstandingBalances = async (
  setData: (data: OutstandingBalancesModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetOutstandingBalances(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetProfitLoss = async (
  setData: (data: ProfitLossModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetProfitLoss(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetPatientGrowth = async (
  setData: (data: PatientGrowthModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetPatientGrowth(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetPatientDemographics = async (
  setData: (data: PatientDemographicsModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetPatientDemographics(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetAppointmentVolume = async (
  setData: (data: AppointmentVolumeModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetAppointmentVolume(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};

export const HandleGetAppointmentFunnel = async (
  setData: (data: AppointmentFunnelModel | null) => void,
  setLoading: (v: boolean) => void,
  clinicId?: string | null,
  filter?: ReportFilter,
  forceRefresh = false
): Promise<void> => {
  setLoading(true);
  try {
    const data = await GetAppointmentFunnel(clinicId, filter, forceRefresh);
    setData(data);
  } catch {
    setData(null);
  } finally {
    setLoading(false);
  }
};
