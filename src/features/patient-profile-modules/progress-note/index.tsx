import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { PatientProgressNoteProps, PatientProgressNoteStateModel } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import styles from '../styles.module.scss';
import PatientProgressNoteHeader from './index-content/progress-note-header';
import PatientProgressNoteTable from './index-content/progress-note-table';
import PatientProgressNoteForm from './index-content/progress-note-form';
import PatientProgressNoteDeleteModal from './modal/modal';
import { HandleGetPatientProgressNoteItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';

export const PatientProgressNotes: FunctionComponent<PatientProgressNoteProps> = (
  props: PatientProgressNoteProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientProgressNoteStateModel>({
    patientId,
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
  });

  const loadProgressNotes = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientProgressNoteStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientProgressNoteStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientProgressNoteItems(
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
        toast.info('Progress notes have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientProgressNoteStateModel) => ({
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
      void loadProgressNotes(true, true, true);
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
      await loadProgressNotes(false, false);
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
      title: 'Reload progress notes',
      ariaLabel: 'Reload progress notes',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientProgressNoteStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientProgressNoteStateModel) => ({
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
              <PatientProgressNoteHeader
                state={state}
                setState={setState}
                onReload={handleReload}
              />
              <div className={styles.listItem}>
                <PatientProgressNoteTable state={state} setState={setState} />
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
          <PatientProgressNoteDeleteModal state={state} setState={setState} />
        ) : (
          <PatientProgressNoteForm
            state={state}
            setState={setState}
            patientLabel={props.patientLabel}
          />
        )}
      </Dialog>
    </>
  );
};

export default PatientProgressNotes;
