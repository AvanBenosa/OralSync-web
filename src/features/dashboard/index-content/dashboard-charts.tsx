import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import { Box, Card, CardContent, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts';

import { GetAppointments } from '../../appointment/appointment-request/api/api';
import { AppointmentStateModel } from '../../appointment/appointment-request/api/types';
import { DashboardStateprops } from '../api/types';
import styles from '../style.scss.module.scss';

const calendarWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DashBoardCharts: FunctionComponent<DashboardStateprops> = (
  props: DashboardStateprops
): JSX.Element => {
  const { state } = props;
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [monthlyAppointments, setMonthlyAppointments] = useState<
    Array<{ appointmentDateFrom?: string | Date }>
  >([]);
  const monthlyIncome = state?.monthlyIncome ?? [];
  const monthlyRevenue = state?.monthlyRevenue ?? [];
  const monthlyIncomeLabels = monthlyIncome.map((item) => item.month ?? '--');
  const monthlyIncomeValues = monthlyIncome.map((item) => item.income ?? 0);
  const monthlyExpenseValues = monthlyIncome.map((item) => item.expenses ?? 0);

  const currentMonthLabel = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
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

  const calendarDays = useMemo(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());

    const counts = new Map<string, number>();

    monthlyAppointments.forEach((item) => {
      if (!item.appointmentDateFrom) {
        return;
      }

      const sourceDate =
        item.appointmentDateFrom instanceof Date
          ? item.appointmentDateFrom
          : new Date(item.appointmentDateFrom);

      if (
        Number.isNaN(sourceDate.getTime()) ||
        sourceDate.getFullYear() !== today.getFullYear() ||
        sourceDate.getMonth() !== today.getMonth()
      ) {
        return;
      }

      const key = `${sourceDate.getFullYear()}-${sourceDate.getMonth()}-${sourceDate.getDate()}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      return {
        label: date.getDate(),
        count: counts.get(key) || 0,
        isCurrentMonth: date >= monthStart && date <= monthEnd,
        isToday:
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate(),
      };
    });
  }, [monthlyAppointments]);

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
                <Typography className={styles.chartChipText}>{currentMonthLabel}</Typography>
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
            <>
              <Box className={styles.calendarHeader}>
                {calendarWeekLabels.map((day) => (
                  <Typography key={day} className={styles.calendarDayLabel}>
                    {day}
                  </Typography>
                ))}
              </Box>

              <Box
                className={`${styles.calendarGrid} ${
                  isCalendarExpanded ? styles.calendarGridExpanded : styles.calendarGridCompact
                }`}
              >
                {calendarDays.map((day, index) => (
                  <Box
                    key={`${day.label}-${index}`}
                    className={`${styles.calendarCell} ${
                      isCalendarExpanded ? styles.calendarCellExpanded : styles.calendarCellCompact
                    }`}
                    sx={{
                      opacity: day.isCurrentMonth ? 1 : 0.42,
                      background: day.isToday
                        ? 'linear-gradient(180deg, rgba(236, 245, 255, 0.99), rgba(214, 232, 252, 0.99))'
                        : day.count > 0
                        ? 'linear-gradient(180deg, rgba(244, 250, 255, 0.99), rgba(229, 241, 252, 0.99))'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(245,249,252,0.96))',
                      borderColor: day.isToday
                        ? 'rgba(47, 109, 179, 0.42)'
                        : day.count > 0
                        ? 'rgba(116, 169, 220, 0.42)'
                        : 'rgba(211, 223, 233, 0.95)',
                      boxShadow: day.isToday
                        ? '0 14px 24px rgba(49, 101, 164, 0.14)'
                        : day.count > 0
                        ? '0 10px 18px rgba(76, 128, 184, 0.1)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}
                    >
                      <Typography className={styles.calendarDate}>{day.label}</Typography>
                      <Box
                        className={`${styles.calendarCountBadge} ${
                          isCalendarExpanded
                            ? styles.calendarCountBadgeExpanded
                            : styles.calendarCountBadgeCompact
                        } ${
                          day.isToday
                            ? styles.calendarCountBadgeToday
                            : day.count > 0
                            ? styles.calendarCountBadgeActive
                            : styles.calendarCountBadgeIdle
                      }`}
                    >
                      <Typography className={styles.calendarCount}>{day.count}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
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
