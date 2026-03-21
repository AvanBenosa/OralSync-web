import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import RoundedPagination from '../../../common/components/RoundedPagination';
import { toastConfig } from '../../../common/api/responses';
import { useClinicId } from '../../../common/components/ClinicId';
import type { FinanceModuleStateModel, FinanceViewTab } from '../api/types';
import { HandleGetFinanceExpenseItems } from './api/handlers';
import type { FinanceExpenseModel, FinanceExpenseStateModel } from './api/types';
import FinanceOverviewExpenseForm from './index-content/finance-overview-form';
import FinanceOverviewExpenseHeader from './index-content/finance-overview-header';
import FinanceOverviewExpenseTable from './index-content/finance-overview-expense-table';
import FinanceOverviewExpenseDeleteModal from './modal/modal';
import styles from '../style.scss.module.scss';
import FormatCurrency from '../../../common/helpers/formatCurrency';

type FinanceOverviewExpenseProps = {
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
  dateFrom: '',
  dateTo: '',
  initial: 0,
  pageStart: 0,
  pageEnd: 25,
  totalItem: 0,
  clinicId,
});

export const FinanceOverviewExpenses: FunctionComponent<FinanceOverviewExpenseProps> = (
  props: FinanceOverviewExpenseProps
): JSX.Element => {
  const { clinicId, activeTab, onTabChange } = props;
  const dialogStateReset = {
    openModal: false,
    isUpdate: false,
    isDelete: false,
    selectedItem: undefined,
  } as const;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const resolvedClinicId = useClinicId(clinicId);
  const [state, setState] = useState<FinanceExpenseStateModel>(() => ({
    ...createInitialModuleState<FinanceExpenseModel>(resolvedClinicId),
    amount: 0,
    hasDateFilter: false,
  }));

  const loadFinanceExpenses = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false,
    stateOverrides?: Partial<FinanceExpenseStateModel>
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: FinanceExpenseStateModel) => ({
        ...prev,
        load: false,
        items: [],
        totalItem: 0,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    const requestState: FinanceExpenseStateModel = {
      ...state,
      ...stateOverrides,
      load: true,
      clinicId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: FinanceExpenseStateModel) => ({
        ...prev,
        ...stateOverrides,
        load: true,
        clinicId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetFinanceExpenseItems(requestState, setState, forceRefresh);

      if (showToast) {
        toast.info('Finance expense data has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: FinanceExpenseStateModel) => ({
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
      void loadFinanceExpenses(true, true, true);
    }, 350);
  };

  const handleMutationCompleted = async (): Promise<void> => {
    await loadFinanceExpenses(false, true, true, dialogStateReset);
  };

  useEffect(() => {
    setState((prev: FinanceExpenseStateModel) => ({
      ...prev,
      clinicId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: FinanceExpenseStateModel) => ({
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

    if (activeTab !== 'expenses') {
      setState((prev: FinanceExpenseStateModel) => ({
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
        void loadFinanceExpenses(false, !clinicChanged);
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
    // Fetch when clinic context, search, date range, page offset, or view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedClinicId,
    state.search,
    state.dateFrom,
    state.dateTo,
    state.pageStart,
    state.pageEnd,
    activeTab,
  ]);

  const handleCloseDialog = (): void => {
    setState((prev: FinanceExpenseStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: FinanceExpenseStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  const summaryLabel = state.hasDateFilter ? 'Total Expenses' : 'Expenses Today';
  const formattedSummaryAmount = <FormatCurrency value={state.amount} />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <FinanceOverviewExpenseHeader
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onReload={handleReload}
          />
          <div className={styles.standaloneTabsRow}>
            <div className={styles.tabList} role="tablist" aria-label="Finance views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'income'}
                className={`${styles.tabButton} ${
                  activeTab === 'income' ? styles.tabButtonActive : ''
                }`}
                onClick={() => onTabChange('income')}
              >
                <span className={styles.tabButtonIcon} aria-hidden="true">
                  <TrendingUpRoundedIcon />
                </span>
                <span>Income</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'expenses'}
                className={`${styles.tabButton} ${
                  activeTab === 'expenses' ? styles.tabButtonActive : ''
                }`}
                onClick={() => onTabChange('expenses')}
              >
                <span className={styles.tabButtonIcon} aria-hidden="true">
                  <TrendingDownRoundedIcon />
                </span>
                <span>Expenses</span>
              </button>
            </div>
            <div className={styles.financeSummaryCard} aria-live="polite">
              <span className={styles.financeSummaryLabel}>{summaryLabel}:</span>
              <strong className={styles.financeSummaryValue}>{formattedSummaryAmount}</strong>
            </div>
          </div>
          <div className={`${styles.listItem} ${styles.listItemWithPagination}`}>
            <div className={styles.tableArea}>
              <FinanceOverviewExpenseTable
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
                  setState((prevState: FinanceExpenseStateModel) => ({
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
        maxWidth="sm"
      >
        {state.isDelete ? (
          <FinanceOverviewExpenseDeleteModal
            state={state}
            setState={setState}
            clinicId={state.clinicId}
            onDeleted={handleMutationCompleted}
          />
        ) : (
          <FinanceOverviewExpenseForm state={state} setState={setState} clinicId={state.clinicId} />
        )}
      </Dialog>
    </div>
  );
};

export default FinanceOverviewExpenses;
