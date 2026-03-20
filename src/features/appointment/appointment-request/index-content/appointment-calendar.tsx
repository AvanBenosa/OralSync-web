import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import styles from '../style.scss.module.scss';
import { AppointmentModel, AppointmentStateProps } from '../api/types';
import { GetCurrentClinicProfile } from '../../../settings/clinic-profile/api/api';

const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getMonthLabel = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);

const buildAppointmentDateTime = (date: Date, timeValue: string): string => {
  const [hours, minutes] = String(timeValue || '09:00')
    .split(':')
    .map((value) => Number(value));
  const nextDate = new Date(date);
  nextDate.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return nextDate.toISOString();
};

const addHourToTime = (timeValue: string, fallback: string): string => {
  const [hours, minutes] = String(timeValue || fallback)
    .split(':')
    .map((value) => Number(value));
  const sourceHours = Number.isFinite(hours) ? hours : 9;
  const sourceMinutes = Number.isFinite(minutes) ? minutes : 0;
  const nextHour = Math.min(sourceHours + 1, 23);
  return `${String(nextHour).padStart(2, '0')}:${String(sourceMinutes).padStart(2, '0')}`;
};

const formatFullDate = (value: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);

const formatTimeRange = (item: AppointmentModel): string => {
  if (!item.appointmentDateFrom) {
    return '--';
  }

  const fromDate =
    item.appointmentDateFrom instanceof Date
      ? item.appointmentDateFrom
      : new Date(item.appointmentDateFrom);
  const toDate = item.appointmentDateTo
    ? item.appointmentDateTo instanceof Date
      ? item.appointmentDateTo
      : new Date(item.appointmentDateTo)
    : null;

  if (Number.isNaN(fromDate.getTime())) {
    return '--';
  }

  const formatTime = (value: Date): string =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);

  return toDate && !Number.isNaN(toDate.getTime())
    ? `${formatTime(fromDate)} - ${formatTime(toDate)}`
    : formatTime(fromDate);
};

