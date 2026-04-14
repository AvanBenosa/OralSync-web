import { FunctionComponent, JSX, useEffect, useState } from 'react';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

import {
  HandleGetExpenseBreakdown,
  HandleGetOutstandingBalances,
  HandleGetProfitLoss,
  HandleGetRevenueSummary,
} from '../api/handlers';
import type {
  ExpenseBreakdownModel,
  OutstandingBalancesModel,
  ProfitLossModel,
  ReportFilter,
  RevenueSummaryModel,
} from '../api/types';

type Props = {
  clinicId?: string | null;
  filter: ReportFilter;
};

const fmt = (v: number): string => `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LoadingPlaceholder = (): JSX.Element => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
    <CircularProgress size={28} />
  </Box>
);

const EmptyState = ({ label }: { label: string }): JSX.Element => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
    <Typography color="text.secondary" variant="body2">{label}</Typography>
  </Box>
);

const ReportsFinance: FunctionComponent<Props> = ({ clinicId, filter }): JSX.Element => {
  const [revenue, setRevenue] = useState<RevenueSummaryModel | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [expenses, setExpenses] = useState<ExpenseBreakdownModel | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [balances, setBalances] = useState<OutstandingBalancesModel | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);

  const [pnl, setPnl] = useState<ProfitLossModel | null>(null);
  const [pnlLoading, setPnlLoading] = useState(true);

  useEffect(() => {
    void HandleGetRevenueSummary(setRevenue, setRevenueLoading, clinicId, filter, true);
    void HandleGetExpenseBreakdown(setExpenses, setExpensesLoading, clinicId, filter, true);
    void HandleGetOutstandingBalances(setBalances, setBalancesLoading, clinicId, filter, true);
    void HandleGetProfitLoss(setPnl, setPnlLoading, clinicId, filter, true);
  }, [clinicId, filter]);

  return (
    <Stack spacing={3}>
      {/* Summary KPI Cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          {
            label: 'Total Billed',
            value: revenue ? fmt(revenue.totalBilled) : '—',
            icon: <ReceiptLongRoundedIcon sx={{ color: '#3b75ac' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Total Collected',
            value: revenue ? fmt(revenue.totalCollected) : '—',
            icon: <AccountBalanceWalletRoundedIcon sx={{ color: '#2E6F40' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Outstanding Balance',
            value: revenue ? fmt(revenue.totalOutstanding) : '—',
            icon: <TrendingUpRoundedIcon sx={{ color: '#df6d5d' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Net Profit',
            value: pnl ? fmt(pnl.netProfit) : '—',
            icon: <ShowChartRoundedIcon sx={{ color: pnl && pnl.netProfit >= 0 ? '#2E6F40' : '#df6d5d' }} />,
            loading: pnlLoading,
          },
        ].map((item) => (
          <Card key={item.label} sx={{ flex: '1 1 180px', minWidth: 160 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                {item.icon}
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
              {item.loading ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="h6" fontWeight={700} noWrap>
                  {item.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Revenue by Month Chart */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Revenue by Month
          </Typography>
          {revenueLoading ? (
            <LoadingPlaceholder />
          ) : !revenue?.byMonth?.length ? (
            <EmptyState label="No revenue data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: revenue.byMonth.map((m) => m.month) }]}
              series={[
                {
                  data: revenue.byMonth.map((m) => m.billed),
                  label: 'Billed',
                  color: '#3b75ac',
                  valueFormatter: (v) => (v == null ? '' : fmt(v)),
                },
                {
                  data: revenue.byMonth.map((m) => m.collected),
                  label: 'Collected',
                  color: '#2E6F40',
                  valueFormatter: (v) => (v == null ? '' : fmt(v)),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
            />
          )}
        </CardContent>
      </Card>

      {/* P&L Chart */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Profit & Loss by Month
          </Typography>
          {pnlLoading ? (
            <LoadingPlaceholder />
          ) : !pnl?.byMonth?.length ? (
            <EmptyState label="No profit/loss data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: pnl.byMonth.map((m) => m.month) }]}
              series={[
                {
                  data: pnl.byMonth.map((m) => m.revenue),
                  label: 'Revenue',
                  color: '#2E6F40',
                  valueFormatter: (v) => (v == null ? '' : fmt(v)),
                },
                {
                  data: pnl.byMonth.map((m) => m.expenses),
                  label: 'Expenses',
                  color: '#df6d5d',
                  valueFormatter: (v) => (v == null ? '' : fmt(v)),
                },
                {
                  data: pnl.byMonth.map((m) => m.net),
                  label: 'Net',
                  color: '#8e44ad',
                  valueFormatter: (v) => (v == null ? '' : fmt(v)),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Expenses by Category
            </Typography>
            {expensesLoading ? (
              <LoadingPlaceholder />
            ) : !expenses?.byCategory?.length ? (
              <EmptyState label="No expense data for the selected period." />
            ) : (
              <PieChart
                height={240}
                series={[
                  {
                    data: expenses.byCategory.map((c, i) => ({
                      id: i,
                      value: c.amount,
                      label: c.category.replace(/([a-z])([A-Z])/g, '$1 $2'),
                    })),
                    valueFormatter: ({ value }) => fmt(value ?? 0),
                    innerRadius: 40,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              />
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Expenses by Month
            </Typography>
            {expensesLoading ? (
              <LoadingPlaceholder />
            ) : !expenses?.byMonth?.length ? (
              <EmptyState label="No expense data for the selected period." />
            ) : (
              <BarChart
                height={240}
                xAxis={[{ scaleType: 'band', data: expenses.byMonth.map((m) => m.month) }]}
                series={[
                  {
                    data: expenses.byMonth.map((m) => m.amount),
                    label: 'Expenses',
                    color: '#df6d5d',
                    valueFormatter: (v) => (v == null ? '' : fmt(v)),
                  },
                ]}
                grid={{ horizontal: true }}
                margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
              />
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Outstanding Balances Table */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              Outstanding Balances
            </Typography>
            {balances && (
              <Typography variant="body2" color="text.secondary">
                {balances.totalPatients} {balances.totalPatients === 1 ? 'patient' : 'patients'} &nbsp;·&nbsp;
                Total: <strong>{fmt(balances.totalOutstanding)}</strong>
              </Typography>
            )}
          </Stack>
          <Divider sx={{ mb: 1 }} />
          {balancesLoading ? (
            <LoadingPlaceholder />
          ) : !balances?.items?.length ? (
            <EmptyState label="No outstanding balances found." />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient #</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Last Visit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {balances.items.map((item) => (
                    <TableRow key={item.patientId} hover>
                      <TableCell>{item.patientNumber}</TableCell>
                      <TableCell>{item.fullName}</TableCell>
                      <TableCell align="right" sx={{ color: '#df6d5d', fontWeight: 600 }}>
                        {fmt(item.totalBalance)}
                      </TableCell>
                      <TableCell>
                        {item.lastVisit
                          ? new Date(item.lastVisit).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ReportsFinance;
