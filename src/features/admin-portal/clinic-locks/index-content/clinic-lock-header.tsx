import { FunctionComponent, JSX } from 'react';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';

import type { ClinicLockStateProps } from '../api/types';

const ClinicLockHeader: FunctionComponent<ClinicLockStateProps> = (
  props: ClinicLockStateProps
): JSX.Element => {
  const { state, onReload } = props;
  const clinicCount = state.items.length;
  const isLoading = state.load;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 2.5,
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
            width: 44,
            height: 44,
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#eaf2fb',
            color: '#285c8c',
            flex: '0 0 auto',
          }}
        >
          <ApartmentRoundedIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#17344f' }}>
              Clinic Access Overview
            </Typography>
            <Chip
              label={`${clinicCount} ${clinicCount === 1 ? 'clinic' : 'clinics'}`}
              size="small"
              sx={{
                bgcolor: '#edf5fc',
                color: '#32526f',
                fontWeight: 700,
                border: '1px solid rgba(80,115,145,0.12)',
              }}
            />
          </Box>
          <Typography sx={{ color: '#6b8196', fontSize: '0.92rem', mt: 0.5 }}>
            Review subscription type, validity date, and workspace access for each clinic.
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        onClick={onReload}
        startIcon={
          isLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />
        }
        disabled={isLoading}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 700,
          width: { xs: '100%', md: 'auto' },
          minWidth: { md: 132 },
          alignSelf: { xs: 'stretch', md: 'center' },
        }}
      >
        Reload
      </Button>
    </Box>
  );
};

export default ClinicLockHeader;
