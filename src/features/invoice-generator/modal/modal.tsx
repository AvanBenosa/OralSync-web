import { FunctionComponent, JSX } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import FormatCurrency from '../../../common/helpers/formatCurrency';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';
import type { InvoiceGeneratorModalProps } from '../api/types';

const InvoiceGeneratorModal: FunctionComponent<InvoiceGeneratorModalProps> = (
  props: InvoiceGeneratorModalProps
): JSX.Element => {
  const { onClose, patientName, patientNumber, filterDate, items, summary } = props;

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>Invoice Preview</DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ color: '#6a8197', fontSize: 12, fontWeight: 800 }}>
              Patient
            </Typography>
            <Typography sx={{ color: '#17344f', fontSize: 16, fontWeight: 800 }}>
              {patientName || '--'}
            </Typography>
            <Typography sx={{ color: '#6f8297', mt: 0.5 }}>
              Patient No.: {patientNumber || '--'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ color: '#6a8197', fontSize: 12, fontWeight: 800 }}>
              Treatment Date
            </Typography>
            <Typography sx={{ color: '#17344f', fontSize: 16, fontWeight: 800 }}>
              {toValidDateDisplay(filterDate, 'MMM DD, YYYY', '--')}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              border: '1px solid rgba(194, 208, 220, 0.92)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,248,252,0.99))',
            }}
          >
            <Typography sx={{ color: '#6a8197', fontSize: 12, fontWeight: 800 }}>
              Total Amount
            </Typography>
            <Typography sx={{ color: '#17344f', fontSize: 18, fontWeight: 900, mt: 0.5 }}>
              <FormatCurrency value={summary.totalAmount} />
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              border: '1px solid rgba(194, 208, 220, 0.92)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,248,252,0.99))',
            }}
          >
            <Typography sx={{ color: '#6a8197', fontSize: 12, fontWeight: 800 }}>
              Paid Amount
            </Typography>
            <Typography sx={{ color: '#17344f', fontSize: 18, fontWeight: 900, mt: 0.5 }}>
              <FormatCurrency value={summary.amountPaid} />
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              border: '1px solid rgba(194, 208, 220, 0.92)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,248,252,0.99))',
            }}
          >
            <Typography sx={{ color: '#6a8197', fontSize: 12, fontWeight: 800 }}>
              Balance
            </Typography>
            <Typography sx={{ color: '#17344f', fontSize: 18, fontWeight: 900, mt: 0.5 }}>
              <FormatCurrency value={summary.balance} />
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            border: '1px solid rgba(206, 218, 229, 0.95)',
            borderRadius: '18px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.92)',
          }}
        >
          <Table size="small" aria-label="Invoice preview table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#25486c' }}>Procedure</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#25486c' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#25486c' }}>Paid Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id ?? `invoice-preview-${index}`}>
                  <TableCell>{item.procedure || '--'}</TableCell>
                  <TableCell>
                    <FormatCurrency value={item.totalAmount} />
                  </TableCell>
                  <TableCell>
                    <FormatCurrency value={item.amountPaid} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </>
  );
};

export default InvoiceGeneratorModal;
