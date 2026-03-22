import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Chip, IconButton, Typography } from '@mui/material';

import type { SubscriptionHistoryStateProps } from '../api/types';

const SubscriptionHistoryHeader: FunctionComponent<SubscriptionHistoryStateProps> = (
  props: SubscriptionHistoryStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const clinicName = state.clinic?.clinicName || 'Selected clinic';
  const recordCount = state.items.length;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 2,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: '1px solid rgba(22,50,79,0.08)',
        background:
          'linear-gradient(180deg, rgba(248,251,255,0.98) 0%, rgba(241,247,253,0.98) 100%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#eaf2fb',
            color: '#285c8c',
            flex: '0 0 auto',
          }}
        >
          <HistoryRoundedIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#17344f' }}>
              Subscription History
            </Typography>
            <Chip
              label={`${recordCount} ${recordCount === 1 ? 'record' : 'records'}`}
              size="small"
              sx={{
                bgcolor: '#edf5fc',
                color: '#32526f',
                fontWeight: 700,
                border: '1px solid rgba(80,115,145,0.12)',
              }}
            />
          </Box>
          <Typography sx={{ color: '#6b8196', fontSize: '0.92rem', mt: 0.45 }}>
            Review and manage payment history for {clinicName || 'this clinic'}.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={(): void => {
            onReload?.();
          }}
          disabled={state.load}
          sx={{
            width: 42,
            height: 42,
            border: '1px solid rgba(22,50,79,0.1)',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
          }}
        >
          <RefreshRoundedIcon sx={{ color: '#24507a' }} />
        </IconButton>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={(): void =>
            setState((prevState: typeof state) => ({
              ...prevState,
              selectedItem: undefined,
              isUpdate: false,
              isDelete: false,
              openModal: true,
            }))
          }
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            width: { xs: '100%', md: 'auto' },
            alignSelf: { xs: 'stretch', md: 'center' },
          }}
        >
          Add History
        </Button>
      </Box>
    </Box>
  );
};

export default SubscriptionHistoryHeader;
