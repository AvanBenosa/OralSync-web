import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventInput } from '@fullcalendar/core';
import styles from '../style.scss.module.scss';
import { AppointmentModel, AppointmentStateProps } from '../api/types';
import { GetCurrentClinicProfile } from '../../../settings/clinic-profile/api/api';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';

const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getMonthLabel = (date: Date): string => toValidDateDisplay(date, 'MMMM YYYY');

type CalendarViewType = 'dayGridMonth' | 'timeGridDay' | 'listWeek';

const calendarViews: { value: CalendarViewType; label: string }[] = [
  { value: 'dayGridMonth', label: 'Month' },
  { value: 'timeGridDay', label: 'Day' },
  { value: 'listWeek', label: 'List' },
];

const getDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const getAppointmentDate = (value?: string | Date): Date | null => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const buildAppointmentDateTime = (date: Date, timeValue: string): string => {
  const [hours, minutes] = String(timeValue || '09:00')
    .split(':')
    .map((value) => Number(value));
  const nextDate = new Date(date);
  nextDate.setHours(
    Number.isFinite(hours) ? hours : 9,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
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

const formatFullDate = (value: Date): string => toValidDateDisplay(value, 'MMMM D, YYYY');

const formatTimeRange = (item: AppointmentModel): string => {
  const fromDate = getAppointmentDate(item.appointmentDateFrom);
  const toDate = getAppointmentDate(item.appointmentDateTo);

  if (!fromDate) {
    return '--';
  }

  const formatTime = (value: Date): string => toValidDateDisplay(value, 'hh:mm A');

  return toDate && !Number.isNaN(toDate.getTime())
    ? `${formatTime(fromDate)} - ${formatTime(toDate)}`
    : formatTime(fromDate);
};

const AppointmentCalendar: FunctionComponent<AppointmentStateProps> = (
  props: AppointmentStateProps
): JSX.Element => {
  const { state, setState, clinicId } = props;
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    items: AppointmentModel[];
  } | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarViewType>('dayGridMonth');
  const [calendarTitle, setCalendarTitle] = useState<string>(() => getMonthLabel(new Date()));
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
    const firstAppointmentDate = state.items
      .map((item) => getAppointmentDate(item.appointmentDateFrom))
      .find((value): value is Date => Boolean(value));

    if (!firstAppointmentDate) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return new Date(firstAppointmentDate.getFullYear(), firstAppointmentDate.getMonth(), 1);
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

  const { calendarEvents, monthItems, itemsByDay } = useMemo(() => {
    const sortedItems = state.items
      .map((item) => ({
        item,
        fromDate: getAppointmentDate(item.appointmentDateFrom),
        toDate: getAppointmentDate(item.appointmentDateTo),
      }))
      .filter((value): value is { item: AppointmentModel; fromDate: Date; toDate: Date | null } =>
        Boolean(value.fromDate)
      )
      .sort((left, right) => left.fromDate.getTime() - right.fromDate.getTime());

    const nextItemsByDay = new Map<string, AppointmentModel[]>();

    sortedItems.forEach(({ item, fromDate }) => {
      const key = getDayKey(fromDate);
      const existingItems = nextItemsByDay.get(key) || [];
      nextItemsByDay.set(key, [...existingItems, item]);
    });

    const nextMonthItems = sortedItems
      .filter(
        ({ fromDate }) =>
          fromDate.getFullYear() === displayMonth.getFullYear() &&
          fromDate.getMonth() === displayMonth.getMonth()
      )
      .map(({ item }) => item);

    const nextCalendarEvents: EventInput[] = sortedItems.map(
      ({ item, fromDate, toDate }, index) => {
        const statusKey = String(item.status || 'Scheduled')
          .toLowerCase()
          .replace(/\s+/g, '-');

        return {
          id: item.id || `${getDayKey(fromDate)}-${index}`,
          title: item.patientName || item.reasonForVisit || 'Appointment',
          start: fromDate.toISOString(),
          end: toDate?.toISOString(),
          allDay: false,
          classNames: [styles.calendarFcEvent, styles[`calendarFcEvent${statusKey}`] || ''],
          extendedProps: {
            appointment: item,
          },
        };
      }
    );

    return {
      calendarEvents: nextCalendarEvents,
      monthItems: nextMonthItems,
      itemsByDay: nextItemsByDay,
    };
  }, [displayMonth, state.items]);

  const handleCreateFromDay = (date: Date): void => {
    const appointmentEndTime =
      clinicClosingTime && clinicClosingTime !== clinicOpeningTime
        ? addHourToTime(clinicOpeningTime, clinicClosingTime)
        : addHourToTime(clinicOpeningTime, '10:00');

    setState({
      ...state,
      selectedItem: {
        appointmentDateFrom: buildAppointmentDateTime(date, clinicOpeningTime),
        appointmentDateTo: buildAppointmentDateTime(date, appointmentEndTime),
        status: 'Scheduled',
      },
      isUpdate: false,
      isDelete: false,
      openModal: true,
    });
  };

  const handleCreateFromSlot = (date: Date): void => {
    const fromDate = new Date(date);
    const endDate = new Date(fromDate);
    endDate.setHours(fromDate.getHours() + 1, fromDate.getMinutes(), 0, 0);

    setState({
      ...state,
      selectedItem: {
        appointmentDateFrom: fromDate.toISOString(),
        appointmentDateTo: endDate.toISOString(),
        status: 'Scheduled',
      },
      isUpdate: false,
      isDelete: false,
      openModal: true,
    });
  };

  const openUpdateModal = (item: AppointmentModel): void => {
    setState({
      ...state,
      selectedItem: item,
      isUpdate: true,
      isDelete: false,
      openModal: true,
    });
  };

  const changeCalendarView = (view: CalendarViewType): void => {
    setCalendarView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  if (state.load) {
    return (
      <div className={styles.calendarEmptyState}>
        <Typography className={styles.emptyStateTitle}>Loading calendar...</Typography>
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
                  <span
                    className={`${styles.calendarLegendSwatch} ${styles.calendarTodaySwatch}`}
                  />
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.calendarMonthControls}>
            <div className={styles.calendarViewSwitcher}>
              {calendarViews.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  className={`${styles.calendarViewButton} ${
                    calendarView === view.value ? styles.calendarViewButtonActive : ''
                  }`}
                  onClick={() => changeCalendarView(view.value)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => calendarRef.current?.getApi().prev()}
            >
              <ChevronLeftRoundedIcon />
            </button>
            <Typography className={styles.calendarMonthLabel}>{calendarTitle}</Typography>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => calendarRef.current?.getApi().next()}
            >
              <ChevronRightRoundedIcon />
            </button>
          </div>
        </div>
        <div className={styles.calendarFullWrapper}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, listPlugin, timeGridPlugin]}
            initialView={calendarView}
            initialDate={displayMonth}
            headerToolbar={false}
            height="auto"
            fixedWeekCount
            dayMaxEvents={3}
            events={calendarEvents}
            eventDisplay="block"
            allDaySlot={false}
            slotMinTime={`${clinicOpeningTime || '09:00'}:00`}
            slotMaxTime={`${clinicClosingTime || '18:00'}:00`}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            datesSet={(arg) => {
              const currentDate = arg.view.calendar.getDate();
              const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

              setCalendarView(arg.view.type as CalendarViewType);
              setCalendarTitle(arg.view.title);
              setDisplayMonth((currentMonth) => {
                if (
                  currentMonth.getFullYear() === nextMonth.getFullYear() &&
                  currentMonth.getMonth() === nextMonth.getMonth()
                ) {
                  return currentMonth;
                }

                return nextMonth;
              });
            }}
            dayHeaderClassNames={(arg) =>
              workingDays.includes(weekDayNames[arg.date.getDay()])
                ? [styles.calendarFcWeekdayWorking]
                : [styles.calendarFcWeekdayRest]
            }
            dayCellClassNames={(arg) => {
              const dayDate = new Date(
                arg.date.getFullYear(),
                arg.date.getMonth(),
                arg.date.getDate()
              );
              const today = new Date();
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const classNames = [
                workingDays.includes(weekDayNames[arg.date.getDay()])
                  ? styles.calendarFcDayWorking
                  : styles.calendarFcDayRest,
              ];

              if (arg.isOther) {
                classNames.push(styles.calendarFcDayOther);
              }

              if (dayDate.getTime() < todayStart.getTime()) {
                classNames.push(styles.calendarFcDayPast);
              }

              if (dayDate.getTime() === todayStart.getTime()) {
                classNames.push(styles.calendarFcDayToday);
              }

              return classNames;
            }}
            eventContent={(arg) => (
              <div className={styles.calendarFcEventContent}>
                {arg.timeText ? (
                  <span className={styles.calendarFcEventTime}>{arg.timeText}</span>
                ) : null}
                <span className={styles.calendarFcEventTitle}>{arg.event.title}</span>
              </div>
            )}
            dateClick={(arg) => {
              if (calendarView === 'timeGridDay') {
                if (arg.date.getTime() < new Date().getTime()) {
                  return;
                }

                handleCreateFromSlot(arg.date);
                return;
              }

              const clickedDate = new Date(
                arg.date.getFullYear(),
                arg.date.getMonth(),
                arg.date.getDate()
              );
              const dayItems = itemsByDay.get(getDayKey(clickedDate)) || [];

              if (dayItems.length > 0) {
                setSelectedDay({
                  date: clickedDate,
                  items: dayItems,
                });
                return;
              }

              const today = new Date();
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

              if (clickedDate.getTime() < todayStart.getTime()) {
                return;
              }

              handleCreateFromDay(clickedDate);
            }}
            eventClick={(arg) => {
              const appointment = arg.event.extendedProps.appointment as
                | AppointmentModel
                | undefined;

              if (!appointment) {
                return;
              }

              openUpdateModal(appointment);
            }}
          />
        </div>

        <Paper elevation={0} className={styles.calendarSidebar}>
          <Typography className={styles.calendarSidebarTitle}>Appointments This Month</Typography>
          {state.items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <EventBusyOutlinedIcon className={styles.emptyStateGlyph} />
              </div>
              <Typography className={styles.emptyStateTitle}>No appointments yet</Typography>
              <Typography className={styles.emptyStateText}>
                Use the calendar to click a future day and create the first appointment.
              </Typography>
            </div>
          ) : monthItems.length === 0 ? (
            <Typography className={styles.calendarSidebarText}>
              No appointments scheduled for this month.
            </Typography>
          ) : (
            monthItems.map((item, index) => (
              <Box
                key={item.id || `month-item-${index}`}
                className={styles.calendarSidebarItem}
                onClick={() => openUpdateModal(item)}
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
                      openUpdateModal(item);
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
