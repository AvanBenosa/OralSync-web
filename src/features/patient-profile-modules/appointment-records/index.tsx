import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import {
  PatientAppointmentRecordProps,
  PatientAppointmentRecordStateModel,
} from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import styles from '../styles.module.scss';
import PatientAppointmentRecordsHeader from './index-content/appointment-records-header';
import PatientAppointmentRecordsTable from './index-content/appointment-records-table';
import PatientAppointmentRecordsForm from './index-content/appointment-records-form';
import PatientAppointmentRecordsDeleteModal from './modal/modal';
import { HandleGetPatientAppointmentRecordItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';

export const PatientAppointmentRecords: FunctionComponent<PatientAppointmentRecordProps> = (
  props: PatientAppointmentRecordProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientAppointmentRecordStateModel>({
    patientId,
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
  });

  const loadAppointmentRecords = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientAppointmentRecordStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientAppointmentRecordStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientAppointmentRecordItems(
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
        toast.info('Appointment records have been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientAppointmentRecordStateModel) => ({
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
      void loadAppointmentRecords(true, true, true);
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
      await loadAppointmentRecords(false, false);
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
      title: 'Reload appointment records',
      ariaLabel: 'Reload appointment records',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientAppointmentRecordStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientAppointmentRecordStateModel) => ({
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
              <PatientAppointmentRecordsHeader
                state={state}
                setState={setState}
                onReload={handleReload}
              />
              <div className={styles.listItem}>
                <PatientAppointmentRecordsTable state={state} setState={setState} />
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
          <PatientAppointmentRecordsDeleteModal state={state} setState={setState} />
        ) : (
          <PatientAppointmentRecordsForm
            state={state}
            setState={setState}
            patientLabel={props.patientLabel}
          />
        )}
      </Dialog>
    </>
  );
};

export default PatientAppointmentRecords;
