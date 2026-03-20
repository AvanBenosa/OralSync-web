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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';

import styles from '../../styles.module.scss';
import { PatientProgressNoteModel, PatientProgressNoteStateProps } from '../api/types';
import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';

type PaymentStatus = 'pending' | 'paid';

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const formatDate = (value?: string | Date): string => {
  const date = parseDateValue(value);
  if (!date) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

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

const getResolvedTotalAmountDue = (item: PatientProgressNoteModel): number | undefined => {
  if (typeof item.totalAmountDue === 'number' && !Number.isNaN(item.totalAmountDue)) {
    return item.totalAmountDue;
  }

  if (item.amount === undefined && item.discount === undefined) {
    return undefined;
  }

  return (item.amount ?? 0) - (item.discount ?? 0);
};

const getResolvedBalance = (item: PatientProgressNoteModel): number | undefined => {
  if (typeof item.balance === 'number' && !Number.isNaN(item.balance)) {
    return item.balance;
  }

  const totalAmountDue = getResolvedTotalAmountDue(item);

  if (totalAmountDue === undefined && item.amountPaid === undefined) {
    return undefined;
  }

  return (totalAmountDue ?? 0) - (item.amountPaid ?? 0);
};

const getPaymentStatus = (item: PatientProgressNoteModel): PaymentStatus | undefined => {
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

const PatientProgressNoteTable: FunctionComponent<PatientProgressNoteStateProps> = (
  props: PatientProgressNoteStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const columnCount = isMobile ? 1 : 11;

  const renderActionButtons = (item: PatientProgressNoteModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit progress note"
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
        aria-label="Delete progress note"
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
    <TableContainer
      className={styles.tableSurface}
      component={Paper}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '20px',
      }}
    >
      <Table stickyHeader aria-label="Progress notes table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Date</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Procedure</TableCell>
                <TableCell className={styles.tableHeaderCell}>Assigned Doctor</TableCell>
                <TableCell className={styles.tableHeaderCell}>Category</TableCell>
                <TableCell className={styles.tableHeaderCell}>Account</TableCell>
                <TableCell className={styles.tableHeaderCell}>Cost</TableCell>
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
                { width: '62%' },
                { width: '72%' },
                { width: '64%' },
                { width: '64%' },
                { width: '58%' },
                { width: '52%' },
                { width: '56%' },
                { width: '48%' },
                { width: '52%' },
                { kind: 'rounded', width: 116, height: 24 },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '74%',
                secondaryWidth: 92,
                secondaryHeight: 18,
                badgeWidth: 108,
                badgeHeight: 24,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell
                colSpan={columnCount}
                align="center"
                sx={{ borderBottom: 0, px: isMobile ? 1.5 : 3, py: 9 }}
              >
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <PersonSearchOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>No progress notes yet</Typography>
                  <Typography className={styles.emptyStateText}>
                    Progress notes will appear here once entries are added for this patient.
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
                  key={item.id ?? `progress-note-row-${index}`}
                  className={
                    status
                      ? status === 'pending'
                        ? styles.pendingRow
                        : styles.paidRow
                      : undefined
                  }
                >
                  <TableCell className={styles.tableBodyCell}>
                    {isMobile ? (
                      <div className={styles.mobileRowInline}>
                        <div className={styles.mobileMain}>
                          <Typography component="span" className={styles.mobileName}>
                            {item.procedure || '--'}
                          </Typography>
                          <div className={styles.mobileMeta}>
                            <Typography component="span" className={styles.mobileContact}>
                              {formatDate(item.date)}
                            </Typography>
                            {item.assignedDoctor ? (
                              <Typography component="span" className={styles.mobileContact}>
                                {item.assignedDoctor}
                              </Typography>
                            ) : null}
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
                      formatDate(item.date)
                    )}
                  </TableCell>
                  {!isMobile ? (
                    <>
                      <TableCell className={styles.tableBodyCell}>
                        {item.procedure || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {item.assignedDoctor || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {item.category || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>{item.account || '--'}</TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.amount)}
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
                          formatCurrency(balance)
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

export default PatientProgressNoteTable;
