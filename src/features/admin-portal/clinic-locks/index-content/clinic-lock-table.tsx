import { FunctionComponent, JSX } from 'react';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import AdminEmptyState from '../../components/admin-empty-state';
import type { AdminClinicModel } from '../../api/types';
import type { ClinicLockStateProps } from '../api/types';
import {
  formatClinicSubscriptionType,
  formatClinicValidityDate,
  getClinicContactValue,
} from '../utils';

const getStatusLabel = (item: AdminClinicModel): string => (item.isLocked ? 'Locked' : 'Active');

const getStatusColor = (item: AdminClinicModel): string => (item.isLocked ? '#c62828' : '#156c43');

const MobileLoadingState = (): JSX.Element => (
  <Grid container spacing={1.25}>
    {Array.from({ length: 3 }, (_, index) => (
      <Grid size={{ xs: 12 }} key={`clinic-lock-mobile-skeleton-${index}`}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(22,50,79,0.08)',
            backgroundColor: '#fbfdff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Skeleton variant="text" width="48%" height={30} sx={{ transform: 'none' }} />
              <Skeleton variant="text" width="38%" height={20} sx={{ transform: 'none' }} />
            </Box>
            <Skeleton variant="rounded" width={34} height={34} />
          </Box>
          <Box
            sx={{
              mt: 1.25,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            {Array.from({ length: 4 }, (_, rowIndex) => (
              <Box key={`clinic-lock-mobile-field-${index}-${rowIndex}`}>
                <Skeleton variant="text" width="55%" height={18} sx={{ transform: 'none' }} />
                <Skeleton variant="text" width="72%" height={24} sx={{ transform: 'none' }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
    ))}
  </Grid>
);

const ClinicLockTable: FunctionComponent<ClinicLockStateProps> = (
  props: ClinicLockStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const items = state.items;
  const isLoading = state.load;

  if (isLoading && items.length === 0) {
    if (isMobile) {
      return <MobileLoadingState />;
    }

    return (
      <TableContainer component={Paper} elevation={0}>
        <Table aria-label="Clinic lock controls table">
          <TableHead>
            <TableRow>
              <TableCell>Clinic</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Subscription Type</TableCell>
              <TableCell>Validity Date</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableLoadingSkeleton
              rowCount={5}
              desktopCells={[
                { width: '76%' },
                { width: '72%' },
                { width: '58%' },
                { width: '52%' },
                { width: '46%' },
                { kind: 'actions', align: 'right', itemCount: 3 },
              ]}
            />
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="No clinics available"
        description="Connect this page to the admin clinics endpoint to manage clinic lock status."
      />
    );
  }

  if (isMobile) {
    return (
      <Grid container spacing={1.25}>
        {items.map((item, index) => (
          <Grid size={{ xs: 12 }} key={item.id || `${item.clinicName || 'clinic'}-${index}`}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(22,50,79,0.08)',
                backgroundColor: '#fbfdff',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                    {item.clinicName || '--'}
                  </Typography>
                  <Typography sx={{ color: '#6a8094', fontSize: '0.82rem', mt: 0.35 }}>
                    {item.ownerName || '--'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: false,
                        isHistory: true,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 34,
                      height: 34,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <HistoryRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: false,
                        isHistory: false,
                        isManualPayments: true,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 34,
                      height: 34,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: true,
                        isHistory: false,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 34,
                      height: 34,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={1.25} sx={{ mt: 0.6 }}>
                <Grid size={{ xs: 12 }}>
                  <Typography
                    sx={{
                      color: '#70869a',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Contact
                  </Typography>
                  <Typography
                    sx={{ color: '#17344f', fontSize: '0.9rem', wordBreak: 'break-word' }}
                  >
                    {getClinicContactValue(item)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    sx={{
                      color: '#70869a',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Subscription
                  </Typography>
                  <Typography sx={{ color: '#17344f', fontSize: '0.9rem' }}>
                    {formatClinicSubscriptionType(item.subscriptionType)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    sx={{
                      color: '#70869a',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Validity Date
                  </Typography>
                  <Typography sx={{ color: '#17344f', fontSize: '0.9rem' }}>
                    {formatClinicValidityDate(item.validityDate)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography
                    sx={{
                      color: '#70869a',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      mb: 0.2,
                    }}
                  >
                    Current Status
                  </Typography>
                  <Typography sx={{ color: getStatusColor(item), fontWeight: 800 }}>
                    {getStatusLabel(item)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: '18px',
        border: '1px solid rgba(22,50,79,0.08)',
      }}
    >
      <Table aria-label="Clinic lock controls table">
        <TableHead>
          <TableRow>
            <TableCell>Clinic</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Subscription Type</TableCell>
            <TableCell>Validity Date</TableCell>
            <TableCell>Current Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id || `${item.clinicName || 'clinic'}-${index}`}>
              <TableCell>
                <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                  {item.clinicName || '--'}
                </Typography>
                <Typography sx={{ color: '#6a8094', fontSize: '0.85rem' }}>
                  {item.ownerName || '--'}
                </Typography>
              </TableCell>
              <TableCell>{getClinicContactValue(item)}</TableCell>
              <TableCell>{formatClinicSubscriptionType(item.subscriptionType)}</TableCell>
              <TableCell>{formatClinicValidityDate(item.validityDate)}</TableCell>
              <TableCell>
                <Typography sx={{ color: getStatusColor(item), fontWeight: 800 }}>
                  {getStatusLabel(item)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: false,
                        isHistory: true,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <HistoryRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: false,
                        isHistory: false,
                        isManualPayments: true,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setState((prevState: typeof state) => ({
                        ...prevState,
                        selectedItem: item,
                        isUpdate: true,
                        isHistory: false,
                        openModal: true,
                      }));
                    }}
                    disabled={!item.id}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ClinicLockTable;
