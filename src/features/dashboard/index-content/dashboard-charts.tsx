import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { DatesSetArg } from '@fullcalendar/core';

import { GetAppointments } from '../../appointment/appointment-request/api/api';
import {
  AppointmentModel,
  AppointmentStateModel,
} from '../../appointment/appointment-request/api/types';
import { DashboardStateprops } from '../api/types';
import styles from '../style.scss.module.scss';

const getDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const DashBoardCharts: FunctionComponent<DashboardStateprops> = (
  props: DashboardStateprops
): JSX.Element => {
  const { state } = props;
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState(() =>
    new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  );
  const [monthlyAppointments, setMonthlyAppointments] = useState<AppointmentModel[]>([]);
  const monthlyIncome = state?.monthlyIncome ?? [];
  const monthlyRevenue = state?.monthlyRevenue ?? [];
  const monthlyIncomeLabels = monthlyIncome.map((item) => item.month ?? '--');
  const monthlyIncomeValues = monthlyIncome.map((item) => item.income ?? 0);
  const monthlyExpenseValues = monthlyIncome.map((item) => item.expenses ?? 0);
  const bestTreatment = [...monthlyRevenue].sort(
    (left, right) => (right.totalAmount ?? 0) - (left.totalAmount ?? 0)
  )[0];
  const highestMonthlyExpense = Math.max(...monthlyExpenseValues, 0);
  const highestExpenseMonth =
    [...monthlyIncome].sort((left, right) => (right.expenses ?? 0) - (left.expenses ?? 0))[0]
      ?.month ?? '--';

  useEffect(() => {
    if (!state?.clinicId) {
      setMonthlyAppointments([]);
      return;
    }

    setCalendarLoading(true);

    const requestState: AppointmentStateModel = {
      items: [],
      load: false,
      initial: 0,
      totalItem: 0,
      pageStart: 0,
      pageEnd: 500,
      search: 'all',
      dateFrom: '',
      dateTo: '',
      openModal: false,
      isUpdate: false,
      isDelete: false,
      clinicId: state.clinicId,
      summaryCount: 0,
      hasDateFilter: false,
    };

    void GetAppointments(requestState, true)
      .then((response) => {
        setMonthlyAppointments(response.items ?? []);
      })
      .catch(() => {
        setMonthlyAppointments([]);
      })
      .finally(() => {
        setCalendarLoading(false);
      });
  }, [state?.clinicId]);

  const appointmentCountsByDay = useMemo<Map<string, number>>(() => {
    return monthlyAppointments.reduce<Map<string, number>>((counts, item) => {
      if (!item.appointmentDateFrom) {
        return counts;
      }

      const startDate =
        item.appointmentDateFrom instanceof Date
          ? item.appointmentDateFrom
          : new Date(item.appointmentDateFrom);

      if (Number.isNaN(startDate.getTime())) {
        return counts;
      }

      const key = getDayKey(startDate);
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map<string, number>());
  }, [monthlyAppointments]);

  const handleCalendarDatesSet = (arg: DatesSetArg): void => {
    setCalendarTitle(arg.view.title);
  };

  return (
    <div className={styles.chartsGrid}>
      <Card
        className={`${styles.chartCard} ${
          isCalendarExpanded ? styles.chartCardExpanded : styles.chartCardCompact
        }`}
      >
        <CardContent
          className={`${styles.chartCardContent} ${
            isCalendarExpanded ? styles.chartCardContentExpanded : styles.chartCardContentCompact
          }`}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography className={styles.chartTitle}>Appointments this month</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box className={styles.chartChip}>
                <CalendarMonthRoundedIcon className={styles.chartChipIcon} />
                <Typography className={styles.chartChipText}>{calendarTitle}</Typography>
              </Box>
              <IconButton
                size="small"
                className={styles.chartIconButton}
                onClick={() => setIsCalendarExpanded((prev) => !prev)}
                aria-label={isCalendarExpanded ? 'Minimize calendar' : 'Maximize calendar'}
                title={isCalendarExpanded ? 'Minimize calendar' : 'Maximize calendar'}
              >
                {isCalendarExpanded ? <CloseFullscreenRoundedIcon /> : <OpenInFullRoundedIcon />}
              </IconButton>
            </Stack>
          </Stack>

          {calendarLoading ? (
            <Box className={styles.chartPlaceholder}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <Box
              className={`${styles.dashboardCalendarShell} ${
                isCalendarExpanded
                  ? styles.dashboardCalendarShellExpanded
                  : styles.dashboardCalendarShellCompact
              }`}
            >
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height={isCalendarExpanded ? 'auto' : 360}
                fixedWeekCount
                datesSet={handleCalendarDatesSet}
                dayCellClassNames={(arg) => {
                  const dayCount =
                    appointmentCountsByDay.get(
                      getDayKey(
                        new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate())
                      )
                    ) || 0;

                  return [
                    styles.dashboardCalendarDayCell,
                    isCalendarExpanded
                      ? styles.dashboardCalendarDayCellExpanded
                      : styles.dashboardCalendarDayCellCompact,
                    arg.isToday
                      ? styles.dashboardCalendarDayCellToday
                      : dayCount > 0
                      ? styles.dashboardCalendarDayCellActive
                      : styles.dashboardCalendarDayCellIdle,
                  ];
                }}
                dayCellDidMount={(arg) => {
                  const dayCount =
                    appointmentCountsByDay.get(
                      getDayKey(
                        new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate())
                      )
                    ) || 0;

                  arg.el.setAttribute('data-count', String(dayCount));
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Card className={styles.chartCard}>
        <CardContent className={styles.chartCardContent}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography className={styles.chartTitle}>Top treatments by revenue</Typography>
            </Box>
            <Box className={styles.chartChip}>
              <InsightsRoundedIcon className={styles.chartChipIcon} />
              <Typography className={styles.chartChipText}>Revenue mix</Typography>
            </Box>
          </Stack>

          <Box className={styles.muiChartWrap}>
            <BarChart
              layout="horizontal"
              height={220}
              hideLegend
              grid={{ vertical: true }}
              yAxis={[
                {
                  scaleType: 'band',
                  data: monthlyRevenue.map((item) => item.treatment ?? '--'),
                  width: 150,
                  tickLabelStyle: {
                    fontSize: 12,
                  },
                },
              ]}
              series={[
                {
                  data: monthlyRevenue.map((item) => item.totalAmount ?? 0),
                  label: 'Revenue',
                  color: '#3b75ac',
                  valueFormatter: (value: number | null) =>
                    value == null ? '' : `P${value.toLocaleString('en-US')}`,
                },
              ]}
              margin={{ top: 8, right: 12, bottom: 8, left: 20 }}
            />
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            className={styles.chartSummaryRow}
          >
            <Typography className={styles.chartSummaryText}>Best performing treatment</Typography>
            <Typography className={styles.chartSummaryValue}>
              {bestTreatment?.treatment ?? '--'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card className={styles.chartCard}>
        <CardContent className={styles.chartCardContent}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography className={styles.chartTitle}>Monthly Income Graph</Typography>
              {/* <Typography className={styles.chartSubtitle}>
                Monthly income and expenses from `state.monthlyIncome`
              </Typography> */}
            </Box>
            <Box className={styles.chartChip}>
              <PaidRoundedIcon className={styles.chartChipIcon} />
              <Typography className={styles.chartChipText}>Income vs expenses</Typography>
            </Box>
          </Stack>

          <Box className={styles.muiChartWrap}>
            <BarChart
              height={250}
              xAxis={[
                {
                  scaleType: 'band',
                  data: monthlyIncomeLabels,
                },
              ]}
              series={[
                {
                  data: monthlyIncomeValues,
                  label: 'Income',
                  color: '#2f6db3',
                  valueFormatter: (value: number | null) =>
                    value == null ? '' : `P${value.toLocaleString('en-US')}`,
                },
                {
                  data: monthlyExpenseValues,
                  label: 'Expenses',
                  color: '#df6d5d',
                  valueFormatter: (value: number | null) =>
                    value == null ? '' : `P${value.toLocaleString('en-US')}`,
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 18, left: 42 }}
            />
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            className={styles.chartSummaryRow}
          >
            <Typography className={styles.chartSummaryText}>
              Highest expense month: {highestExpenseMonth}
            </Typography>
            <Typography className={styles.chartSummaryValue}>
              P{highestMonthlyExpense.toLocaleString('en-US')}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashBoardCharts;
