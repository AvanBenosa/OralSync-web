import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import RoundedPagination from '../../../common/components/RoundedPagination';
import { toastConfig } from '../../../common/api/responses';
import { useClinicId } from '../../../common/components/ClinicId';
import type { FinanceModuleStateModel, FinanceViewTab } from '../api/types';
import { HandleGetFinanceIncomeItems } from './api/handlers';
import type { FinanceIncomeModel, FinanceIncomeStateModel } from './api/types';
import FinanceOverviewIncomeForm from './index-content/finance-overview-form';
import FinanceOverviewIncomeHeader from './index-content/finance-overview-header';
import FinanceOverviewIncomeTable from './index-content/finance-overview-income-table';
import FinanceOverviewIncomeDeleteModal from './modal/modal';
import styles from '../style.scss.module.scss';

type FinanceOverviewIncomeProps = {
  clinicId?: string;
  activeTab: FinanceViewTab;
  onTabChange: (tab: FinanceViewTab) => void;
};

const createInitialModuleState = <T,>(clinicId?: string | null): FinanceModuleStateModel<T> => ({
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
  clinicId,
});

export const FinanceOverviewIncome: FunctionComponent<FinanceOverviewIncomeProps> = (
  props: FinanceOverviewIncomeProps
): JSX.Element => {
  const { clinicId, activeTab, onTabChange } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const resolvedClinicId = useClinicId(clinicId);
  const [state, setState] = useState<FinanceIncomeStateModel>(() =>
    createInitialModuleState<FinanceIncomeModel>(resolvedClinicId)
  );

  const loadFinanceIncome = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: FinanceIncomeStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    const requestState: FinanceIncomeStateModel = {
      ...state,
      load: true,
      clinicId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: FinanceIncomeStateModel) => ({
        ...prev,
        load: true,
        clinicId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetFinanceIncomeItems(requestState, setState, forceRefresh);

      if (showToast) {
        toast.info('Finance income data has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: FinanceIncomeStateModel) => ({
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
      void loadFinanceIncome(true, true, true);
    }, 350);
  };

  const handleMutationCompleted = async (): Promise<void> => {
    await loadFinanceIncome(false, true, true);
  };

  useEffect(() => {
    setState((prev: FinanceIncomeStateModel) => ({
      ...prev,
      clinicId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: FinanceIncomeStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
      }));

      const reloadTimeout = reloadTimeoutRef.current;
      const searchTimeout = searchTimeoutRef.current;
      return () => {
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }

    if (activeTab !== 'income') {
      setState((prev: FinanceIncomeStateModel) => ({
        ...prev,
        load: false,
      }));

      const reloadTimeout = reloadTimeoutRef.current;
      const searchTimeout = searchTimeoutRef.current;
      return () => {
        if (reloadTimeout) {
          clearTimeout(reloadTimeout);
        }
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }

    const clinicChanged = lastLoadedClinicIdRef.current !== resolvedClinicId;
    lastLoadedClinicIdRef.current = resolvedClinicId;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(
      () => {
        void loadFinanceIncome(false, !clinicChanged);
      },
      clinicChanged ? 0 : 250
    );

    const reloadTimeout = reloadTimeoutRef.current;
    const searchTimeout = searchTimeoutRef.current;
    return () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // Fetch when clinic context, search, page offset, or view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd, activeTab]);

  const handleCloseDialog = (): void => {
    setState((prev: FinanceIncomeStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: FinanceIncomeStateModel) => ({
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
          <FinanceOverviewIncomeHeader
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onReload={handleReload}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <div className={`${styles.listItem} ${styles.listItemWithPagination}`}>
            <div className={styles.tableArea}>
              <FinanceOverviewIncomeTable
                state={state}
                setState={setState}
                clinicId={state.clinicId}
              />
            </div>
            <div className={styles.paginationArea}>
              <RoundedPagination
                page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                pageSize={state.pageEnd}
                totalItems={state.totalItem}
                onChange={(nextPage) => {
                  setState((prevState: FinanceIncomeStateModel) => ({
                    ...prevState,
                    pageStart: (nextPage - 1) * prevState.pageEnd,
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
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <FinanceOverviewIncomeDeleteModal
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onDeleted={handleMutationCompleted}
          />
        ) : (
          <FinanceOverviewIncomeForm
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onSaved={handleMutationCompleted}
          />
        )}
      </Dialog>
    </div>
  );
};

export default FinanceOverviewIncome;
