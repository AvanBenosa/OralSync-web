import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { toast } from 'react-toastify';

import { toastConfig } from '../../../../common/api/responses';
import SubscriptionHistoryForm from './index-content/subscription-history-form';
import SubscriptionHistoryHeader from './index-content/subscription-history-header';
import SubscriptionHistoryTable from './index-content/subscription-history-table';
import SubscriptionHistoryDeleteModal from './modal/delete-modal';
import type { SubscriptionHistoryModuleProps, SubscriptionHistoryStateModel } from './api/types';
import { HandleGetClinicSubscriptionHistoryItems } from './api/handlers';

const SubscriptionHistoryModule: FunctionComponent<SubscriptionHistoryModuleProps> = (
  props: SubscriptionHistoryModuleProps
): JSX.Element => {
  const { clinic, onClose } = props;
  const [state, setState] = useState<SubscriptionHistoryStateModel>({
    clinic,
    items: [],
    load: true,
    error: '',
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadItems = async (
    showToast: boolean = false,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!clinic?.id) {
      setState((prevState) => ({
        ...prevState,
        clinic,
        load: false,
        error: 'Clinic was not found.',
        items: [],
      }));
      return;
    }

    setState((prevState) => ({
      ...prevState,
      clinic,
      load: true,
      error: '',
    }));

    try {
      await HandleGetClinicSubscriptionHistoryItems(setState, clinic.id, forceRefresh);

      if (showToast) {
        toast.info('Subscription history has been refreshed.', toastConfig);
      }
    } catch (error: any) {
      setState((prevState) => ({
        ...prevState,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load subscription history.',
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
    // Load when the selected clinic changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic?.id]);

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
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
    setState((prevState) => ({
      ...prevState,
      openModal: false,
    }));
  };

  return (
    <>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Subscription History {clinic?.clinicName ? `- ${clinic.clinicName}` : ''}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {state.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        ) : null}

        <SubscriptionHistoryHeader state={state} setState={setState} onReload={handleReload} />

        <Box>
          <SubscriptionHistoryTable state={state} setState={setState} />
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
            setState((prevState) => ({
              ...prevState,
              isUpdate: false,
              isDelete: false,
              selectedItem: undefined,
            }));
          },
        }}
        fullWidth
        maxWidth="sm"
      >
        {state.isDelete ? (
          <SubscriptionHistoryDeleteModal state={state} setState={setState} />
        ) : (
          <SubscriptionHistoryForm state={state} setState={setState} />
        )}
      </Dialog>
    </>
  );
};

export default SubscriptionHistoryModule;
