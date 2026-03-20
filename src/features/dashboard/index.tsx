import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { toastConfig } from '../../common/api/responses';
import { DashboardProps, DashboardStateModel } from './api/types';
import styles from './style.scss.module.scss';
import DashBoardAnnouncement from './index-content/dashboard-announcement';
import DashBoardHeader from './index-content/dashboard-header';
import DashBoardCharts from './index-content/dashboard-charts';
import DashBoardLists from './index-content/dashboard-lists';
import DashBoardWidgets from './index-content/dashboard-widgets';
import { HandleGetDashboard } from './api/handlers';
import { useClinicId } from '../../common/components/ClinicId';
export const DashBoard: FunctionComponent<DashboardProps> = (
  props: DashboardProps
): JSX.Element => {
  const { clinicId } = props;
  const resolvedClinicId = useClinicId(clinicId);

  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const [state, setState] = useState<DashboardStateModel>({
    load: true,
    totalPatients: 0,
    patientsToday: 0,
    scheduledAppointments: 0,
    pendingAppointments: 0,
    incomeToday: 0,
    totalIncomeMonthly: 0,
    latestPatients: [],
    addPatients: false,
    addAppointment: false,
    monthlyRevenue: [],
    monthlyIncome: [],
    todayAppointment: [],
    nextDayAppointment: [],
    clinicId: resolvedClinicId,
  });

  const loadDashboard = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: DashboardStateModel) => ({
        ...prev,
        load: false,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: DashboardStateModel) => ({
        ...prev,
        load: true,
        clinicId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetDashboard(setState, resolvedClinicId, forceRefresh);

      if (showToast) {
        toast.info('Dashboard data has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: DashboardStateModel) => ({
        ...prev,
        load: false,
      }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadDashboard(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev: DashboardStateModel) => ({
      ...prev,
      clinicId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: DashboardStateModel) => ({
        ...prev,
        load: false,
      }));

      return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
      };
    }

    if (lastLoadedClinicIdRef.current === resolvedClinicId) {
      return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
      };
    }

    lastLoadedClinicIdRef.current = resolvedClinicId;

    (async (): Promise<void> => {
      await loadDashboard(false, false);
    })();

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // Fetch when clinic context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClinicId]);
  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <DashBoardAnnouncement />
          <DashBoardHeader state={state} setState={setState} onReload={handleReload} />
          <DashBoardWidgets state={state} setState={setState} />
          <DashBoardLists state={state} setState={setState} />
          <DashBoardCharts state={state} setState={setState} />
        </div>
      </div>
    </div>
  );
};
export default DashBoard;
