import { FunctionComponent, JSX, useEffect, useState } from 'react';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
import {
  formatCurrency,
  ReportsEmptyState,
  ReportsLoadingPlaceholder,
  reportMetricCardSx,
  reportMetricIconWrapSx,
  reportPanelCardSx,
  reportSectionTitleSx,
  reportTableBodyCellSx,
  reportTableContainerSx,
  reportTableHeaderCellSx,
} from './reports-ui';

type Props = {
  clinicId?: string | null;
  filter: ReportFilter;
};

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
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          {
            label: 'Total Billed',
            value: revenue ? formatCurrency(revenue.totalBilled) : '--',
            icon: <ReceiptLongRoundedIcon sx={{ color: '#3b75ac' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Total Collected',
            value: revenue ? formatCurrency(revenue.totalCollected) : '--',
            icon: <AccountBalanceWalletRoundedIcon sx={{ color: '#2e6f40' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Outstanding Balance',
            value: revenue ? formatCurrency(revenue.totalOutstanding) : '--',
            icon: <TrendingUpRoundedIcon sx={{ color: '#df6d5d' }} />,
            loading: revenueLoading,
          },
          {
            label: 'Net Profit',
            value: pnl ? formatCurrency(pnl.netProfit) : '--',
            icon: (
              <ShowChartRoundedIcon
                sx={{ color: pnl && pnl.netProfit >= 0 ? '#2e6f40' : '#df6d5d' }}
              />
            ),
            loading: pnlLoading,
          },
        ].map((item) => (
          <Card key={item.label} sx={reportMetricCardSx}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Box sx={reportMetricIconWrapSx}>{item.icon}</Box>
                <Typography variant="caption" color="#698097" fontWeight={700}>
                  {item.label}
                </Typography>
              </Stack>
              {item.loading ? (
                <ReportsLoadingPlaceholder minHeight={36} />
              ) : (
                <Typography variant="h6" fontWeight={800} color="#173e67" noWrap>
                  {item.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Card sx={reportPanelCardSx}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={reportSectionTitleSx}>Outstanding Balances</Typography>
            {balances && (
              <Typography variant="body2" color="#6d8298" fontWeight={600}>
                {balances.totalPatients} {balances.totalPatients === 1 ? 'patient' : 'patients'} |{' '}
                Total: <strong>{formatCurrency(balances.totalOutstanding)}</strong>
              </Typography>
            )}
          </Stack>
          <Divider sx={{ mb: 1 }} />
          {balancesLoading ? (
            <ReportsLoadingPlaceholder />
          ) : !balances?.items?.length ? (
            <ReportsEmptyState label="No outstanding balances found." />
          ) : (
            <TableContainer component={Paper} elevation={0} sx={reportTableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={reportTableHeaderCellSx}>Patient #</TableCell>
                    <TableCell sx={reportTableHeaderCellSx}>Full Name</TableCell>
                    <TableCell align="right" sx={reportTableHeaderCellSx}>
                      Balance
                    </TableCell>
                    <TableCell sx={reportTableHeaderCellSx}>Last Visit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {balances.items.map((item) => (
                    <TableRow key={item.patientId} hover>
                      <TableCell sx={reportTableBodyCellSx}>{item.patientNumber}</TableCell>
                      <TableCell
                        sx={{
                          ...reportTableBodyCellSx,
                          fontWeight: 700,
                          color: '#1f4467',
                        }}
                      >
                        {item.fullName}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          ...reportTableBodyCellSx,
                          color: '#df6d5d',
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(item.totalBalance)}
                      </TableCell>
                      <TableCell sx={reportTableBodyCellSx}>
                        {item.lastVisit
                          ? new Date(item.lastVisit).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Card sx={reportPanelCardSx}>
        <CardContent>
          <Typography gutterBottom sx={reportSectionTitleSx}>
            Revenue by Month
          </Typography>
          {revenueLoading ? (
            <ReportsLoadingPlaceholder />
          ) : !revenue?.byMonth?.length ? (
            <ReportsEmptyState label="No revenue data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: revenue.byMonth.map((month) => month.month) }]}
              series={[
                {
                  data: revenue.byMonth.map((month) => month.billed),
                  label: 'Billed',
                  color: '#3b75ac',
                  valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                },
                {
                  data: revenue.byMonth.map((month) => month.collected),
                  label: 'Collected',
                  color: '#2e6f40',
                  valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
            />
          )}
        </CardContent>
      </Card>

      <Card sx={reportPanelCardSx}>
        <CardContent>
          <Typography gutterBottom sx={reportSectionTitleSx}>
            Profit & Loss by Month
          </Typography>
          {pnlLoading ? (
            <ReportsLoadingPlaceholder />
          ) : !pnl?.byMonth?.length ? (
            <ReportsEmptyState label="No profit/loss data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: pnl.byMonth.map((month) => month.month) }]}
              series={[
                {
                  data: pnl.byMonth.map((month) => month.revenue),
                  label: 'Revenue',
                  color: '#2e6f40',
                  valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                },
                {
                  data: pnl.byMonth.map((month) => month.expenses),
                  label: 'Expenses',
                  color: '#df6d5d',
                  valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                },
                {
                  data: pnl.byMonth.map((month) => month.net),
                  label: 'Net',
                  color: '#2d58a6',
                  valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
            />
          )}
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ ...reportPanelCardSx, flex: 1 }}>
          <CardContent>
            <Typography gutterBottom sx={reportSectionTitleSx}>
              Expenses by Category
            </Typography>
            {expensesLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !expenses?.byCategory?.length ? (
              <ReportsEmptyState label="No expense data for the selected period." />
            ) : (
              <PieChart
                height={240}
                series={[
                  {
                    data: expenses.byCategory.map((category, index) => ({
                      id: index,
                      value: category.amount,
                      label: category.category.replace(/([a-z])([A-Z])/g, '$1 $2'),
                    })),
                    valueFormatter: ({ value }) => formatCurrency(value ?? 0),
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

        <Card sx={{ ...reportPanelCardSx, flex: 1 }}>
          <CardContent>
            <Typography gutterBottom sx={reportSectionTitleSx}>
              Expenses by Month
            </Typography>
            {expensesLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !expenses?.byMonth?.length ? (
              <ReportsEmptyState label="No expense data for the selected period." />
            ) : (
              <BarChart
                height={240}
                xAxis={[{ scaleType: 'band', data: expenses.byMonth.map((month) => month.month) }]}
                series={[
                  {
                    data: expenses.byMonth.map((month) => month.amount),
                    label: 'Expenses',
                    color: '#df6d5d',
                    valueFormatter: (value) => (value == null ? '' : formatCurrency(value)),
                  },
                ]}
                grid={{ horizontal: true }}
                margin={{ top: 8, right: 12, bottom: 40, left: 60 }}
              />
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
};

export default ReportsFinance;
