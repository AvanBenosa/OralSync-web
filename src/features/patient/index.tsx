import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';
import { PatientProps, PatientStateModel } from './api/types';
import PatientHeader from './index-content/patient-header';
import PatientForm from './index-content/patient-form';
import PatientTable from './index-content/patient-table';
import PatientDeleteModal from './modal/modal';
import PatientUploadModal from './modal/upload-modal';
import styles from './style.scss.module.scss';
import { HandleGetPatients } from './api/handlers';
import { toastConfig } from '../../common/api/responses';
import { useClinicId } from '../../common/components/ClinicId';
import RoundedPagination from '../../common/components/RoundedPagination';
import { useAuthStore } from '../../common/store/authStore';
export const PatientModule: FunctionComponent<PatientProps> = (
  props: PatientProps
): JSX.Element => {
  const { clinicId } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
  const activeBranchId = useAuthStore((store) => store.branchId);
  const lastLoadedClinicIdRef = useRef<string | null | undefined>(undefined);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<PatientStateModel>({
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
    upload: false,
    search: '',
    initial: 0,
    pageStart: 0,
    pageEnd: 25,
    totalItem: 0,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    clinicProfileId: resolvedClinicId,
  });

  const loadPatients = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!resolvedClinicId) {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: false,
        clinicProfileId: resolvedClinicId,
      }));
      return;
    }

    const requestState: PatientStateModel = {
      ...state,
      load: true,
      clinicProfileId: resolvedClinicId,
    };

    if (shouldSetLoadingState) {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: true,
        clinicProfileId: resolvedClinicId,
      }));
    }

    try {
      await HandleGetPatients(requestState, setState, resolvedClinicId, forceRefresh);

      if (showToast) {
        toast.info('Patient records have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientStateModel) => ({
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
      void loadPatients(true, true, true);
    }, 350);
  };

  useEffect(() => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      clinicProfileId: resolvedClinicId,
    }));

    if (!resolvedClinicId) {
      setState((prev: PatientStateModel) => ({
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

    const shouldDebounceSearch = !clinicChanged;
    searchTimeoutRef.current = setTimeout(
      () => {
        void loadPatients(false, !clinicChanged);
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
  }, [resolvedClinicId, activeBranchId, state.search, state.pageStart, state.pageEnd, state.sortBy, state.sortDirection]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      upload: false,
      selectedItem: undefined,
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <PatientHeader state={state} setState={setState} onReload={handleReload} />
          <div className={styles.listItem}>
            <div className={styles.tableArea}>
              <PatientTable state={state} setState={setState} />
            </div>
            <div className={styles.paginationArea}>
              <RoundedPagination
                page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
                pageSize={state.pageEnd}
                totalItems={state.totalItem}
                onChange={(nextPage) => {
                  setState((prev: PatientStateModel) => ({
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
        maxWidth={state.isDelete ? 'sm' : state.upload ? 'md' : 'md'}
      >
        {state.isDelete ? (
          <PatientDeleteModal state={state} setState={setState} />
        ) : state.upload ? (
          <PatientUploadModal state={state} setState={setState} clinicId={state.clinicProfileId} />
        ) : (
          <PatientForm state={state} setState={setState} />
        )}
      </Dialog>
    </div>
  );
};

export default PatientModule;
