/* eslint-disable react/jsx-pascal-case */
// TODO: Replace MODULE_NAME, module_name, MODULE_NOUN tokens.

import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { HandleGetMODULE_NAMEs } from './api/handlers';
import { MODULE_NAMEProps, MODULE_NAMEStateModel } from './api/types';
import MODULE_NAMEForm from './index-content/module_name-form';
import MODULE_NAMEHeader from './index-content/module_name-header';
import MODULE_NAMETable from './index-content/module_name-table';
import MODULE_NAMEDeleteModal from './modal/modal';
import styles from './style.scss.module.scss';
import { useClinicId } from '../../components/ClinicId';
import { toastConfig } from '../../api/responses';
import RoundedPagination from '../../components/RoundedPagination';

export const MODULE_NAMEModule: FunctionComponent<MODULE_NAMEProps> = (
  props: MODULE_NAMEProps
): JSX.Element => {
  const { clinicId } = props;
  const resolvedClinicId = useClinicId(clinicId);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<MODULE_NAMEStateModel>({
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

  const loadRecords = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev) => ({ ...prev, load: false, clinicProfileId: resolvedClinicId }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev) => ({ ...prev, load: true, clinicProfileId: resolvedClinicId }));
    }

    const requestState: MODULE_NAMEStateModel = {
      ...state,
      load: true,
      clinicProfileId: resolvedClinicId,
    };

    try {
      await HandleGetMODULE_NAMEs(requestState, setState, resolvedClinicId, forceRefresh);
      if (showToast) toast.info('Records have been refreshed.', toastConfig);
    } catch {
      setState((prev) => ({ ...prev, load: false }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    reloadTimeoutRef.current = setTimeout(() => {
      void loadRecords(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev) => ({ ...prev, clinicProfileId: resolvedClinicId }));

    if (!resolvedClinicId) {
      setState((prev) => ({ ...prev, load: false }));
      return () => {
        if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    }

    const clinicChanged = lastLoadedClinicIdRef.current !== resolvedClinicId;
    lastLoadedClinicIdRef.current = resolvedClinicId;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(
      () => {
        void loadRecords(false, !clinicChanged);
      },
      clinicChanged ? 0 : 250
    );

    return () => {
      if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClinicId, state.search, state.pageStart, state.pageEnd]);

  const handleCloseDialog = (): void => {
    setState((prev) => ({ ...prev, openModal: false }));
  };

  const handleDialogExited = (): void => {
    setState((prev) => ({ ...prev, isUpdate: false, isDelete: false, selectedItem: undefined }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <MODULE_NAMEHeader state={state} setState={setState} onReload={handleReload} />
          <div className={styles.listItem}>
            <div className={styles.tableArea}>
              <MODULE_NAMETable state={state} setState={setState} />
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
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <MODULE_NAMEDeleteModal state={state} setState={setState} />
        ) : (
          <MODULE_NAMEForm state={state} setState={setState} />
        )}
      </Dialog>
    </div>
  );
};

export default MODULE_NAMEModule;
