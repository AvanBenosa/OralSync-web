import { FunctionComponent, JSX } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { resolveProtectedApiAssetUrl } from '../../../../../common/services/api-client';
import TableLoadingSkeleton from '../../../../../common/components/TableLoadingSkeleton';
import AdminEmptyState from '../../../components/admin-empty-state';
import type { ManualPaymentRecordsStateProps } from '../api/types';
import {
  formatManualPaymentAmount,
  formatManualPaymentDate,
  formatManualPaymentStatus,
} from '../utils';

const ManualPaymentRecordsTable: FunctionComponent<ManualPaymentRecordsStateProps> = ({
  state,
  setState,
}): JSX.Element => {
  const { items, load } = state;

  const openProof = (proofImageUrl?: string): void => {
    const resolvedUrl = resolveProtectedApiAssetUrl(proofImageUrl);
    if (!resolvedUrl) {
      return;
    }

    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '18px' }}>
      <Table stickyHeader aria-label="Clinic manual payment records table">
        <TableHead>
          <TableRow>
            <TableCell>Submitted At</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payer</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {load ? (
            <TableLoadingSkeleton
              rowCount={5}
              desktopCells={[
                { width: '24%' },
                { width: '18%' },
                { width: '16%' },
                { width: '22%' },
                { width: '16%' },
                { kind: 'actions', align: 'right', itemCount: 2 },
              ]}
            />
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <AdminEmptyState
                  title="No manual payments yet"
                  description="Submitted manual payment proofs for this clinic will appear here."
                />
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow hover key={item.id || `manual-payment-${index}`}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                    {formatManualPaymentDate(item.submittedAt)}
                  </Typography>
                  <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                    Ref: {item.referenceNumber || '--'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                    {item.subscriptionType || '--'}
                  </Typography>
                  <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                    {item.subscriptionMonths ? `${item.subscriptionMonths} month(s)` : '--'}
                  </Typography>
                </TableCell>
                <TableCell>{formatManualPaymentAmount(item.amount)}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                    {item.senderName || '--'}
                  </Typography>
                  <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                    {item.paymentMethod || '--'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                    {formatManualPaymentStatus(item.status)}
                  </Typography>
                  <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                    {item.verifiedAt
                      ? `Verified ${formatManualPaymentDate(item.verifiedAt)}`
                      : '--'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<OpenInNewRoundedIcon />}
                      onClick={() => openProof(item.proofImageUrl)}
                      disabled={!item.proofImageUrl}
                    >
                      Proof
                    </Button>
                    <button
                      type="button"
                      title="Update manual payment"
                      aria-label="Update manual payment"
                      onClick={(): void =>
                        setState((prev: typeof state) => ({
                          ...prev,
                          selectedItem: item,
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
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ManualPaymentRecordsTable;
