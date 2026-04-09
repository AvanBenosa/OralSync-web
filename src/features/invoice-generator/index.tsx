import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { toastConfig } from '../../common/api/responses';
import RoundedPagination from '../../common/components/RoundedPagination';
import { useClinicId } from '../../common/components/ClinicId';
import { useAuthStore } from '../../common/store/authStore';
import { HandleGetInvoiceGeneratorItems } from './api/handlers';
import type {
  InvoiceGeneratorProps,
  InvoiceGeneratorStateModel,
  InvoiceGeneratorSummaryModel,
} from './api/types';
import InvoiceGeneratorForm from './index-content/invoice-generator-form';
import InvoiceGeneratorHeader from './index-content/invoice-generator-header';
import InvoiceGeneratorTable from './index-content/invoice-generator-table';
import InvoiceGeneratorModal from './modal/modal';
import styles from './style.scss.module.scss';

const createInitialState = (clinicId?: string | null): InvoiceGeneratorStateModel => ({
  items: [],
  load: false,
  totalItem: 0,
  pageStart: 0,
  pageEnd: 10,
  clinicId,
  selectedPatientId: '',
  selectedPatientName: '',
  filterDate: '',
  openModal: false,
});

const buildSummary = (state: InvoiceGeneratorStateModel): InvoiceGeneratorSummaryModel =>
  state.items.reduce<InvoiceGeneratorSummaryModel>(
    (accumulator, item) => ({
      totalAmount: accumulator.totalAmount + Number(item.totalAmount ?? 0),
      amountPaid: accumulator.amountPaid + Number(item.amountPaid ?? 0),
      balance: accumulator.balance + Number(item.balance ?? 0),
    }),
    {
      totalAmount: 0,
      amountPaid: 0,
      balance: 0,
    }
  );

export const InvoiceGeneratorModule: FunctionComponent<InvoiceGeneratorProps> = (
  props: InvoiceGeneratorProps
): JSX.Element => {
  const { clinicId } = props;
  const resolvedClinicId = useClinicId(clinicId);
  const activeBranchId = useAuthStore((store) => store.branchId);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedKeyRef = useRef<string>('');
  const [state, setState] = useState<InvoiceGeneratorStateModel>(() =>
    createInitialState(resolvedClinicId)
  );

  const hasReadyFilters = Boolean(
    resolvedClinicId && state.selectedPatientId?.trim() && state.filterDate?.trim()
  );

  const summary = useMemo(() => buildSummary(state), [state]);
  const visibleItems = useMemo(
    () => state.items.slice(state.pageStart, state.pageStart + state.pageEnd),
    [state.items, state.pageEnd, state.pageStart]
  );

  const loadInvoiceItems = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!hasReadyFilters) {
      setState((prevState) => ({
        ...prevState,
        load: false,
        items: [],
        totalItem: 0,
        pageStart: 0,
        clinicId: resolvedClinicId,
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prevState) => ({
        ...prevState,
        load: true,
        clinicId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetInvoiceGeneratorItems(
        {
          ...state,
          load: true,
          clinicId: resolvedClinicId,
        },
        setState,
        forceRefresh
      );

      if (showToast) {
        toast.info('Invoice records have been refreshed.', toastConfig);
      }
    } catch {
      setState((prevState) => ({
        ...prevState,
        load: false,
      }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadInvoiceItems(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      clinicId: resolvedClinicId,
    }));
  }, [resolvedClinicId]);

  useEffect(() => {
    const requestKey = [
      resolvedClinicId ?? '',
      state.selectedPatientId ?? '',
      state.filterDate ?? '',
    ].join('|');

    if (!hasReadyFilters) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      setState((prevState) => ({
        ...prevState,
        load: false,
        items: [],
        totalItem: 0,
        pageStart: 0,
      }));

      return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }

    const shouldDelay = lastLoadedKeyRef.current === requestKey;
    lastLoadedKeyRef.current = requestKey;

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(
      () => {
        void loadInvoiceItems(false, true, false);
      },
      shouldDelay ? 200 : 0
    );

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
    // Sync when clinic context or invoice filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClinicId, activeBranchId, state.selectedPatientId, state.filterDate]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <InvoiceGeneratorHeader
            state={state}
            setState={setState}
            onReload={handleReload}
            onOpenPreview={() => {
              setState((prevState) => ({
                ...prevState,
                openModal: true,
              }));
            }}
            canPreview={state.items.length > 0}
          />

          <div className={styles.invoiceContentGrid}>
            <InvoiceGeneratorForm
              state={state}
              setState={setState}
              clinicId={resolvedClinicId}
              summary={summary}
            />

            <div className={`${styles.listItem} ${styles.invoiceTablePanel}`}>
              <div className={styles.tableArea}>
                <InvoiceGeneratorTable
                  state={state}
                  items={visibleItems}
                  hasReadyFilters={hasReadyFilters}
                />
              </div>
              <div className={styles.paginationArea}>
                <RoundedPagination
                  page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                  pageSize={state.pageEnd}
                  totalItems={state.totalItem}
                  onChange={(nextPage) => {
                    setState((prevState) => ({
                      ...prevState,
                      pageStart: (nextPage - 1) * prevState.pageEnd,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={state.openModal}
        onClose={() => {
          setState((prevState) => ({
            ...prevState,
            openModal: false,
          }));
        }}
        fullWidth
        maxWidth="md"
      >
        <InvoiceGeneratorModal
          open={state.openModal}
          onClose={() => {
            setState((prevState) => ({
              ...prevState,
              openModal: false,
            }));
          }}
          clinicId={resolvedClinicId}
          patientName={state.selectedPatientName}
          patientNumber={state.items[0]?.patientNumber}
          filterDate={state.filterDate}
          items={state.items}
          summary={summary}
        />
      </Dialog>
    </div>
  );
};

export default InvoiceGeneratorModule;
