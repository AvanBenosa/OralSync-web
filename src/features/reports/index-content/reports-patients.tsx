import { FunctionComponent, JSX, useEffect, useState } from 'react';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

import { HandleGetPatientDemographics, HandleGetPatientGrowth } from '../api/handlers';
import type { PatientDemographicsModel, PatientGrowthModel, ReportFilter } from '../api/types';

type Props = {
  clinicId?: string | null;
  filter: ReportFilter;
};

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

const ReportsPatients: FunctionComponent<Props> = ({ clinicId, filter }): JSX.Element => {
  const [growth, setGrowth] = useState<PatientGrowthModel | null>(null);
  const [growthLoading, setGrowthLoading] = useState(true);

  const [demographics, setDemographics] = useState<PatientDemographicsModel | null>(null);
  const [demographicsLoading, setDemographicsLoading] = useState(true);

  useEffect(() => {
    void HandleGetPatientGrowth(setGrowth, setGrowthLoading, clinicId, filter, true);
    void HandleGetPatientDemographics(setDemographics, setDemographicsLoading, clinicId, filter, true);
  }, [clinicId, filter]);

  return (
    <Stack spacing={3}>
      {/* Summary KPI Cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          {
            label: 'Total Patients',
            value: growth ? growth.totalPatients.toLocaleString() : '—',
            icon: <GroupRoundedIcon sx={{ color: '#3b75ac' }} />,
            loading: growthLoading,
          },
          {
            label: 'New in Period',
            value: growth ? growth.newThisPeriod.toLocaleString() : '—',
            icon: <PersonAddRoundedIcon sx={{ color: '#2E6F40' }} />,
            loading: growthLoading,
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
                <Typography variant="h6" fontWeight={700}>
                  {item.value}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Patient Growth Chart */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            New Patients by Month
          </Typography>
          {growthLoading ? (
            <LoadingPlaceholder />
          ) : !growth?.byMonth?.length ? (
            <EmptyState label="No patient data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: growth.byMonth.map((m) => m.month) }]}
              series={[
                {
                  data: growth.byMonth.map((m) => m.newPatients),
                  label: 'New Patients',
                  color: '#3b75ac',
                },
                {
                  data: growth.byMonth.map((m) => m.cumulative),
                  label: 'Cumulative',
                  color: '#2E6F40',
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 8, right: 12, bottom: 40, left: 50 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              By Gender
            </Typography>
            {demographicsLoading ? (
              <LoadingPlaceholder />
            ) : !demographics?.byGender?.length ? (
              <EmptyState label="No gender data available." />
            ) : (
              <PieChart
                height={220}
                series={[
                  {
                    data: demographics.byGender.map((g, i) => ({
                      id: i,
                      value: g.count,
                      label: g.label,
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

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              By Age Group
            </Typography>
            {demographicsLoading ? (
              <LoadingPlaceholder />
            ) : !demographics?.byAgeGroup?.length ? (
              <EmptyState label="No age data available." />
            ) : (
              <BarChart
                layout="horizontal"
                height={220}
                yAxis={[
                  {
                    scaleType: 'band',
                    data: demographics.byAgeGroup.map((g) => g.label),
                    width: 100,
                  },
                ]}
                series={[
                  {
                    data: demographics.byAgeGroup.map((g) => g.count),
                    label: 'Patients',
                    color: '#8e44ad',
                  },
                ]}
                grid={{ vertical: true }}
                margin={{ top: 8, right: 20, bottom: 8, left: 20 }}
              />
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              By Patient Tag
            </Typography>
            {demographicsLoading ? (
              <LoadingPlaceholder />
            ) : !demographics?.byTag?.length ? (
              <EmptyState label="No tag data available." />
            ) : (
              <PieChart
                height={220}
                series={[
                  {
                    data: demographics.byTag.map((g, i) => ({
                      id: i,
                      value: g.count,
                      label: g.label,
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
      </Stack>
    </Stack>
  );
};

export default ReportsPatients;
