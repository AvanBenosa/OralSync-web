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
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';

import styles from '../../styles.module.scss';
import { PatientOverViewModel, PatientOverViewStateProps } from '../api/types';
import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';

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

const getResolvedBalance = (item: PatientOverViewModel): number | undefined => {
  if (typeof item.balance === 'number' && !Number.isNaN(item.balance)) {
    return item.balance;
  }

  if (item.totalAmountDue === undefined && item.amountPaid === undefined) {
    return undefined;
  }

  return (item.totalAmountDue ?? 0) - (item.amountPaid ?? 0);
};

const getPaymentStatus = (item: PatientOverViewModel): PaymentStatus | undefined => {
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

const OverViewTable: FunctionComponent<PatientOverViewStateProps> = (
  props: PatientOverViewStateProps
): JSX.Element => {
  const { state } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const columnCount = isMobile ? 1 : 8;

  // const renderActionButtons = (item: PatientOverViewModel): JSX.Element => (
  //   <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
  //     <button
  //       type="button"
  //       title="Edit"
  //       aria-label="Edit overview"
  //       className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
  //       onClick={(): void =>
  //         setState({
  //           ...state,
  //           selectedItem: item,
  //           isUpdate: true,
  //           isDelete: false,
  //           openModal: true,
  //         })
  //       }
  //     >
  //       <EditOutlinedIcon className={styles.iconEdit} />
  //     </button>
  //     <button
  //       type="button"
  //       title="Delete"
  //       aria-label="Delete overview"
  //       className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
  //       onClick={(): void =>
  //         setState({
  //           ...state,
  //           selectedItem: item,
  //           isUpdate: false,
  //           isDelete: true,
  //           openModal: true,
  //         })
  //       }
  //     >
  //       <DeleteOutlineOutlinedIcon className={styles.iconDelete} />
  //     </button>
  //   </div>
  // );

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
      <Table stickyHeader aria-label="Overview table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Date</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Procedure</TableCell>
                <TableCell className={styles.tableHeaderCell}>Dentist</TableCell>
                <TableCell className={styles.tableHeaderCell}>Amount</TableCell>
                <TableCell className={styles.tableHeaderCell}>Discount</TableCell>
                <TableCell className={styles.tableHeaderCell}>Paid</TableCell>
                <TableCell className={styles.tableHeaderCell}>Balance</TableCell>
                <TableCell className={styles.tableHeaderCell} align="right" />
                {/* <TableCell className={styles.tableHeaderCell} align="right" /> */}
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
                { width: '70%' },
                { width: '56%' },
                { width: '48%' },
                { width: '46%' },
                { width: '42%' },
                { width: '52%' },
                { kind: 'rounded', width: 116, height: 24 },
              ]}
              mobileConfig={{
                primaryWidth: '74%',
                secondaryWidth: 92,
                secondaryHeight: 18,
                badgeWidth: 108,
                badgeHeight: 24,
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
                  <Typography className={styles.emptyStateTitle}>
                    No overview records yet
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    Overview records will appear here once entries are added for this patient.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => {
              const status = getPaymentStatus(item);
              const balance = getResolvedBalance(item);
              const statusLabel = getPaymentStatusLabel(status);

              return (
                <TableRow
                  hover
                  key={item.id ?? `overview-row-${index}`}
                  className={
                    status
                      ? `${styles.statusRow} ${
                          status === 'pending' ? styles.pendingRow : styles.paidRow
                        }`
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
                        {/* <div className={styles.mobileActions}>{renderActionButtons(item)}</div> */}
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
                        {item.assignedDoctor ? `Dr. ${item.assignedDoctor}` : '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.discount)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.amountPaid)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        <div className={styles.balanceCell}>
                          <span>{formatCurrency(balance)}</span>
                        </div>
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
                        ) : null}{' '}
                      </TableCell>
                      {/* <TableCell className={styles.tableBodyCell} align="right">
                        {renderActionButtons(item)}
                      </TableCell> */}
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

export default OverViewTable;
