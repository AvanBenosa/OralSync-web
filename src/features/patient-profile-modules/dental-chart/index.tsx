import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';
import 'react-odontogram/style.css';

import { PatientDentalChartProps, PatientDentalChartStateModel } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import sharedStyles from '../styles.module.scss';
import PatientDentalChartHeader from './index-content/dental-chart-header';
import PatientDentalChartTable from './index-content/dental-chart-table';
import PatientDentalChartForm from './index-content/dental-chart-form';
import PatientDentalChartDeleteModal from './modal/modal';
import { HandleGetPatientDentalChartItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';

export const PatientDentalChart: FunctionComponent<PatientDentalChartProps> = (
  props: PatientDentalChartProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientDentalChartStateModel>({
    patientId,
    load: true,
    items: [],
    chartLayout: 'square',
    circleHalf: 'full',
    circleZoom: 0.6,
    openModal: false,
    isDelete: false,
    isUpdate: false,
    selectedToothId: undefined,
  });

  const loadDentalChart = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId || Number.isNaN(patientId)) {
      setState((prev: PatientDentalChartStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientDentalChartStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientDentalChartItems(
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
        toast.info('Dental chart has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientDentalChartStateModel) => ({
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
      void loadDentalChart(true, true, true);
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

    void loadDentalChart(false, false);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    onRegisterMobileReload?.({
      onReload: () => reloadActionRef.current(),
      disabled: state.load,
      title: 'Reload dental chart',
      ariaLabel: 'Reload dental chart',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientDentalChartStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientDentalChartStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
      selectedToothId: undefined,
    }));
  };

  if (state.notFound) {
    return <NotFoundPage />;
  }

  return (
    <>
      <section className={sharedStyles.rightColumn}>
        <div className={sharedStyles.wrapper}>
          <div className={sharedStyles.bodyWrapper}>
            <div className={sharedStyles.listContainer}>
              <PatientDentalChartHeader
                state={state}
                setState={setState}
                onReload={handleReload}
                patientLabel={props.patientLabel}
                patientProfile={props.patientProfile}
              />
              <div className={sharedStyles.listItem}>
                <PatientDentalChartTable
                  state={state}
                  setState={setState}
                  patientLabel={props.patientLabel}
                  patientProfile={props.patientProfile}
                />
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
          <PatientDentalChartDeleteModal
            state={state}
            setState={setState}
            patientProfile={props.patientProfile}
          />
        ) : (
          <PatientDentalChartForm
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

export default PatientDentalChart;
