import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import RoundedPagination from '../../common/components/RoundedPagination';
import { toastConfig } from '../../common/api/responses';
import { useClinicId } from '../../common/components/ClinicId';
import { useAuthStore } from '../../common/store/authStore';
import { HandleGetInventories } from './api/handlers';
import { InventoryProps, InventoryStateModel } from './api/types';
import InventoryForm from './index-content/inventory-form';
import InventoryHeader from './index-content/inventory-header';
import InventoryTable from './index-content/inventory-table';
import InventoryDeleteModal from './modal/modal';
import styles from './style.scss.module.scss';

export const InventoryModule: FunctionComponent<InventoryProps> = (
  props: InventoryProps
): JSX.Element => {
  const { clinicId } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
  const activeBranchId = useAuthStore((store) => store.branchId);
  const lastLoadedContextKeyRef = useRef<string | null | undefined>(undefined);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<InventoryStateModel>({
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
    clinicProfileId: resolvedClinicId,
  });

  const loadInventories = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: InventoryStateModel) => ({
        ...prev,
        load: false,
        clinicProfileId: resolvedClinicId,
      }));
      return;
    }

    const requestState: InventoryStateModel = {
      ...state,
      load: true,
      clinicProfileId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: InventoryStateModel) => ({
        ...prev,
        load: true,
        clinicProfileId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetInventories(requestState, setState, resolvedClinicId, forceRefresh);

      if (showToast) {
        toast.info('Inventory records have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: InventoryStateModel) => ({
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
      void loadInventories(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev: InventoryStateModel) => ({
      ...prev,
      clinicProfileId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: InventoryStateModel) => ({
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
        void loadInventories(false, !clinicChanged);
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
    // Sync when clinic context, server search, or page offset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, resolvedClinicId, state.search, state.pageStart, state.pageEnd]);

  const handleCloseDialog = (): void => {
    setState((prev: InventoryStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: InventoryStateModel) => ({
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
          <InventoryHeader state={state} setState={setState} onReload={handleReload} />
          <div className={styles.listItem}>
            <div className={styles.tableArea}>
              <InventoryTable state={state} setState={setState} />
            </div>
            <div className={styles.paginationArea}>
              <RoundedPagination
                page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                pageSize={state.pageEnd}
                totalItems={state.totalItem}
                onChange={(nextPage) => {
                  setState((prev: InventoryStateModel) => ({
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
        maxWidth={state.isDelete ? 'sm' : 'lg'}
      >
        {state.isDelete ? (
          <InventoryDeleteModal state={state} setState={setState} />
        ) : (
          <InventoryForm state={state} setState={setState} />
        )}
      </Dialog>
    </div>
  );
};

export default InventoryModule;
