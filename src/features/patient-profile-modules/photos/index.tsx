import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import type { PatientDentalPhotoProps, PatientDentalPhotoStateModel } from './api/types';
import { HandleGetPatientDentalPhotoItems } from './api/handlers';
import NotFoundPage from '../../../common/errors/page-not-found';
import sharedStyles from '../styles.module.scss';
import PatientDentalPhotoHeader from './index-content/photos-header';
import PatientDentalPhotoBody from './index-content/photos-body';
import { toastConfig } from '../../../common/api/responses';

export const PatientDentalPhoto: FunctionComponent<PatientDentalPhotoProps> = (
  props: PatientDentalPhotoProps
): JSX.Element => {
  const { patientId, onRegisterMobileReload, patientLabel } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);

  const [state, setState] = useState<PatientDentalPhotoStateModel>({
    patientId,
    items: [],
    selectedItem: undefined,
    load: true,
  });

  const loadPhotos = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true
  ): Promise<void> => {
    if (!patientId) {
      setState((prev: PatientDentalPhotoStateModel) => ({
        ...prev,
        load: false,
        items: [],
        selectedItem: undefined,
        notFound: true,
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientDentalPhotoStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientDentalPhotoItems(state, setState, patientId);

      if (showToast) {
        toast.info('Photo list has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: PatientDentalPhotoStateModel) => ({
        ...prev,
        load: false,
        items: [],
        selectedItem: undefined,
      }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadPhotos(true, true);
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
    void loadPhotos(false, false);

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
      title: 'Reload photos',
      ariaLabel: 'Reload photos',
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
    <section className={sharedStyles.rightColumn}>
      <div className={sharedStyles.wrapper}>
        <div className={sharedStyles.bodyWrapper}>
          <div className={sharedStyles.listContainer}>
            <PatientDentalPhotoHeader
              state={state}
              setState={setState}
              onReload={handleReload}
              patientLabel={patientLabel}
            />
            <div className={sharedStyles.listItem}>
              <PatientDentalPhotoBody
                state={state}
                setState={setState}
                onReload={handleReload}
                patientLabel={patientLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientDentalPhoto;
