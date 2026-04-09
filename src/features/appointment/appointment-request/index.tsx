import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog, useMediaQuery, useTheme } from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import { toast } from 'react-toastify';
import { toastConfig } from '../../../common/api/responses';

import { AppointmentProps, AppointmentStateModel, AppointmentViewTab } from './api/types';
import AppointmentHeader from './index-content/appointment-header';
import AppointmentCalendar from './index-content/appointment-calendar';
import AppointmentForm from './index-content/appointment-form';
import AppointmentTable from './index-content/appointment-table';
import AppointmentDeleteModal from './modal/modal';
import styles from './style.scss.module.scss';
import { HandleGetAppointments } from './api/handlers';
import { useClinicId } from '../../../common/components/ClinicId';
import RoundedPagination from '../../../common/components/RoundedPagination';
import { useAuthStore } from '../../../common/store/authStore';

export const AppointmentModule: FunctionComponent<AppointmentProps> = (
  props: AppointmentProps
): JSX.Element => {
  const { clinicId } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
  const activeBranchId = useAuthStore((store) => store.branchId);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentViewTab>('requests');
  const [state, setState] = useState<AppointmentStateModel>({
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
    search: '',
    dateFrom: '',
    dateTo: '',
    initial: 0,
    pageStart: 0,
    pageEnd: 25,
    totalItem: 0,
    clinicId: resolvedClinicId,
    summaryCount: 0,
    hasDateFilter: false,
  });
  const effectiveActiveTab: AppointmentViewTab = isMobile ? 'requests' : activeTab;

  const loadAppointments = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: AppointmentStateModel) => ({
        ...prev,
        load: false,
        items: [],
        clinicId: resolvedClinicId,
        totalItem: 0,
        summaryCount: 0,
        hasDateFilter: false,
      }));
      return;
    }

    const isRequestsView = effectiveActiveTab === 'requests';
    const requestState: AppointmentStateModel = {
      ...state,
      load: true,
      clinicId: resolvedClinicId,
      search: isRequestsView ? state.search : '',
      pageStart: isRequestsView ? state.pageStart : 0,
      pageEnd: isRequestsView ? state.pageEnd : Math.max(state.totalItem, state.pageEnd, 500),
    };

    if (shouldSetLoadingState) {
      setState((prev: AppointmentStateModel) => ({
        ...prev,
        load: true,
        clinicId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetAppointments(requestState, setState, forceRefresh, isRequestsView);

      if (showToast) {
        toast.info('Appointment data has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: AppointmentStateModel) => ({
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
      void loadAppointments(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev: AppointmentStateModel) => ({
      ...prev,
      clinicId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: AppointmentStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
        summaryCount: 0,
        hasDateFilter: false,
      }));

      return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }

    const clinicChanged = lastLoadedClinicIdRef.current !== resolvedClinicId;
    lastLoadedClinicIdRef.current = resolvedClinicId;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const shouldDebounceSearch = effectiveActiveTab === 'requests' && !clinicChanged;
    searchTimeoutRef.current = setTimeout(
      () => {
        void loadAppointments(false, !clinicChanged);
      },
      shouldDebounceSearch ? 250 : 0
    );

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // Fetch when clinic context, server search, page offset, or active view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedClinicId,
    state.search,
    state.dateFrom,
    state.dateTo,
    state.pageStart,
    state.pageEnd,
    activeTab,
    isMobile,
    activeBranchId,
  ]);

  const summaryLabel = state.hasDateFilter ? 'Total Appointments' : 'Appointment Today';
  const formattedSummaryCount = Number(state.summaryCount ?? 0).toLocaleString('en-US');

  const handleCloseDialog = (): void => {
    setState((prev: AppointmentStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: AppointmentStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <AppointmentHeader
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onReload={handleReload}
            activeTab={effectiveActiveTab}
          />
          <div className={styles.standaloneTabsRow}>
            {!isMobile ? (
              <div className={styles.tabList} role="tablist" aria-label="Appointment views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'requests'}
                  className={`${styles.tabButton} ${
                    activeTab === 'requests' ? styles.tabButtonActive : ''
                  }`}
                  onClick={() => setActiveTab('requests')}
                >
                  <span className={styles.tabButtonIcon} aria-hidden="true">
                    <ListAltRoundedIcon />
                  </span>
                  <span>Requests</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'calendar'}
                  className={`${styles.tabButton} ${
                    activeTab === 'calendar' ? styles.tabButtonActive : ''
                  }`}
                  onClick={() => setActiveTab('calendar')}
                >
                  <span className={styles.tabButtonIcon} aria-hidden="true">
                    <CalendarMonthRoundedIcon />
                  </span>
                  <span>Calendar</span>
                </button>
              </div>
            ) : null}
            <div className={styles.summaryCard} aria-live="polite">
              <span className={styles.summaryLabel}>{summaryLabel}:</span>
              <strong className={styles.summaryValue}>{formattedSummaryCount}</strong>
            </div>
          </div>
          <div
            className={`${styles.listItem} ${
              effectiveActiveTab === 'requests' ? styles.listItemWithPagination : ''
            }`}
          >
            {effectiveActiveTab === 'requests' ? (
              <>
                <div className={styles.tableArea}>
                  <AppointmentTable state={state} setState={setState} clinicId={state.clinicId} />
                </div>
                <div className={styles.paginationArea}>
                  <RoundedPagination
                    page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                    pageSize={state.pageEnd}
                    totalItems={state.totalItem}
                    onChange={(nextPage) => {
                      setState((prev: AppointmentStateModel) => ({
                        ...prev,
                        pageStart: (nextPage - 1) * prev.pageEnd,
                      }));
                    }}
                  />
                </div>
              </>
            ) : (
              <div className={styles.calendarArea}>
                <AppointmentCalendar state={state} setState={setState} clinicId={state.clinicId} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{ onExited: handleDialogExited }}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <AppointmentDeleteModal state={state} setState={setState} clinicId={state.clinicId} />
        ) : (
          <AppointmentForm state={state} setState={setState} clinicId={state.clinicId} />
        )}
      </Dialog>
    </div>
  );
};

export default AppointmentModule;
