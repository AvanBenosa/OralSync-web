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
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';

import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import styles from '../../styles.module.scss';
import {
  PatientAppointmentRecordModel,
  PatientAppointmentRecordStateProps,
} from '../api/types';

type AppointmentStatusTone =
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'noShow';

const formatAppointmentDate = (value?: string | Date, format: string = 'MMM DD, YYYY, hh:mm A') =>
  toValidDateDisplay(value, format);

const formatAppointmentRange = (item: PatientAppointmentRecordModel): string => {
  if (!item.appointmentDateFrom) {
    return '--';
  }

  const fromValue = formatAppointmentDate(item.appointmentDateFrom);

  if (!item.appointmentDateTo) {
    return fromValue;
  }

  const toValue = formatAppointmentDate(item.appointmentDateTo, 'hh:mm A');

  return `${fromValue} - ${toValue}`;
};

const formatAppointmentLabel = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^walk in$/i, 'Walk-In')
    .replace(/^no show$/i, 'No Show');
};

const getAppointmentStatusTone = (status?: string): AppointmentStatusTone | undefined => {
  if (!status?.trim()) {
    return undefined;
  }

  const normalizedValue = status.trim().toLowerCase().replace(/[\s-]+/g, '');

  if (normalizedValue === 'pending') {
    return 'pending';
  }

  if (normalizedValue === 'scheduled') {
    return 'scheduled';
  }

  if (normalizedValue === 'completed') {
    return 'completed';
  }

  if (normalizedValue === 'cancelled' || normalizedValue === 'canceled') {
    return 'cancelled';
  }

  if (normalizedValue === 'noshow') {
    return 'noShow';
  }

  return undefined;
};

const PatientAppointmentRecordsTable: FunctionComponent<PatientAppointmentRecordStateProps> = (
  props: PatientAppointmentRecordStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 6;

  const getStatusRowClassName = (statusTone?: AppointmentStatusTone): string | undefined => {
    if (statusTone === 'pending') {
      return styles.pendingAppointmentRow;
    }

    if (statusTone === 'scheduled') {
      return styles.scheduledAppointmentRow;
    }

    if (statusTone === 'completed') {
      return styles.completedAppointmentRow;
    }

    if (statusTone === 'cancelled') {
      return styles.cancelledAppointmentRow;
    }

    if (statusTone === 'noShow') {
      return styles.noShowAppointmentRow;
    }

    return undefined;
  };

  const getStatusPillClassName = (statusTone?: AppointmentStatusTone): string | undefined => {
    if (statusTone === 'pending') {
      return styles.pendingStatusPill;
    }

    if (statusTone === 'scheduled') {
      return styles.scheduledStatusPill;
    }

    if (statusTone === 'completed') {
      return styles.completedStatusPill;
    }

    if (statusTone === 'cancelled') {
      return styles.cancelledStatusPill;
    }

    if (statusTone === 'noShow') {
      return styles.noShowStatusPill;
    }

    return undefined;
  };

  const renderActionButtons = (item: PatientAppointmentRecordModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit appointment record"
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
        aria-label="Delete appointment record"
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
      <Table stickyHeader aria-label="Patient appointment records table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Schedule</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Reason</TableCell>
                <TableCell className={styles.tableHeaderCell}>Status</TableCell>
                <TableCell className={styles.tableHeaderCell}>Appointment Type</TableCell>
                <TableCell className={styles.tableHeaderCell}>Remarks</TableCell>
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
              desktopCells={[
                { width: '66%', height: 26 },
                { width: '54%' },
                { kind: 'rounded', width: 108, height: 24 },
                { width: '40%' },
                { width: '58%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '74%',
                secondaryWidth: '56%',
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
                    <EventBusyOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>
                    No appointment records yet
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    Appointment records will appear here once entries are added for this patient.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => {
              const statusTone = getAppointmentStatusTone(item.status);
              const statusLabel = formatAppointmentLabel(item.status);
              const statusPillClassName = getStatusPillClassName(statusTone);

              return (
                <TableRow
                  hover
                  key={item.id ?? `patient-appointment-row-${index}`}
                  className={getStatusRowClassName(statusTone)}
                >
                  <TableCell className={styles.tableBodyCell}>
                    {isMobile ? (
                      <div className={styles.mobileRowInline}>
                        <div className={styles.mobileMain}>
                          <Typography component="span" className={styles.mobileName}>
                            {formatAppointmentRange(item)}
                          </Typography>
                          <div className={styles.mobileMeta}>
                            {statusPillClassName ? (
                              <span className={`${styles.statusPill} ${statusPillClassName}`}>
                                {statusLabel}
                              </span>
                            ) : (
                              <Typography component="span" className={styles.mobileContact}>
                                {statusLabel}
                              </Typography>
                            )}
                            <Typography component="span" className={styles.mobileContact}>
                              {formatAppointmentLabel(item.appointmentType)}
                            </Typography>
                          </div>
                        </div>
                        <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                      </div>
                    ) : (
                      formatAppointmentRange(item)
                    )}
                  </TableCell>
                  {!isMobile ? (
                    <>
                      <TableCell className={styles.tableBodyCell}>
                        {item.reasonForVisit || '--'}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {statusPillClassName ? (
                          <span className={`${styles.statusPill} ${statusPillClassName}`}>
                            {statusLabel}
                          </span>
                        ) : (
                          statusLabel
                        )}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {formatAppointmentLabel(item.appointmentType)}
                      </TableCell>
                      <TableCell className={styles.tableBodyCell}>
                        {item.remarks || '--'}
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

export default PatientAppointmentRecordsTable;
