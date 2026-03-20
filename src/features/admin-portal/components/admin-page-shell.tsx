import { FunctionComponent, JSX, ReactNode } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

type AdminPageShellProps = {
  title: string;
  description: string;
  loading: boolean;
  onReload?: () => void;
  children: ReactNode;
};

const AdminPageShell: FunctionComponent<AdminPageShellProps> = ({
  title,
  description,
  loading,
  onReload,
  children,
}): JSX.Element => {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
          flexWrap: 'nowrap',
        }}
      >
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
              fontWeight: 800,
              color: '#16324f',
              mb: 0.5,
              lineHeight: 1.15,
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: '#60768b', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
            {description}
          </Typography>
        </Box>
        {onReload ? (
          <Button
            variant="contained"
            onClick={onReload}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              width: { xs: '100%', sm: 'auto' },
              minWidth: 0,
              alignSelf: { xs: 'stretch', sm: 'center' },
            }}
          >
            Reload
          </Button>
        ) : null}
      </Box>

      <Paper
        sx={{
          p: { xs: 1.25, sm: 2, md: 3 },
          borderRadius: { xs: 3, sm: 4 },
          border: '1px solid rgba(22,50,79,0.08)',
          boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};

export default AdminPageShell;
