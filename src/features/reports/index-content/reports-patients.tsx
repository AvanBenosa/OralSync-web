import { FunctionComponent, JSX, useEffect, useState } from 'react';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

import { HandleGetPatientDemographics, HandleGetPatientGrowth } from '../api/handlers';
import type { PatientDemographicsModel, PatientGrowthModel, ReportFilter } from '../api/types';
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

const ReportsPatients: FunctionComponent<Props> = ({ clinicId, filter }): JSX.Element => {
  const [growth, setGrowth] = useState<PatientGrowthModel | null>(null);
  const [growthLoading, setGrowthLoading] = useState(true);

  const [demographics, setDemographics] = useState<PatientDemographicsModel | null>(null);
  const [demographicsLoading, setDemographicsLoading] = useState(true);

  useEffect(() => {
    void HandleGetPatientGrowth(setGrowth, setGrowthLoading, clinicId, filter, true);
    void HandleGetPatientDemographics(
      setDemographics,
      setDemographicsLoading,
      clinicId,
      filter,
      true
    );
  }, [clinicId, filter]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {[
          {
            label: 'Total Patients',
            value: growth ? growth.totalPatients.toLocaleString() : '--',
            icon: <GroupRoundedIcon sx={{ color: '#3b75ac' }} />,
            loading: growthLoading,
          },
          {
            label: 'New in Period',
            value: growth ? growth.newThisPeriod.toLocaleString() : '--',
            icon: <PersonAddRoundedIcon sx={{ color: '#2e6f40' }} />,
            loading: growthLoading,
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
            New Patients by Month
          </Typography>
          {growthLoading ? (
            <ReportsLoadingPlaceholder />
          ) : !growth?.byMonth?.length ? (
            <ReportsEmptyState label="No patient data for the selected period." />
          ) : (
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: growth.byMonth.map((month) => month.month) }]}
              series={[
                {
                  data: growth.byMonth.map((month) => month.newPatients),
                  label: 'New Patients',
                  color: '#3b75ac',
                },
                {
                  data: growth.byMonth.map((month) => month.cumulative),
                  label: 'Cumulative',
                  color: '#2e6f40',
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
              By Gender
            </Typography>
            {demographicsLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !demographics?.byGender?.length ? (
              <ReportsEmptyState label="No gender data available." />
            ) : (
              <PieChart
                height={220}
                series={[
                  {
                    data: demographics.byGender.map((item, index) => ({
                      id: index,
                      value: item.count,
                      label: item.label,
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
              By Age Group
            </Typography>
            {demographicsLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !demographics?.byAgeGroup?.length ? (
              <ReportsEmptyState label="No age data available." />
            ) : (
              <BarChart
                layout="horizontal"
                height={220}
                yAxis={[
                  {
                    scaleType: 'band',
                    data: demographics.byAgeGroup.map((item) => item.label),
                    width: 100,
                  },
                ]}
                series={[
                  {
                    data: demographics.byAgeGroup.map((item) => item.count),
                    label: 'Patients',
                    color: '#2d58a6',
                  },
                ]}
                grid={{ vertical: true }}
                margin={{ top: 8, right: 20, bottom: 8, left: 20 }}
              />
            )}
          </CardContent>
        </Card>

        <Card sx={{ ...reportPanelCardSx, flex: 1 }}>
          <CardContent>
            <Typography gutterBottom sx={reportSectionTitleSx}>
              By Patient Tag
            </Typography>
            {demographicsLoading ? (
              <ReportsLoadingPlaceholder />
            ) : !demographics?.byTag?.length ? (
              <ReportsEmptyState label="No tag data available." />
            ) : (
              <PieChart
                height={220}
                series={[
                  {
                    data: demographics.byTag.map((item, index) => ({
                      id: index,
                      value: item.count,
                      label: item.label,
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
