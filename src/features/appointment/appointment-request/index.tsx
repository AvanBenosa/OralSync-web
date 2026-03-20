import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
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

export const AppointmentModule: FunctionComponent<AppointmentProps> = (
  props: AppointmentProps
): JSX.Element => {
  const { clinicId } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
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
    initial: 0,
    pageStart: 0,
    pageEnd: 25,
    totalItem: 0,
    clinicId: resolvedClinicId,
  });

  const loadAppointments = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: AppointmentStateModel) => ({
        ...prev,
        load: false,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    const isRequestsView = activeTab === 'requests';
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

    const shouldDebounceSearch = activeTab === 'requests' && !clinicChanged;
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
  }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd, activeTab]);

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
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div
            className={`${styles.listItem} ${
              activeTab === 'requests' ? styles.listItemWithPagination : ''
            }`}
          >
            {activeTab === 'requests' ? (
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
