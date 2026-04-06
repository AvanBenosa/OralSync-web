import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import type {
  DentalImagesTab,
  PatientDentalPhotoProps,
  PatientDentalPhotoStateModel,
  PatientUploadStateModel,
} from './api/types';
import { HandleGetPatientDentalPhotoItems } from './api/handlers';
import { HandleGetPatientUploadItems } from './api/uploads-handlers';
import NotFoundPage from '../../../common/errors/page-not-found';
import sharedStyles from '../styles.module.scss';
import PatientDentalPhotoHeader from './index-content/photos-header';
import PatientDentalPhotoBody from './index-content/photos-body';
import PatientUploadsBody from './index-content/uploads-body';
import PatientUploadForm from './index-content/upload-form';
import PatientUploadDeleteModal from './index-content/upload-delete-modal';
import { toastConfig } from '../../../common/api/responses';

export const PatientDentalPhoto: FunctionComponent<PatientDentalPhotoProps> = (
  props: PatientDentalPhotoProps
): JSX.Element => {
  const { patientId, onRegisterMobileReload, patientLabel } = props;
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadActionRef = useRef<() => void>(() => {});
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<DentalImagesTab>('chart-images');

  const [state, setState] = useState<PatientDentalPhotoStateModel>({
    patientId,
    items: [],
    selectedItem: undefined,
    load: true,
  });

  const [uploadState, setUploadState] = useState<PatientUploadStateModel>({
    patientId,
    items: [],
    selectedItem: undefined,
    load: true,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });

  const loadPhotos = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
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
      void forceRefresh;
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

  const loadUploads = async (
    showToast: boolean = false,
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId) {
      setUploadState((prev: PatientUploadStateModel) => ({
        ...prev,
        load: false,
        items: [],
        selectedItem: undefined,
        notFound: true,
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setUploadState((prev: PatientUploadStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
      }));
    }

    try {
      await HandleGetPatientUploadItems(uploadState, setUploadState, patientId, forceRefresh);

      if (showToast) {
        toast.info('Upload list has been refreshed.', toastConfig);
      }
    } catch {
      setUploadState((prev: PatientUploadStateModel) => ({
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
      if (activeTab === 'uploads') {
        void loadUploads(true, true, true);
        return;
      }

      void loadPhotos(true, true, true);
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
    void Promise.allSettled([loadPhotos(false, false), loadUploads(false, false)]);

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
      disabled: activeTab === 'uploads' ? uploadState.load : state.load,
      title: activeTab === 'uploads' ? 'Reload uploads' : 'Reload photos',
      ariaLabel: activeTab === 'uploads' ? 'Reload uploads' : 'Reload photos',
    });
  }, [activeTab, onRegisterMobileReload, state.load, uploadState.load]);

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
              chartState={state}
              uploadState={uploadState}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onReload={handleReload}
              onAddUpload={() =>
                setUploadState((prev) => ({
                  ...prev,
                  openModal: true,
                  isUpdate: false,
                  isDelete: false,
                }))
              }
            />
            <div className={sharedStyles.listItem}>
              {activeTab === 'uploads' ? (
                <PatientUploadsBody
                  state={uploadState}
                  setState={setUploadState}
                  patientLabel={patientLabel}
                />
              ) : (
                <PatientDentalPhotoBody
                  state={state}
                  setState={setState}
                  onReload={handleReload}
                  patientLabel={patientLabel}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={uploadState.openModal}
        onClose={() =>
          setUploadState((prev) => ({
            ...prev,
            openModal: false,
            isUpdate: false,
            isDelete: false,
          }))
        }
        fullWidth
        maxWidth="sm"
      >
        {uploadState.isDelete ? (
          <PatientUploadDeleteModal state={uploadState} setState={setUploadState} />
        ) : (
          <PatientUploadForm
            state={uploadState}
            setState={setUploadState}
            patientLabel={patientLabel}
          />
        )}
      </Dialog>
    </section>
  );
};

export default PatientDentalPhoto;