const AppointmentCalendar: FunctionComponent<AppointmentStateProps> = (
  props: AppointmentStateProps
): JSX.Element => {
  const { state, setState, clinicId } = props;
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    items: AppointmentModel[];
  } | null>(null);
  const [clinicOpeningTime, setClinicOpeningTime] = useState('09:00');
  const [clinicClosingTime, setClinicClosingTime] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const firstAppointment = state.items.find((item) => item.appointmentDateFrom);
    if (!firstAppointment?.appointmentDateFrom) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const sourceDate =
      firstAppointment.appointmentDateFrom instanceof Date
        ? firstAppointment.appointmentDateFrom
        : new Date(firstAppointment.appointmentDateFrom);

    return Number.isNaN(sourceDate.getTime())
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : new Date(sourceDate.getFullYear(), sourceDate.getMonth(), 1);
  });

  useEffect(() => {
    if (!clinicId) {
      return;
    }

    void GetCurrentClinicProfile(clinicId)
      .then((response) => {
        setClinicOpeningTime(response.openingTime || '09:00');
        setClinicClosingTime(response.closingTime || '18:00');
        setWorkingDays(
          response.workingDays?.length
            ? response.workingDays
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        );
      })
      .catch(() => undefined);
  }, [clinicId]);

  const { calendarDays, monthItems } = useMemo(() => {
    const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());

    const monthItemsMap = new Map<string, AppointmentModel[]>();
    const items = state.items.filter((item) => {
      if (!item.appointmentDateFrom) {
        return false;
      }

      const dateValue =
        item.appointmentDateFrom instanceof Date
          ? item.appointmentDateFrom
          : new Date(item.appointmentDateFrom);

      if (Number.isNaN(dateValue.getTime())) {
        return false;
      }

      const key = `${dateValue.getFullYear()}-${dateValue.getMonth()}-${dateValue.getDate()}`;
      const existingItems = monthItemsMap.get(key) || [];
      monthItemsMap.set(key, [...existingItems, item]);

      return (
        dateValue.getFullYear() === displayMonth.getFullYear() &&
        dateValue.getMonth() === displayMonth.getMonth()
      );
    }).sort((left, right) => {
      const leftDate = left.appointmentDateFrom ? new Date(left.appointmentDateFrom) : new Date(0);
      const rightDate = right.appointmentDateFrom ? new Date(right.appointmentDateFrom) : new Date(0);
      return leftDate.getTime() - rightDate.getTime();
    });

    const days = Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

      return {
        date: day,
        items: (monthItemsMap.get(key) || []).sort((left, right) => {
          const leftDate = left.appointmentDateFrom
            ? new Date(left.appointmentDateFrom)
            : new Date(0);
          const rightDate = right.appointmentDateFrom
            ? new Date(right.appointmentDateFrom)
            : new Date(0);
          return leftDate.getTime() - rightDate.getTime();
          }),
          isCurrentMonth: day.getMonth() === displayMonth.getMonth(),
          isWorkingDay: workingDays.includes(weekDayNames[day.getDay()]),
          isPastDay: (() => {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            return dayStart.getTime() < todayStart.getTime();
          })(),
          isFutureDay: (() => {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            return dayStart.getTime() > todayStart.getTime();
          })(),
          isToday: (() => {
            const today = new Date();
            return (
              day.getFullYear() === today.getFullYear() &&
            day.getMonth() === today.getMonth() &&
            day.getDate() === today.getDate()
          );
        })(),
      };
    });

    return {
      calendarDays: days,
      monthItems: items,
    };
  }, [displayMonth, state.items, workingDays]);

  if (state.load) {
    return (
      <div className={styles.calendarEmptyState}>
        <Typography className={styles.emptyStateTitle}>Loading calendar...</Typography>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className={styles.calendarEmptyState}>
        <div className={styles.emptyStateIcon}>
          <EventBusyOutlinedIcon className={styles.emptyStateGlyph} />
        </div>
        <Typography className={styles.emptyStateTitle}>No appointments to show</Typography>
        <Typography className={styles.emptyStateText}>
          Calendar entries will appear here once appointment records are created.
        </Typography>
      </div>
    );
  }

  return (
    <>
      <div className={styles.calendarSurface}>
      <div className={styles.calendarToolbar}>
        <div className={styles.calendarToolbarInfo}>
          <div className={styles.calendarToolbarIcon}>
            <ScheduleRoundedIcon />
          </div>
          <div>
            <Typography className={styles.calendarToolbarTitle}>
              Clinic Schedule Calendar
            </Typography>
            <div className={styles.calendarLegend}>
              <div className={styles.calendarLegendItem}>
                <span
                  className={`${styles.calendarLegendSwatch} ${styles.calendarWorkingSwatch}`}
                />
                <span>Working day</span>
              </div>
              <div className={styles.calendarLegendItem}>
                <span className={`${styles.calendarLegendSwatch} ${styles.calendarRestSwatch}`} />
                <span>Rest day</span>
              </div>
              <div className={styles.calendarLegendItem}>
                <span className={`${styles.calendarLegendSwatch} ${styles.calendarTodaySwatch}`} />
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.calendarMonthControls}>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={() =>
              setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))
            }
          >
            <ChevronLeftRoundedIcon />
          </button>
          <Typography className={styles.calendarMonthLabel}>
            {getMonthLabel(displayMonth)}
          </Typography>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={() =>
              setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))
            }
          >
            <ChevronRightRoundedIcon />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {weekDayLabels.map((label, index) => (
          <div
            key={label}
            className={`${styles.calendarWeekday} ${
              workingDays.includes(weekDayNames[index])
                ? styles.calendarWeekdayWorking
                : styles.calendarWeekdayRest
            }`}
          >
            {label}
          </div>
        ))}
        {calendarDays.map((day) => (
          <button
            key={day.date.toISOString()}
            type="button"
            className={`${styles.calendarDayCell} ${
              day.isCurrentMonth ? '' : styles.calendarDayCellMuted
            } ${day.isPastDay ? styles.calendarDayPast : ''} ${
              day.isToday ? styles.calendarDayToday : ''
            } ${
              day.isWorkingDay ? styles.calendarDayWorking : styles.calendarDayRest
            }`}
            onClick={() => {
              if (day.items.length === 0) {
                if (!day.isFutureDay) {
                  return;
                }

                const appointmentEndTime =
                  clinicClosingTime && clinicClosingTime !== clinicOpeningTime
                    ? addHourToTime(clinicOpeningTime, clinicClosingTime)
                    : addHourToTime(clinicOpeningTime, '10:00');

                setState({
                  ...state,
                  selectedItem: {
                    appointmentDateFrom: buildAppointmentDateTime(day.date, clinicOpeningTime),
                    appointmentDateTo: buildAppointmentDateTime(day.date, appointmentEndTime),
                    status: 'Scheduled',
                  },
                  isUpdate: false,
                  isDelete: false,
                  openModal: true,
                });
                return;
              }

              setSelectedDay({
                date: day.date,
                items: day.items,
              });
            }}
            disabled={day.items.length === 0 && !day.isFutureDay}
          >
            <div className={styles.calendarDayHeader}>
              <div className={styles.calendarDayNumber}>{day.date.getDate()}</div>
              <div
                className={`${styles.calendarDayStatusChip} ${
                  day.isWorkingDay ? styles.calendarDayStatusWorking : styles.calendarDayStatusRest
                }`}
              >
                {day.isWorkingDay ? 'open' : 'Closed'}
              </div>
            </div>
            <div className={styles.calendarDayEntries}>
              {day.items.length > 0 ? (
                <div className={styles.calendarCountCard}>
                  <span className={styles.calendarCountValue}>{day.items.length}</span>
                  <span className={styles.calendarCountLabel}>
                    {day.items.length === 1 ? 'Appointment' : 'Appointments'}
                  </span>
                  <span className={styles.calendarCountHint}>Click to view details</span>
                </div>
              ) : day.isFutureDay ? (
                <div className={styles.calendarCountCard}>
                  <span className={styles.calendarCountValue}>+</span>
                  <span className={styles.calendarCountLabel}>Create</span>
                  <span className={styles.calendarCountHint}>Click to add appointment</span>
                </div>
              ) : (
                <Typography className={styles.calendarEmptyDayText}>
                  No appointments
                </Typography>
              )}
            </div>
          </button>
        ))}
      </div>

      <Paper elevation={0} className={styles.calendarSidebar}>
        <Typography className={styles.calendarSidebarTitle}>Appointments This Month</Typography>
        {monthItems.length === 0 ? (
          <Typography className={styles.calendarSidebarText}>
            No appointments scheduled for this month.
          </Typography>
        ) : (
          monthItems.map((item, index) => (
            <Box
              key={item.id || `month-item-${index}`}
              className={styles.calendarSidebarItem}
              onClick={() =>
                setState({
                  ...state,
                  selectedItem: item,
                  isUpdate: true,
                  isDelete: false,
                  openModal: true,
                })
              }
            >
              <Typography className={styles.calendarSidebarItemTitle}>
                {item.patientName || '--'}
              </Typography>
              <Typography className={styles.calendarSidebarItemMeta}>
                {formatTimeRange(item)}
              </Typography>
              <Typography className={styles.calendarSidebarItemMeta}>
                {item.reasonForVisit || 'No reason provided'}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
      </div>

      <Dialog
        open={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#16324f' }}>
          {selectedDay ? `Appointments on ${formatFullDate(selectedDay.date)}` : 'Appointments'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedDay?.items?.length ? (
            <div className={styles.calendarModalList}>
              {selectedDay.items.map((item, index) => (
                <div
                  key={item.id || `selected-day-item-${index}`}
                  className={styles.calendarModalItem}
                >
                  <div className={styles.calendarModalItemContent}>
                    <Typography className={styles.calendarModalItemTitle}>
                      {item.patientName || '--'}
                    </Typography>
                    <Typography className={styles.calendarModalItemMeta}>
                      {formatTimeRange(item)}
                    </Typography>
                    <Typography className={styles.calendarModalItemMeta}>
                      {item.reasonForVisit || 'No reason provided'}
                    </Typography>
                    <Typography className={styles.calendarModalItemMeta}>
                      {item.status || 'Scheduled'}
                    </Typography>
                  </div>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => {
                      setSelectedDay(null);
                      setState({
                        ...state,
                        selectedItem: item,
                        isUpdate: true,
                        isDelete: false,
                        openModal: true,
                      });
                    }}
                  >
                    Update
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Typography className={styles.calendarSidebarText}>
              No appointments available for this day.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSelectedDay(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppointmentCalendar;
