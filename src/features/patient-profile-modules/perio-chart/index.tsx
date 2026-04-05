import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { PatientPerioChartProps, PatientPerioChartStateModel } from './api/types';
import NotFoundPage from '../../../common/errors/page-not-found';
import sharedStyles from '../styles.module.scss';
import PatientPerioChartHeader from './index-content/perio-chart-header';
import PatientPerioChartForm from './index-content/perio-chart-form';
import PatientPerioChartDeleteModal from './modal/modal';
import { HandleGetPatientPerioChartItems } from './api/handlers';
import { toastConfig } from '../../../common/api/responses';

export const PatientPerioChart: FunctionComponent<PatientPerioChartProps> = (
  props: PatientPerioChartProps
): JSX.Element => {
  const { onRegisterMobileReload } = props;
  const { patientId: patientIdParam } = useParams();
  const patientId = patientIdParam?.trim() || undefined;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientPerioChartStateModel>({
    patientId,
    load: true,
    items: [],
    chartLayout: 'square',
    circleHalf: 'upper',
    circleZoom: 0.82,
    openModal: false,
    isDelete: false,
    isUpdate: false,
    selectedToothId: undefined,
  });

  const loadPerioChart = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId?.trim()) {
      setState((prev: PatientPerioChartStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        items: [],
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientPerioChartStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientPerioChartItems(
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
        toast.info('Perio chart has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientPerioChartStateModel) => ({
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
      void loadPerioChart(true, true, true);
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

    void loadPerioChart(false, false);

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
      title: 'Reload perio chart',
      ariaLabel: 'Reload perio chart',
    });
  }, [onRegisterMobileReload, state.load]);

  useEffect(() => {
    return () => {
      onRegisterMobileReload?.(undefined);
    };
  }, [onRegisterMobileReload]);

  if (state.notFound) {
    return <NotFoundPage />;
  }

  return (
    <>
      <section className={sharedStyles.rightColumn}>
        <div className={sharedStyles.wrapper}>
          <div className={sharedStyles.bodyWrapper}>
            <div className={sharedStyles.listContainer}>
              <PatientPerioChartHeader state={state} setState={setState} onReload={handleReload} />
              <div className={sharedStyles.listItem}>
                <PatientPerioChartForm
                  state={state}
                  setState={setState}
                  patientProfile={props.patientProfile}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Dialog
        open={state.isDelete}
        onClose={() => {
          setState((prev: PatientPerioChartStateModel) => ({
            ...prev,
            isDelete: false,
          }));
        }}
        fullWidth
        maxWidth="sm"
      >
        <PatientPerioChartDeleteModal
          state={state}
          setState={setState}
          patientProfile={props.patientProfile}
        />
      </Dialog>
    </>
  );
};

export default PatientPerioChart;
