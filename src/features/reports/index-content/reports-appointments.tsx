import { FunctionComponent, JSX, useEffect, useState } from 'react';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

import { HandleGetAppointmentFunnel, HandleGetAppointmentVolume } from '../api/handlers';
import type { AppointmentFunnelModel, AppointmentVolumeModel, ReportFilter } from '../api/types';
import {
  ReportsEmptyState,
  ReportsLoadingPlaceholder,
  reportMetricCardSx,
  reportMetricIconWrapSx,
  reportPanelCardSx,
  reportSectionTitleSx,
} from './reports-ui';

type Props = {
  clinicId?: string | null;
  filter: ReportFilter;
};

const ReportsAppointments: FunctionComponent<Props> = ({ clinicId, filter }): JSX.Element => {
  const [volume, setVolume] = useState<AppointmentVolumeModel | null>(null);
  const [volumeLoading, setVolumeLoading] = useState(true);

  const [funnel, setFunnel] = useState<AppointmentFunnelModel | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);

  useEffect(() => {
    void HandleGetAppointmentVolume(setVolume, setVolumeLoading, clinicId, filter, true);
    void HandleGetAppointmentFunnel(setFunnel, setFunnelLoading, clinicId, filter, true);
  }, [clinicId, filter]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          {
            label: 'Total Appointments',
            value: volume ? volume.totalAppointments.toLocaleString() : '--',
            icon: <EventRoundedIcon sx={{ color: '#3b75ac' }} />,
            loading: volumeLoading,
          },
          {
            label: 'Completion Rate',
            value: funnel ? `${funnel.completionRate}%` : '--',
            icon: <CheckCircleRoundedIcon sx={{ color: '#2e6f40' }} />,
            loading: funnelLoading,
          },
          {
            label: 'No-Show Rate',
            value: funnel ? `${funnel.noShowRate}%` : '--',
            icon: <CancelRoundedIcon sx={{ color: '#df6d5d' }} />,
            loading: funnelLoading,
          },
          {
            label: 'Cancellation Rate',
            value: funnel ? `${funnel.cancellationRate}%` : '--',
            icon: <CancelRoundedIcon sx={{ color: '#e67e22' }} />,
            loading: funnelLoading,
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
                <Typography variant="h6" fontWeight={800} color="#173e67">
                  {item.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card sx={reportPanelCardSx}>
        <CardContent>
          <Typography gutterBottom sx={reportSectionTitleSx}>
            Appointments by Month
          </Typography>
          {volumeLoading ? (
            <ReportsLoadingPlaceholder />
          ) : !volume?.byMonth?.length ? (
            <ReportsEmptyState label="No appointment data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: volume.byMonth.map((month) => month.month) }]}
              series={[
                {
                  data: volume.byMonth.map((month) => month.count),
                  label: 'Appointments',
                  color: '#3b75ac',
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 50 }}
            />
          )}
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ ...reportPanelCardSx, flex: 1 }}>
          <CardContent>
            <Typography gutterBottom sx={reportSectionTitleSx}>
              By Appointment Type
            </Typography>
            {volumeLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !volume?.byType?.length ? (
              <ReportsEmptyState label="No type data available." />
            ) : (
              <PieChart
                height={220}
                series={[
                  {
                    data: volume.byType.map((item, index) => ({
                      id: index,
                      value: item.count,
                      label: item.type,
                    })),
                    innerRadius: 30,
                    outerRadius: 80,
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
              Status Breakdown
            </Typography>
            {funnelLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !funnel || funnel.total === 0 ? (
              <ReportsEmptyState label="No appointment status data available." />
            ) : (
              <Stack spacing={1.5} mt={1}>
                {[
                  { label: 'Completed', value: funnel.completed, color: '#2e6f40' },
                  { label: 'Scheduled', value: funnel.scheduled, color: '#3b75ac' },
                  { label: 'Pending', value: funnel.confirmed, color: '#f39c12' },
                  { label: 'Cancelled', value: funnel.cancelled, color: '#e67e22' },
                  { label: 'No-Show', value: funnel.noShow, color: '#df6d5d' },
                ].map((row) => (
                  <Box key={row.label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="#355b80" fontWeight={600}>
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#173e67">
                        {row.value} (
                        {funnel.total > 0 ? Math.round((row.value / funnel.total) * 100) : 0}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={funnel.total > 0 ? (row.value / funnel.total) * 100 : 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e8eff5',
                        '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 4 },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
};

export default ReportsAppointments;
