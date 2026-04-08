import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { toast } from 'react-toastify';
import { toastConfig } from '../../../../common/api/responses';
import type { ManualPaymentRecordsModuleProps, ManualPaymentRecordsStateModel } from './api/types';
import { HandleGetClinicManualPaymentItems } from './api/handlers';
import ManualPaymentRecordsHeader from './index-content/manual-payment-records-header';
import ManualPaymentRecordsTable from './index-content/manual-payment-records-table';
import ManualPaymentStatusModal from './modal/status-modal';

const ManualPaymentRecordsModule: FunctionComponent<ManualPaymentRecordsModuleProps> = ({
  clinic,
  onClose,
}): JSX.Element => {
  const [state, setState] = useState<ManualPaymentRecordsStateModel>({
    clinic,
    items: [],
    load: true,
    error: '',
    openModal: false,
  });
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadItems = async (
    showToast: boolean = false,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!clinic?.id) {
      setState((prev) => ({
        ...prev,
        clinic,
        load: false,
        error: 'Clinic was not found.',
        items: [],
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      clinic,
      load: true,
      error: '',
    }));

    try {
      await HandleGetClinicManualPaymentItems(setState, clinic.id, forceRefresh);
      if (showToast) {
        toast.info('Manual payment records have been refreshed.', toastConfig);
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load manual payment records.',
      }));
    }
  };

  useEffect(() => {
    void loadItems(false, false);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic?.id]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      clinic,
    }));
  }, [clinic]);

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadItems(true, true);
    }, 250);
  };

  const handleCloseDialog = (): void => {
    setState((prev) => ({
      ...prev,
      openModal: false,
    }));
  };

  return (
    <>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Manual Payment Records {clinic?.clinicName ? `- ${clinic.clinicName}` : ''}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {state.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        ) : null}

        <ManualPaymentRecordsHeader state={state} setState={setState} onReload={handleReload} />

        <Box>
          <ManualPaymentRecordsTable state={state} setState={setState} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>

      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{
          onExited: () => {
            setState((prev) => ({
              ...prev,
              selectedItem: undefined,
            }));
          },
        }}
        fullWidth
        maxWidth="sm"
      >
        <ManualPaymentStatusModal state={state} setState={setState} />
      </Dialog>
    </>
  );
};

export default ManualPaymentRecordsModule;
