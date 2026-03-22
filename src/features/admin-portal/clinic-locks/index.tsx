import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Alert, Box, Dialog } from '@mui/material';
import { toast } from 'react-toastify';

import { toastConfig } from '../../../common/api/responses';
import AdminPageShell from '../components/admin-page-shell';
import type { ClinicLockStateModel } from './api/types';
import { HandleGetClinicLockItems } from './api/handlers';
import ClinicLockHeader from './index-content/clinic-lock-header';
import ClinicLockTable from './index-content/clinic-lock-table';
import ClinicLockModal from './modal/modal';
import SubscriptionHistoryModule from './subscription-history';

const ClinicLockModule: FunctionComponent = (): JSX.Element => {
  const [state, setState] = useState<ClinicLockStateModel>({
    items: [],
    load: true,
    error: '',
    openModal: false,
    isUpdate: false,
    isHistory: false,
  });
  const lastLoadedRef = useRef(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClinics = async (forceRefresh: boolean = false): Promise<void> => {
    if (forceRefresh) {
      setState((prev) => ({
        ...prev,
        load: true,
      }));
    }

    try {
      await HandleGetClinicLockItems(setState, forceRefresh);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load clinic lock controls.',
      }));
    }
  };

  useEffect(() => {
    if (lastLoadedRef.current) {
      return;
    }

    lastLoadedRef.current = true;
    void loadClinics(false);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      toast.info('Clinic lock data has been refreshed.', toastConfig);
      void loadClinics(true);
    }, 250);
  };

  const handleCloseDialog = (): void => {
    setState((prevState) => ({
      ...prevState,
      openModal: false,
    }));
  };

  return (
    <AdminPageShell
      title="Clinic Lock Controls"
      description="Lock or unlock clinic workspaces from the admin portal."
      loading={state.load}
    >
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <ClinicLockHeader state={state} setState={setState} onReload={handleReload} />

      <Box>
        <ClinicLockTable state={state} setState={setState} />
      </Box>

      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{
          onExited: () => {
            setState((prevState) => ({
              ...prevState,
              isUpdate: false,
              isHistory: false,
              selectedItem: undefined,
            }));
          },
        }}
        fullWidth
        maxWidth={state.isHistory ? 'lg' : 'sm'}
      >
        {state.isHistory ? (
          <SubscriptionHistoryModule
            clinic={state.selectedItem || null}
            onClose={handleCloseDialog}
          />
        ) : (
          <ClinicLockModal state={state} setState={setState} />
        )}
      </Dialog>
    </AdminPageShell>
  );
};

export default ClinicLockModule;
