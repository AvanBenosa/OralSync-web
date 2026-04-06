import { FunctionComponent, JSX, useRef, useState } from 'react';
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
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import HighlightText from '../../../common/components/Highlight';
import TableLoadingSkeleton from '../../../common/components/TableLoadingSkeleton';
import { downloadElementAsPdf } from '../../../common/utils/downloadElementAsPdf';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';
import {
  DentalLabCaseModel,
  DentalLabCaseStateProps,
  DentalLabCaseStatus,
  getDentalLabCaseStatusLabel,
} from '../api/types';
import DentalLabCaseReportPreview, {
  buildDentalLabCasePdfFileName,
} from './dental-lab-case-report-preview';
import styles from '../style.scss.module.scss';

const formatDate = (value?: string | Date): string =>
  value ? toValidDateDisplay(value, 'MMM DD, YYYY') : '--';

const formatCurrency = (value?: number): string => `PHP ${(value ?? 0).toFixed(2)}`;

const getBalanceAmount = (item: DentalLabCaseModel): number =>
  Math.max((item.totalCost ?? 0) - (item.discount ?? 0) - (item.paidAmount ?? 0), 0);

const getStatusClassName = (status?: DentalLabCaseStatus | string): string => {
  if (status === DentalLabCaseStatus.Completed) {
    return styles.statusCompleted;
  }

  if (status === DentalLabCaseStatus.InProgress) {
    return styles.statusInProgress;
  }

  if (status === 'Cancelled') {
    return styles.statusCancelled;
  }

  return styles.statusPending;
};

const getPaymentStatusClassName = (item: DentalLabCaseModel): string => {
  const totalCost = item.totalCost ?? 0;
  const paidAmount = item.paidAmount ?? 0;
  const balance = getBalanceAmount(item);

  if (totalCost <= 0 || balance <= 0) {
    return styles.paymentPaid;
  }

  if (paidAmount > 0) {
    return styles.paymentPartial;
  }

  return styles.paymentUnpaid;
};

const getPaymentStatusLabel = (item: DentalLabCaseModel): string => {
  const totalCost = item.totalCost ?? 0;
  const paidAmount = item.paidAmount ?? 0;
  const balance = getBalanceAmount(item);

  if (totalCost <= 0 || balance <= 0) {
    return 'Paid';
  }

  if (paidAmount > 0) {
    return 'Partial';
  }

  return 'Unpaid';
};

