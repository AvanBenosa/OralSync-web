import { FunctionComponent, JSX } from 'react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Paper,
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

import TableLoadingSkeleton from '../../../../../common/components/TableLoadingSkeleton';
import AdminEmptyState from '../../../components/admin-empty-state';
import type { SubscriptionHistoryStateProps } from '../api/types';
import {
  formatSubscriptionHistoryAmount,
  formatSubscriptionHistoryDate,
  formatSubscriptionHistoryType,
} from '../utils';

const SubscriptionHistoryTable: FunctionComponent<SubscriptionHistoryStateProps> = (
  props: SubscriptionHistoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const items = state.items;
  const isLoading = state.load;
  const columnCount = isMobile ? 1 : 4;

  const renderActionButtons = (item: typeof state.items[number]): JSX.Element => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
      <button
        type="button"
        title="Edit history"
        aria-label="Edit history"
        onClick={(): void =>
          setState((prevState: typeof state) => ({
            ...prevState,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            openModal: true,
          }))
        }
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: '1px solid rgba(22,50,79,0.12)',
          backgroundColor: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <EditOutlinedIcon sx={{ fontSize: 18, color: '#24507a' }} />
      </button>
      <button
        type="button"
        title="Delete history"
        aria-label="Delete history"
        onClick={(): void =>
          setState((prevState: typeof state) => ({
            ...prevState,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            openModal: true,
          }))
        }
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: '1px solid rgba(198,40,40,0.16)',
          backgroundColor: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <DeleteOutlineOutlinedIcon sx={{ fontSize: 18, color: '#c62828' }} />
      </button>
    </Box>
  );

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '18px' }}>
      <Table stickyHeader aria-label="Clinic subscription history table">
        <TableHead>
          <TableRow>
            <TableCell>Payment Date</TableCell>
            {!isMobile ? (
              <>
                <TableCell>Subscription Type</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableLoadingSkeleton
              rowCount={isMobile ? 4 : 5}
              isMobile={isMobile}
              desktopCells={[
                { width: '36%' },
                { width: '32%' },
                { width: '26%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '60%',
                secondaryWidth: '48%',
                secondaryHeight: 18,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box>
                  <AdminEmptyState
                    title="No subscription history yet"
                    description="Add subscription payment records here so the admin team can track renewals and plan changes."
                  />
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow hover key={item.id || `subscription-history-${index}`}>
                <TableCell>
                  {isMobile ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                          {formatSubscriptionHistoryDate(item.paymentDate)}
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '0.84rem', mt: 0.35 }}>
                          {formatSubscriptionHistoryType(item.subscriptionType)} |{' '}
                          {formatSubscriptionHistoryAmount(item.totalAmount)}
                        </Typography>
                      </Box>
                      {renderActionButtons(item)}
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                      {formatSubscriptionHistoryDate(item.paymentDate)}
                    </Typography>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell>{formatSubscriptionHistoryType(item.subscriptionType)}</TableCell>
                    <TableCell>{formatSubscriptionHistoryAmount(item.totalAmount)}</TableCell>
                    <TableCell align="right">{renderActionButtons(item)}</TableCell>
                  </>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SubscriptionHistoryTable;
