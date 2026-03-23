import { FunctionComponent, JSX } from 'react';
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
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

import TableLoadingSkeleton from '../../../common/components/TableLoadingSkeleton';
import FormatCurrency from '../../../common/helpers/formatCurrency';
import type { InvoiceGeneratorTableProps } from '../api/types';
import styles from '../style.scss.module.scss';

const InvoiceGeneratorTable: FunctionComponent<InvoiceGeneratorTableProps> = (
  props: InvoiceGeneratorTableProps
): JSX.Element => {
  const { state, items, hasReadyFilters } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 3;

  return (
    <TableContainer className={styles.tableSurface} component={Paper} elevation={0}>
      <Table stickyHeader aria-label="Invoice generator table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Procedure</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Total Amount</TableCell>
                <TableCell className={styles.tableHeaderCell}>Paid Amount</TableCell>
              </>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {state.load ? (
            <TableLoadingSkeleton
              rowCount={isMobile ? 4 : 5}
              isMobile={isMobile}
              cellClassName={styles.tableBodyCell}
              rowClassName={styles.noHoverRow}
              desktopCells={[
                { width: '56%' },
                { width: '22%' },
                { width: '22%' },
              ]}
              mobileConfig={{
                primaryWidth: '70%',
                secondaryWidth: '44%',
                secondaryHeight: 18,
              }}
            />
          ) : items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <ReceiptLongRoundedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>
                    {hasReadyFilters ? 'No progress notes found' : 'Select a patient and date'}
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    {hasReadyFilters
                      ? 'No progress notes matched the selected patient and treatment date.'
                      : 'Use the filters on the left to load the patient progress notes for invoice generation.'}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow hover key={item.id ?? `invoice-row-${index}`}>
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          {item.procedure || '--'}
                        </Typography>
                        <div className={styles.mobileMeta}>
                          <Typography component="span" className={styles.mobileContact}>
                            Total: <FormatCurrency value={item.totalAmount} />
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            Paid: <FormatCurrency value={item.amountPaid} />
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                      {item.procedure || '--'}
                    </Typography>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>
                      <FormatCurrency value={item.totalAmount} />
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      <FormatCurrency value={item.amountPaid} />
                    </TableCell>
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

export default InvoiceGeneratorTable;
