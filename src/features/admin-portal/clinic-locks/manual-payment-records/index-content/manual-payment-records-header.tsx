import { FunctionComponent, JSX } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Typography } from '@mui/material';
import type { ManualPaymentRecordsStateProps } from '../api/types';

const ManualPaymentRecordsHeader: FunctionComponent<ManualPaymentRecordsStateProps> = ({
  state,
  onReload,
}): JSX.Element => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 800, color: '#17344f' }}>Manual Payment Records</Typography>
        <Typography sx={{ color: '#647b90', fontSize: '0.92rem', mt: 0.35 }}>
          Review submitted proofs and update verification status for{' '}
          {state.clinic?.clinicName || 'this clinic'}.
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<RefreshRoundedIcon />}
        onClick={onReload}
        disabled={state.load}
      >
        Refresh
      </Button>
    </Box>
  );
};

export default ManualPaymentRecordsHeader;
