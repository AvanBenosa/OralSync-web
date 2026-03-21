import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import RoundedPagination from '../../common/components/RoundedPagination';
import { toastConfig } from '../../common/api/responses';
import { useClinicId } from '../../common/components/ClinicId';
import { HandleGetFinanceIncomeItems } from './api/handlers';
import type {
  FinanceOverviewProps,
  FinanceOverviewStateModel,
  FinanceViewTab,
} from './api/types';
import FinanceOverviewExpenseTable from './index-content/finance-overview-expense-table';
import FinanceOverviewForm from './index-content/finance-overview-form';
import FinanceOverviewHeader from './index-content/finance-overview-header';
import FinanceOverviewIncomeTable from './index-content/finance-overview-income-table';
import FinanceOverviewDeleteModal from './modal/modal';
import styles from './style.scss.module.scss';

export const FinanceOverview: FunctionComponent<FinanceOverviewProps> = (
  props: FinanceOverviewProps
): JSX.Element => {
  const { clinicId } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const resolvedClinicId = useClinicId(clinicId);
  const [activeTab, setActiveTab] = useState<FinanceViewTab>('income');
  const [state, setState] = useState<FinanceOverviewStateModel>({
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

  const loadFinanceIncome = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: FinanceOverviewStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    const requestState: FinanceOverviewStateModel = {
      ...state,
      load: true,
      clinicId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: FinanceOverviewStateModel) => ({
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
      setState((prev: FinanceOverviewStateModel) => ({
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

  const handleIncomeMutationCompleted = async (): Promise<void> => {
    await loadFinanceIncome(false, true, true);
  };

  useEffect(() => {
    setState((prev: FinanceOverviewStateModel) => ({
      ...prev,
      clinicId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: FinanceOverviewStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
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

    if (activeTab !== 'income') {
      setState((prev: FinanceOverviewStateModel) => ({
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

    searchTimeoutRef.current = setTimeout(
      () => {
        void loadFinanceIncome(false, !clinicChanged);
      },
      clinicChanged ? 0 : 250
    );

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // Fetch when clinic context, search, page offset, or view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd, activeTab]);

  const handleCloseDialog = (): void => {
    setState((prev: FinanceOverviewStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: FinanceOverviewStateModel) => ({
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
          <FinanceOverviewHeader
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onReload={handleReload}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div
            className={`${styles.listItem} ${
              activeTab === 'income' ? styles.listItemWithPagination : ''
            }`}
          >
            {activeTab === 'income' ? (
              <>
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
                      setState((prev: FinanceOverviewStateModel) => ({
                        ...prev,
                        pageStart: (nextPage - 1) * prev.pageEnd,
                      }));
                    }}
                  />
                </div>
              </>
            ) : (
              <div className={styles.tableArea}>
                <FinanceOverviewExpenseTable />
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
          <FinanceOverviewDeleteModal
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onDeleted={handleIncomeMutationCompleted}
          />
        ) : (
          <FinanceOverviewForm
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onSaved={handleIncomeMutationCompleted}
          />
        )}
      </Dialog>
    </div>
  );
};

export default FinanceOverview;
