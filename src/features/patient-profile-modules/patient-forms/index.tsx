import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { PatientFormStateModel, PatientFormsProps } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import styles from '../styles.module.scss';
import { HandleGetPatientFormItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';
import PatientFormsHeader from './index-content/patient-forms-header';
import PatientFormsTable from './index-content/patient-forms-table';
import PatientFormsForm from './index-content/patient-forms-form';
import PatientFormsDeleteModal from './modal/delete-modal';
import PatientFormsViewModal from './modal/view-modal';

export const PatientForms: FunctionComponent<PatientFormsProps> = (
  props: PatientFormsProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientFormStateModel>({
    patientId,
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
    isView: false,
  });

  const loadPatientForms = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientFormStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientFormStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientFormItems(
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
        toast.info('Patient forms have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientFormStateModel) => ({
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
      void loadPatientForms(true, true, true);
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
      await loadPatientForms(false, false);
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
      title: 'Reload forms',
      ariaLabel: 'Reload forms',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientFormStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientFormStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      isView: false,
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
              <PatientFormsHeader state={state} setState={setState} onReload={handleReload} />
              <div className={styles.listItem}>
                <PatientFormsTable state={state} setState={setState} />
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
        maxWidth={state.isDelete ? 'sm' : state.isView ? 'lg' : 'md'}
      >
        {state.isDelete ? (
          <PatientFormsDeleteModal state={state} setState={setState} />
        ) : state.isView ? (
          <PatientFormsViewModal
            state={state}
            setState={setState}
            patientProfile={props.patientProfile}
          />
        ) : (
          <PatientFormsForm
            state={state}
            setState={setState}
            patientLabel={props.patientLabel}
            patientProfile={props.patientProfile}
          />
        )}
      </Dialog>
    </>
  );
};

export default PatientForms;
