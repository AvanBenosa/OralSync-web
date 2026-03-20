import { FunctionComponent, JSX } from 'react';
import { Box, Typography } from '@mui/material';

type AdminEmptyStateProps = {
  title: string;
  description: string;
};

const AdminEmptyState: FunctionComponent<AdminEmptyStateProps> = ({
  title,
  description,
}): JSX.Element => {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        border: '1px dashed rgba(22,50,79,0.18)',
        borderRadius: 4,
        background: 'linear-gradient(180deg, rgba(248,251,253,0.95), rgba(239,245,249,0.98))',
      }}
    >
      <Typography sx={{ fontWeight: 800, color: '#17344f', fontSize: '1.1rem' }}>{title}</Typography>
      <Typography sx={{ mt: 1, color: '#6a8094', maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
        {description}
      </Typography>
    </Box>
  );
};

export default AdminEmptyState;
