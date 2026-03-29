import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
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
import FormatCurrency from '../../../common/helpers/formatCurrency';
import InvoiceGeneratorModal from '../../invoice-generator/modal/modal';
import type {
  InvoiceGeneratorModel,
  InvoiceGeneratorSummaryModel,
} from '../../invoice-generator/api/types';

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
  dateFrom: '',
  dateTo: '',
  initial: 0,
  pageStart: 0,
  pageEnd: 25,
  totalItem: 0,
  clinicId,
});

const getResolvedInvoiceTotalAmount = (item?: FinanceIncomeModel | null): number =>
  Number(item?.totalAmountDue ?? (item?.amount ?? 0) - (item?.discount ?? 0));

const getResolvedInvoiceBalance = (item?: FinanceIncomeModel | null): number =>
  Number(item?.balance ?? getResolvedInvoiceTotalAmount(item) - Number(item?.amountPaid ?? 0));

const buildInvoicePreviewItem = (item: FinanceIncomeModel): InvoiceGeneratorModel => ({
  id: item.id,
  patientInfoId: item.patientInfoId,
  patientName: item.patientName,
  patientNumber: item.patientNumber,
  date: item.date,
  procedure: item.procedure?.trim() || item.category?.trim() || '--',
  totalAmount: getResolvedInvoiceTotalAmount(item),
  amountPaid: Number(item.amountPaid ?? 0),
  balance: getResolvedInvoiceBalance(item),
});

export const FinanceOverviewIncome: FunctionComponent<FinanceOverviewIncomeProps> = (
  props: FinanceOverviewIncomeProps
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
  const [invoicePreviewItem, setInvoicePreviewItem] = useState<FinanceIncomeModel | null>(null);
  const [state, setState] = useState<FinanceIncomeStateModel>(() => ({
    ...createInitialModuleState<FinanceIncomeModel>(resolvedClinicId),
    amount: 0,
    hasDateFilter: false,
    statusFilter: 'all',
  }));

  const invoicePreviewItems = useMemo<InvoiceGeneratorModel[]>(
    () => (invoicePreviewItem ? [buildInvoicePreviewItem(invoicePreviewItem)] : []),
    [invoicePreviewItem]
  );
  const invoicePreviewSummary = useMemo<InvoiceGeneratorSummaryModel>(
    () => ({
      totalAmount: invoicePreviewItems.reduce(
        (accumulator, item) => accumulator + Number(item.totalAmount ?? 0),
        0
      ),
      amountPaid: invoicePreviewItems.reduce(
        (accumulator, item) => accumulator + Number(item.amountPaid ?? 0),
        0
      ),
      balance: invoicePreviewItems.reduce(
        (accumulator, item) => accumulator + Number(item.balance ?? 0),
        0
      ),
    }),
    [invoicePreviewItems]
  );
  const invoicePreviewDate = useMemo(() => {
    const rawValue = invoicePreviewItem?.date;

    if (!rawValue) {
      return '';
    }

    return rawValue instanceof Date ? rawValue.toISOString() : rawValue;
  }, [invoicePreviewItem]);

  const loadFinanceIncome = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false,
    stateOverrides?: Partial<FinanceIncomeStateModel>
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
      ...stateOverrides,
      load: true,
      clinicId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: FinanceIncomeStateModel) => ({
        ...prev,
        ...stateOverrides,
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
    await loadFinanceIncome(false, true, true, dialogStateReset);
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
    // Fetch when clinic context, search, date range, page offset, or view changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedClinicId,
    state.search,
    state.dateFrom,
    state.dateTo,
    state.statusFilter,
    state.pageStart,
    state.pageEnd,
    activeTab,
  ]);

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

  const summaryLabel = state.hasDateFilter ? 'Total Income' : 'Income Today';
  const formattedSummaryAmount = <FormatCurrency value={state.amount} />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <FinanceOverviewIncomeHeader
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
              <FinanceOverviewIncomeTable
                state={state}
                setState={setState}
                clinicId={state.clinicId}
                onOpenInvoice={(item) => setInvoicePreviewItem(item)}
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
          <FinanceOverviewIncomeForm state={state} setState={setState} clinicId={state.clinicId} />
        )}
      </Dialog>
      <Dialog
        open={Boolean(invoicePreviewItem)}
        onClose={() => setInvoicePreviewItem(null)}
        fullWidth
        maxWidth="md"
      >
        <InvoiceGeneratorModal
          open={Boolean(invoicePreviewItem)}
          onClose={() => setInvoicePreviewItem(null)}
          clinicId={resolvedClinicId}
          patientName={
            invoicePreviewItem?.patientName?.trim() ||
            invoicePreviewItem?.patientNumber?.trim() ||
            '--'
          }
          patientNumber={invoicePreviewItem?.patientNumber}
          filterDate={invoicePreviewDate}
          items={invoicePreviewItems}
          summary={invoicePreviewSummary}
        />
      </Dialog>
    </div>
  );
};

export default FinanceOverviewIncome;
