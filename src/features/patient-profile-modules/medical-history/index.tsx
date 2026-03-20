import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { PatientMedicalHistoryProps, PatientMedicalHistoryStateModel } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import styles from '../styles.module.scss';
import PatientMedicalHistoryHeader from './index-content/medical-history-header';
import PatientMedicalHistoryTable from './index-content/medical-history-table';
import PatientMedicalHistoryForm from './index-content/medical-history-form';
import PatientMedicalHistoryDeleteModal from './modal/modal';
import { HandleGetPatientMedicalHistoryItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';

export const PatientMedicalHistory: FunctionComponent<PatientMedicalHistoryProps> = (
  props: PatientMedicalHistoryProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientMedicalHistoryStateModel>({
    patientId,
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
  });

  const loadMedicalHistory = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientMedicalHistoryStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientMedicalHistoryStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientMedicalHistoryItems(
        {
          ...state,
          load: true,
          patientId,
        },
        setState,
        patientId,
        forceRefresh
      );

      if (showToast) {
        toast.info('Medical history has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientMedicalHistoryStateModel) => ({
        ...prev,
        load: false,
        items: [],
      }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadMedicalHistory(true, true, true);
    }, 350);
  };

  reloadActionRef.current = handleReload;

  useEffect(() => {
    if (lastLoadedPatientIdRef.current === patientId) {
      return () => {
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
      };
    }

    lastLoadedPatientIdRef.current = patientId;

    (async (): Promise<void> => {
      await loadMedicalHistory(false, false);
    })();

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // Intentionally fetch on patient context changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    onRegisterMobileReload?.({
      onReload: () => reloadActionRef.current(),
      disabled: state.load,
      title: 'Reload medical history',
      ariaLabel: 'Reload medical history',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientMedicalHistoryStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientMedicalHistoryStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  if (state.notFound) {
    return <NotFoundPage />;
  }

  return (
    <>
      <section className={styles.rightColumn}>
        <div className={styles.wrapper}>
          <div className={styles.bodyWrapper}>
            <div className={styles.listContainer}>
              <PatientMedicalHistoryHeader
                state={state}
                setState={setState}
                onReload={handleReload}
              />
              <div className={styles.listItem}>
                <PatientMedicalHistoryTable state={state} setState={setState} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{ onExited: handleDialogExited }}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <PatientMedicalHistoryDeleteModal state={state} setState={setState} />
        ) : (
          <PatientMedicalHistoryForm
            state={state}
            setState={setState}
            patientLabel={props.patientLabel}
          />
        )}
      </Dialog>
    </>
  );
};

export default PatientMedicalHistory;
