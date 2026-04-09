import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import RoundedPagination from '../../common/components/RoundedPagination';
import { toastConfig } from '../../common/api/responses';
import { useClinicId } from '../../common/components/ClinicId';
import { useAuthStore } from '../../common/store/authStore';
import { HandleGetDentalLabCases } from './api/handlers';
import { DentalLabCasesProps, DentalLabCaseStateModel } from './api/types';
import DentalLabCasesForm from './index-content/dental-lab-cases-form';
import DentalLabCasesHeader from './index-content/dental-lab-cases-header';
import DentalLabCasesTable from './index-content/dental-lab-cases-table';
import DentalLabCasesDeleteModal from './modal/modal';
import styles from './style.scss.module.scss';
import 'react-odontogram/style.css';

export const DentalLabCasesModule: FunctionComponent<DentalLabCasesProps> = (
  props: DentalLabCasesProps
): JSX.Element => {
  const { clinicId } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
  const activeBranchId = useAuthStore((store) => store.branchId);
  const lastLoadedContextKeyRef = useRef<string | null | undefined>(undefined);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<DentalLabCaseStateModel>({
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
    search: '',
    statusFilter: 'All',
    initial: 0,
    pageStart: 0,
    pageEnd: 25,
    totalItem: 0,
    clinicProfileId: resolvedClinicId,
  });

  const loadLabCases = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev) => ({
        ...prev,
        load: false,
        clinicProfileId: resolvedClinicId,
      }));
      return;
    }

    const requestState: DentalLabCaseStateModel = {
      ...state,
      load: true,
      clinicProfileId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev) => ({
        ...prev,
        load: true,
        clinicProfileId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetDentalLabCases(requestState, setState, resolvedClinicId, forceRefresh);

      if (showToast) {
        toast.info('Dental lab cases have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev) => ({
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
      void loadLabCases(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      clinicProfileId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev) => ({
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

    const contextKey = `${resolvedClinicId ?? 'current-clinic'}:${activeBranchId ?? 'all-branches'}`;
    const clinicChanged = lastLoadedContextKeyRef.current !== contextKey;
    lastLoadedContextKeyRef.current = contextKey;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const shouldDebounceSearch = !clinicChanged;
    searchTimeoutRef.current = setTimeout(
      () => {
        void loadLabCases(false, !clinicChanged);
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
    // Sync when clinic context, search, or page offset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, resolvedClinicId, state.search, state.statusFilter, state.pageStart, state.pageEnd]);

  const handleCloseDialog = (): void => {
    setState((prev) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev) => ({
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
          <DentalLabCasesHeader state={state} setState={setState} onReload={handleReload} />
          <div className={styles.listItem}>
            <div className={styles.tableArea}>
              <DentalLabCasesTable state={state} setState={setState} />
            </div>
            <div className={styles.paginationArea}>
              <RoundedPagination
                page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                pageSize={state.pageEnd}
                totalItems={state.totalItem}
                onChange={(nextPage) => {
                  setState((prev) => ({
                    ...prev,
                    pageStart: (nextPage - 1) * prev.pageEnd,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{ onExited: handleDialogExited }}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'xl'}
      >
        {state.isDelete ? (
          <DentalLabCasesDeleteModal state={state} setState={setState} />
        ) : (
          <DentalLabCasesForm state={state} setState={setState} />
        )}
      </Dialog>
    </div>
  );
};

export default DentalLabCasesModule;
