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
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import {
  FinanceExpenseModel,
  FinanceExpenseStateProps,
  getClinicExpenseCategoryLabel,
} from '../api/types';
import styles from '../../style.scss.module.scss';

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

const FinanceOverviewExpenseTable: FunctionComponent<FinanceExpenseStateProps> = (
  props: FinanceExpenseStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 5;

  const renderActionButtons = (item: FinanceExpenseModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit expense record"
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
        aria-label="Delete expense record"
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
      <Table stickyHeader aria-label="Finance expense table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Category</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Date</TableCell>
                <TableCell className={styles.tableHeaderCell}>Remarks</TableCell>
                <TableCell className={styles.tableHeaderCell}>Amount</TableCell>
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
                { width: '40%' },
                { width: '32%' },
                { width: '68%' },
                { width: '26%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '62%',
                secondaryWidth: '52%',
                secondaryHeight: 18,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <ReceiptLongOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>No expense records found</Typography>
                  <Typography className={styles.emptyStateText}>
                    Add clinic expenses here to start tracking utilities, supplies, salaries, and
                    other operating costs.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow hover key={item.id ?? `finance-expense-${index}`}>
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          {getClinicExpenseCategoryLabel(item.category)}
                        </Typography>
                        <div className={styles.mobileMeta}>
                          <Typography component="span" className={styles.mobileContact}>
                            {formatDate(item.date)}
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            {formatCurrency(item.amount)}
                          </Typography>
                        </div>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                      {getClinicExpenseCategoryLabel(item.category)}
                    </Typography>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>{formatDate(item.date)}</TableCell>
                    <TableCell className={styles.tableBodyCell}>{item.remarks || '--'}</TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell} align="right">
                      {renderActionButtons(item)}
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

export default FinanceOverviewExpenseTable;