const waitForNextFrame = async (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const DentalLabCasesTable: FunctionComponent<DentalLabCaseStateProps> = (
  props: DentalLabCaseStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 10;
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [exportItem, setExportItem] = useState<DentalLabCaseModel | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<string>('');

  const renderStatusBadge = (status?: DentalLabCaseStatus | string): JSX.Element => (
    <span className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
      {getDentalLabCaseStatusLabel(status)}
    </span>
  );

  const handleDownloadSummary = async (item: DentalLabCaseModel): Promise<void> => {
    if (!item.id) {
      return;
    }

    setDownloadingItemId(item.id);
    setExportItem(item);

    try {
      await waitForNextFrame();
      await waitForNextFrame();

      await downloadElementAsPdf(reportRef.current, {
        fileName: buildDentalLabCasePdfFileName(item),
        backgroundColor: '#ffffff',
        margin: 8,
        scale: 2,
      });
    } finally {
      setExportItem(null);
      setDownloadingItemId('');
    }
  };

  const renderActionButtons = (item: DentalLabCaseModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title={downloadingItemId === item.id ? 'Preparing PDF...' : 'Download PDF'}
        aria-label="Download lab case summary as PDF"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
        disabled={downloadingItemId === item.id}
        onClick={(): void => {
          void handleDownloadSummary(item);
        }}
      >
        <DownloadOutlinedIcon className={styles.iconEdit} />
      </button>
      <button
        type="button"
        title="Edit"
        aria-label="Edit lab case"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
        onClick={(): void =>
          setState((prev) => ({
            ...prev,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            openModal: true,
          }))
        }
      >
        <EditOutlinedIcon className={styles.iconEdit} />
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete lab case"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
        onClick={(): void =>
          setState((prev) => ({
            ...prev,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            openModal: true,
          }))
        }
      >
        <DeleteOutlineOutlinedIcon className={styles.iconDelete} />
      </button>
    </div>
  );

  return (
    <>
      <TableContainer
        className={styles.tableSurface}
        component={Paper}
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: '20px',
        }}
      >
        <Table stickyHeader aria-label="Dental lab cases table">
          <TableHead>
            <TableRow>
              <TableCell className={styles.tableHeaderCell}>Case Number</TableCell>
              {!isMobile ? (
                <>
                  <TableCell className={styles.tableHeaderCell}>Patient</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Lab Provider</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Date Sent</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Due Date</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Status</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Total Cost</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Balance</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Payment Status</TableCell>
                  <TableCell className={styles.tableHeaderCell} align="right"></TableCell>
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {state.load ? (
              <TableLoadingSkeleton
                rowCount={isMobile ? 4 : 6}
                isMobile={isMobile}
                cellClassName={styles.tableBodyCell}
                desktopCells={[
                  { width: '20%', height: 26 },
                  { width: '24%' },
                  { width: '18%' },
                  { width: '12%' },
                  { width: '12%' },
                  { width: '10%' },
                  { width: '10%' },
                  { width: '10%' },
                  { width: '10%' },
                  { kind: 'actions', align: 'right' },
                ]}
                mobileConfig={{
                  primaryWidth: '72%',
                  secondaryWidth: '48%',
                  secondaryHeight: 20,
                  actionCount: 3,
                  actionSize: 34,
                }}
              />
            ) : state.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  align="center"
                  sx={{ borderBottom: 0, px: isMobile ? 1.5 : 3, py: 9 }}
                >
                  <Box className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <BiotechRoundedIcon className={styles.emptyStateGlyph} />
                    </div>
                    <Typography className={styles.emptyStateTitle}>
                      No dental lab cases yet
                    </Typography>
                    <Typography className={styles.emptyStateText}>
                      Lab cases will appear here once you create a record and link a patient,
                      provider, teeth, and reference images.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              state.items.map((item, index) => (
                <TableRow hover key={item.id ?? `lab-case-${index}`}>
                  <TableCell className={styles.tableBodyCell}>
                    {isMobile ? (
                      <div className={styles.mobileRowInline}>
                        <div className={styles.mobileMain}>
                          <Typography component="span" className={styles.mobileName}>
                            <HighlightText query={state.search} text={item.caseNumber || '--'} />
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            <HighlightText query={state.search} text={item.patientLabel || '--'} />
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            <HighlightText
                              query={state.search}
                              text={item.labProviderName || '--'}
                            />
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            Total Cost: {formatCurrency(item.totalCost)}
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            Balance:{' '}
                            {getBalanceAmount(item) > 0
                              ? formatCurrency(getBalanceAmount(item))
                              : 'Fully Paid'}
                          </Typography>
                          <Box sx={{ mt: 1 }}>{renderStatusBadge(item.status)}</Box>
                          <Box sx={{ mt: 0.75 }}>
                            <span
                              className={`${styles.statusBadge} ${getPaymentStatusClassName(item)}`}
                            >
                              {getPaymentStatusLabel(item)}
                            </span>
                          </Box>
                        </div>
                        <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                      </div>
                    ) : (
                      <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                        <HighlightText query={state.search} text={item.caseNumber || '--'} />
                      </Typography>
                    )}
                  </TableCell>
                  {!isMobile ? (
                    <>
                      <TableCell className={styles.tableBodyCell}>
                        <Typography sx={{ fontWeight: 700, color: '#1f4467', lineHeight: 1.2 }}>
                          <HighlightText query={state.search} text={item.patientLabel || '--'} />
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '12px', mt: 0.35 }}>
                          <HighlightText query={state.search} text={item.patientNumber || '--'} />
                        </Typography>
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        <HighlightText query={state.search} text={item.labProviderName || '--'} />
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatDate(item.dateSent)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatDate(item.dateDue)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {renderStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatCurrency(item.totalCost)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {getBalanceAmount(item) > 0
                          ? formatCurrency(getBalanceAmount(item))
                          : 'Fully Paid'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        <span
                          className={`${styles.statusBadge} ${getPaymentStatusClassName(item)}`}
                        >
                          {getPaymentStatusLabel(item)}
                        </span>
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

      {exportItem ? <DentalLabCaseReportPreview item={exportItem} reportRef={reportRef} /> : null}
    </>
  );
};

export default DentalLabCasesTable;
