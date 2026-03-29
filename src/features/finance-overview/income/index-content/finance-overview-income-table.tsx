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
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';

import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import type { FinanceIncomeModel, FinanceIncomeStateProps } from '../api/types';
import styles from '../../style.scss.module.scss';

type PaymentStatus = 'pending' | 'paid';

const formatDate = (value?: string | Date): string => toValidDateDisplay(value, 'MMM DD, YYYY');

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'Php',
    minimumFractionDigits: 2,
  }).format(value);
};

const getResolvedTotalAmountDue = (item: FinanceIncomeModel): number | undefined => {
  if (typeof item.totalAmountDue === 'number' && !Number.isNaN(item.totalAmountDue)) {
    return item.totalAmountDue;
  }

  if (item.amount === undefined && item.discount === undefined) {
    return undefined;
  }

  return (item.amount ?? 0) - (item.discount ?? 0);
};

const getResolvedBalance = (item: FinanceIncomeModel): number | undefined => {
  if (typeof item.balance === 'number' && !Number.isNaN(item.balance)) {
    return item.balance;
  }

  const totalAmountDue = getResolvedTotalAmountDue(item);

  if (totalAmountDue === undefined && item.amountPaid === undefined) {
    return undefined;
  }

  return (totalAmountDue ?? 0) - (item.amountPaid ?? 0);
};

const getPaymentStatus = (item: FinanceIncomeModel): PaymentStatus | undefined => {
  const balance = getResolvedBalance(item);

  if (balance === undefined) {
    return undefined;
  }

  return balance > 0 ? 'pending' : 'paid';
};

const getPaymentStatusLabel = (status?: PaymentStatus): string | undefined => {
  if (status === 'pending') {
    return 'Pending balance';
  }

  if (status === 'paid') {
    return 'Fully paid';
  }

  return undefined;
};

type FinanceOverviewIncomeTableProps = FinanceIncomeStateProps & {
  onOpenInvoice: (item: FinanceIncomeModel) => void;
};

const FinanceOverviewIncomeTable: FunctionComponent<FinanceOverviewIncomeTableProps> = (
  props: FinanceOverviewIncomeTableProps
): JSX.Element => {
  const { state, setState, onOpenInvoice } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 11;

  const renderActionButtons = (item: FinanceIncomeModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Download Invoice"
        aria-label="Preview and download invoice"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.invoiceButton}`}
        onClick={(): void => onOpenInvoice(item)}
      >
        <PictureAsPdfRoundedIcon className={styles.iconInvoice} />
      </button>
      <button
        type="button"
        title="Edit"
        aria-label="Edit income record"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            openModal: true,
          })
        }
      >
        <EditOutlinedIcon className={styles.iconEdit} />
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete income record"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            openModal: true,
          })
        }
      >
        <DeleteOutlineOutlinedIcon className={styles.iconDelete} />
      </button>
    </div>
  );

  return (
    <TableContainer className={styles.tableSurface} component={Paper} elevation={0}>
      <Table stickyHeader aria-label="Finance income table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Patient</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Date</TableCell>
                <TableCell className={styles.tableHeaderCell}>Assigned Dentist</TableCell>
                <TableCell className={styles.tableHeaderCell}>Category</TableCell>
                <TableCell className={styles.tableHeaderCell}>Total Due</TableCell>
                <TableCell className={styles.tableHeaderCell}>Paid</TableCell>
                <TableCell className={styles.tableHeaderCell}>Balance</TableCell>
                <TableCell className={styles.tableHeaderCell}>Status</TableCell>
                <TableCell className={styles.tableHeaderCell} align="right" />
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
                { width: '64%' },
                { width: '48%' },
                { width: '66%' },
                { width: '58%' },
                { width: '52%' },
                { width: '44%' },
                { width: '42%' },
                { width: '42%' },
                { width: '42%' },
                { kind: 'rounded', width: 110, height: 24 },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '72%',
                secondaryWidth: '60%',
                secondaryHeight: 18,
                badgeWidth: 108,
                badgeHeight: 24,
                actionCount: 3,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <MonetizationOnOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>
                    No income records found
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    Income entries from patient progress notes will appear here once records are
                    created or your search matches existing entries.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => {
              const totalAmountDue = getResolvedTotalAmountDue(item);
              const balance = getResolvedBalance(item);
              const status = getPaymentStatus(item);
              const statusLabel = getPaymentStatusLabel(status);

              return (
                <TableRow
                  hover
                  key={item.id ?? `finance-income-${index}`}
                  className={
                    status ? (status === 'pending' ? styles.pendingRow : styles.paidRow) : undefined
                  }
                >
                  <TableCell className={styles.tableBodyCell}>
                    {isMobile ? (
                      <div className={styles.mobileRowInline}>
                        <div className={styles.mobileMain}>
                          <Typography component="span" className={styles.mobileName}>
                            {item.patientName || item.patientNumber || '--'}
                          </Typography>
                          <div className={styles.mobileMeta}>
                            <Typography component="span" className={styles.mobileContact}>
                              {formatDate(item.date)}
                            </Typography>
                            {statusLabel ? (
                              <span
                                className={`${styles.statusPill} ${
                                  status === 'pending' ? styles.pendingPill : styles.paidPill
                                }`}
                              >
                                {statusLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                      </div>
                    ) : (
                      <div>
                        <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                          {item.patientName || item.patientNumber || '--'}
                        </Typography>
                      </div>
                    )}
                  </TableCell>
                  {!isMobile ? (
                    <>
                      <TableCell className={styles.tableBodyCell}>
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {item.assignedDoctor || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {item.category || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(totalAmountDue)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.amountPaid)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {statusLabel ? (
                          <span
                            className={`${styles.statusPill} ${
                              status === 'pending' ? styles.pendingPill : styles.paidPill
                            }`}
                          >
                            {statusLabel}
                          </span>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell} align="right">
                        {renderActionButtons(item)}
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FinanceOverviewIncomeTable;
