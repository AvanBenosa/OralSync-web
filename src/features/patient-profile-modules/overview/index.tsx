import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { PatientOverViewStateModel, PatientProfileProps } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import styles from '../styles.module.scss';
import OverViewHeader from './index-content/overview-header';
import OverViewTable from './index-content/overview-table';
// import OverViewForm from './index-content/overview-form';
// import OverViewDeleteModal from './modal/modal';
import { HandleGetPatientOverViewItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';
export const PatientOverView: FunctionComponent<PatientProfileProps> = (
  props: PatientProfileProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientOverViewStateModel>({
    patientId: patientId,
    load: true,
    items: [],
    openModal: false,
    isDelete: false,
    isUpdate: false,
  });

  const loadOverview = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientOverViewStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientOverViewStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientOverViewItems(
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
        toast.info('Overview data has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientOverViewStateModel) => ({
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
      void loadOverview(true, true, true);
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
      await loadOverview(false, false);
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
      title: 'Reload overview',
      ariaLabel: 'Reload overview',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  // const handleCloseDialog = (): void => {
  //   setState((prev: PatientOverViewStateModel) => ({
  //     ...prev,
  //     openModal: false,
  //   }));
  // };

  // const handleDialogExited = (): void => {
  //   setState((prev: PatientOverViewStateModel) => ({
  //     ...prev,
  //     isUpdate: false,
  //     isDelete: false,
  //     selectedItem: undefined,
  //   }));
  // };

  if (state.notFound) {
    return <NotFoundPage />;
  }

  return (
    <>
      <section className={styles.rightColumn}>
        <div className={styles.wrapper}>
          <div className={styles.bodyWrapper}>
            <div className={styles.listContainer}>
              <OverViewHeader state={state} setState={setState} onReload={handleReload} />
              <div className={styles.listItem}>
                <OverViewTable state={state} setState={setState} />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{ onExited: handleDialogExited }}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <OverViewDeleteModal state={state} setState={setState} />
        ) : (
          <OverViewForm state={state} setState={setState} />
        )}
      </Dialog> */}
    </>
  );
};

export default PatientOverView;
