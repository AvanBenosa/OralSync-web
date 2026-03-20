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
import styles from '../style.scss.module.scss';
import { AppointmentModel, AppointmentStateProps } from '../api/types';

const formatAppointmentDate = (
  value?: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!value) {
    return '--';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    options || {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
};

const formatAppointmentRange = (item: AppointmentModel): string => {
  if (!item.appointmentDateFrom) {
    return '--';
  }

  const fromValue = formatAppointmentDate(item.appointmentDateFrom);

  if (!item.appointmentDateTo) {
    return fromValue;
  }

  const toValue = formatAppointmentDate(item.appointmentDateTo, {
    hour: '2-digit',
    minute: '2-digit',
  });

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

const getAppointmentTimingStatus = (item: AppointmentModel): 'today' | 'past' | undefined => {
  if (!item.appointmentDateFrom) {
    return undefined;
  }

  const fromDate =
    item.appointmentDateFrom instanceof Date
      ? item.appointmentDateFrom
      : new Date(item.appointmentDateFrom);

  if (Number.isNaN(fromDate.getTime())) {
    return undefined;
  }

  const now = new Date();
  const isSameDay =
    fromDate.getFullYear() === now.getFullYear() &&
    fromDate.getMonth() === now.getMonth() &&
    fromDate.getDate() === now.getDate();

  if (!isSameDay) {
    return undefined;
  }

  const toDate =
    item.appointmentDateTo instanceof Date
      ? item.appointmentDateTo
      : item.appointmentDateTo
      ? new Date(item.appointmentDateTo)
      : fromDate;

  if (!Number.isNaN(toDate.getTime()) && toDate.getTime() <= now.getTime()) {
    return 'past';
  }

  return 'today';
};

const AppointmentTable: FunctionComponent<AppointmentStateProps> = (
  props: AppointmentStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const columnCount = isMobile ? 1 : 5;

  const renderActionButtons = (item: AppointmentModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit appointment"
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
        aria-label="Delete appointment"
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
      <Table stickyHeader aria-label="Appointment table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Patient</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Schedule</TableCell>
                <TableCell className={styles.tableHeaderCell}>Reason</TableCell>
                <TableCell className={styles.tableHeaderCell}>Status</TableCell>
                <TableCell className={styles.tableHeaderCell}>Appointment Type</TableCell>
                <TableCell className={styles.tableHeaderCell} align="right"></TableCell>
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
                { width: '64%', height: 26 },
                { width: '70%' },
                { width: '58%' },
                { kind: 'rounded', width: 108, height: 24 },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '70%',
                secondaryWidth: '56%',
                secondaryHeight: 18,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <EventBusyOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>No appointments found</Typography>
                  <Typography className={styles.emptyStateText}>
                    Appointments will appear here once records are created or your search matches
                    existing entries.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow
                hover
                key={item.id ?? `appointment-${index}`}
                className={
                  getAppointmentTimingStatus(item) === 'today'
                    ? styles.todayAppointmentRow
                    : getAppointmentTimingStatus(item) === 'past'
                    ? styles.pastAppointmentRow
                    : undefined
                }
              >
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          {item.patientName || '--'}
                        </Typography>
                        <Typography component="span" className={styles.mobileContact}>
                          {formatAppointmentRange(item)}
                        </Typography>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    <div>
                      <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                        {item.patientName || '--'}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#6f8297' }}>
                        {item.patientNumber || '--'}
                      </Typography>
                    </div>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>
                      {formatAppointmentRange(item)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {item.reasonForVisit || '--'}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatAppointmentLabel(item.status)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatAppointmentLabel(item.appointmentType)}
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

export default AppointmentTable;
