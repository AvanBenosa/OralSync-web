import { FunctionComponent, JSX } from 'react';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import { Box, CircularProgress, SxProps, Theme, Typography } from '@mui/material';

export const reportMetricCardSx: SxProps<Theme> = {
  flex: {
    xs: '1 1 100%',
    sm: '1 1 200px',
  },
  minWidth: {
    xs: '100%',
    sm: 180,
  },
  borderRadius: '18px',
  border: '1px solid rgba(194, 208, 220, 0.92)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 248, 252, 0.98))',
  boxShadow: '0 16px 30px rgba(24, 50, 79, 0.08)',
};

export const reportPanelCardSx: SxProps<Theme> = {
  borderRadius: '20px',
  border: '1px solid rgba(194, 208, 220, 0.92)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 252, 0.99))',
  boxShadow: '0 18px 34px rgba(24, 50, 79, 0.08)',
};

export const reportMetricIconWrapSx: SxProps<Theme> = {
  width: 38,
  height: 38,
  borderRadius: '14px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, #eef6fc 0%, #dceaf6 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
  flex: '0 0 auto',
};

export const reportSectionTitleSx: SxProps<Theme> = {
  color: '#173e67',
  fontSize: '1rem',
  fontWeight: 800,
  letterSpacing: '-0.01em',
};

export const reportTableContainerSx: SxProps<Theme> = {
  border: '1px solid rgba(206, 218, 229, 0.95)',
  borderRadius: '18px',
  background: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 12px 24px rgba(36, 60, 91, 0.05)',
  overflow: 'hidden',
  '& .MuiTableHead-root .MuiTableCell-root': {
    borderBottom: '1px solid rgba(220, 228, 236, 0.95)',
    background: 'linear-gradient(180deg, #f9fbfd 0%, #eef4f8 100%)',
  },
  '& .MuiTableBody-root .MuiTableRow-root:hover': {
    background: 'rgba(236, 244, 251, 0.65)',
  },
  '& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root': {
    borderBottom: 0,
  },
};

export const reportTableHeaderCellSx: SxProps<Theme> = {
  color: '#25486c',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  py: 1.75,
};

export const reportTableBodyCellSx: SxProps<Theme> = {
  color: '#314a63',
  fontSize: 13,
  fontWeight: 500,
  py: 1.5,
  borderBottom: '1px solid rgba(230, 236, 242, 0.92)',
};

export const reportFilterChipSx = (active: boolean): SxProps<Theme> => ({
  fontWeight: 700,
  fontSize: 12,
  borderRadius: '12px',
  height: 34,
  borderColor: active ? '#284c8f' : 'rgba(184, 205, 223, 0.94)',
  color: active ? '#ffffff' : '#355b80',
  background: active
    ? 'linear-gradient(180deg, #2d58a6 0%, #1f4385 100%)'
    : 'rgba(240, 246, 251, 0.95)',
  boxShadow: active ? '0 10px 20px rgba(39, 78, 152, 0.18)' : 'none',
  '& .MuiChip-label': {
    px: 1.6,
  },
});

export const formatCurrency = (value: number): string =>
  `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type PlaceholderProps = {
  label: string;
  minHeight?: number;
};

export const ReportsLoadingPlaceholder: FunctionComponent<{ minHeight?: number }> = ({
  minHeight = 140,
}): JSX.Element => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={minHeight}>
    <CircularProgress size={28} sx={{ color: '#2f6db3' }} />
  </Box>
);

export const ReportsEmptyState: FunctionComponent<PlaceholderProps> = ({
  label,
  minHeight = 120,
}): JSX.Element => (
  <Box
    minHeight={minHeight}
    display="flex"
    alignItems="center"
    justifyContent="center"
    sx={{
      border: '1px dashed rgba(191, 207, 221, 0.95)',
      borderRadius: '18px',
      background: 'linear-gradient(180deg, rgba(248, 251, 253, 0.98), rgba(240, 246, 250, 0.98))',
      px: 3,
      py: 4,
      textAlign: 'center',
    }}
  >
    <Box maxWidth={360}>
      <Box
        sx={{
          width: 54,
          height: 54,
          mx: 'auto',
          mb: 1.5,
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #ebf4fb 0%, #d7e7f4 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <AssessmentRoundedIcon sx={{ color: '#5f8db9', fontSize: 28 }} />
      </Box>
      <Typography
        sx={{
          color: '#73869b',
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);
