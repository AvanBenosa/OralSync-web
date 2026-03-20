import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import type { AuthUser } from '../../../common/services/auth-api';
import AdminPageShell from '../components/admin-page-shell';
import AdminEmptyState from '../components/admin-empty-state';
import { handleGetAdminDashboard } from '../api/handlers';
import { AdminDashboardStateModel } from '../api/types';

export type AdminDashboardProps = {
  currentUser?: AuthUser | null;
};

const AdminDashboard: FunctionComponent<AdminDashboardProps> = ({
  currentUser,
}): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [state, setState] = useState<AdminDashboardStateModel>({
    item: null,
    load: true,
    error: '',
  });
  const lastLoadedRef = useRef(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = async (forceRefresh: boolean = false): Promise<void> => {
    if (forceRefresh) {
      setState((prev) => ({
        ...prev,
        load: true,
      }));
    }

    try {
      await handleGetAdminDashboard(setState, forceRefresh);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load the admin dashboard summary.',
      }));
    }
  };

  useEffect(() => {
    if (lastLoadedRef.current) {
      return;
    }

    lastLoadedRef.current = true;
    void loadDashboard(false);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadDashboard(true);
    }, 250);
  };

  const dashboard = state.item;
  const trendLabels = dashboard?.dailyPatientTrends?.map((item) => item.label || '--') ?? [];
  const trendClinicNames = Array.from(
    new Set(
      (dashboard?.dailyPatientTrends ?? []).flatMap((item) =>
        (item.clinics ?? []).map((clinic) => clinic.clinicName || 'Clinic')
      )
    )
  );
  const trendSeries = trendClinicNames.map((clinicName, index) => ({
    data: (dashboard?.dailyPatientTrends ?? []).map(
      (item) =>
        item.clinics.find((clinic) => (clinic.clinicName || 'Clinic') === clinicName)?.patientCount ?? 0
    ),
    label: clinicName,
    color: ['#2f6db3', '#4f8f6b', '#df6d5d', '#8b5cf6', '#d4a017', '#0097a7'][index % 6],
  }));

  return (
    <AdminPageShell
      title="Admin Portal"
      description="Monitor clinics, patient growth, and clinic owners from one system dashboard."
      loading={state.load}
      onReload={handleReload}
    >
      {state.error ? <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid rgba(22,50,79,0.08)', boxShadow: 'none' }}>
            <Typography sx={{ color: '#70869a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Clinics
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2rem' }, fontWeight: 800, color: '#17344f' }}>
              {dashboard?.totalClinics ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid rgba(22,50,79,0.08)', boxShadow: 'none' }}>
            <Typography sx={{ color: '#70869a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Doctors
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2rem' }, fontWeight: 800, color: '#17344f' }}>
              {dashboard?.totalDoctors ?? 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid rgba(22,50,79,0.08)', boxShadow: 'none' }}>
            <Typography sx={{ color: '#70869a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Patients
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2rem' }, fontWeight: 800, color: '#17344f' }}>
              {dashboard?.totalPatients ?? 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid rgba(22,50,79,0.08)', boxShadow: 'none', mb: 3 }}>
        <Typography sx={{ fontWeight: 800, color: '#17344f', mb: 1 }}>
          Current Session
        </Typography>
        <Typography sx={{ color: '#5d7489', wordBreak: 'break-word' }}>
          {currentUser?.name || currentUser?.userName || currentUser?.email || 'Admin account'}
        </Typography>
      </Paper>

      {state.load && !dashboard ? (
        <CircularProgress size={28} />
      ) : !dashboard || dashboard.clinics.length === 0 ? (
        <AdminEmptyState
          title="No clinic summary available"
          description="The admin dashboard summary endpoint is active, but there are no clinic records to display yet."
        />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: '1px solid rgba(22,50,79,0.08)',
                  boxShadow: 'none',
                  height: '100%',
                }}
              >
                <Typography sx={{ fontWeight: 800, color: '#17344f', mb: 0.5 }}>
                  Daily Patient Creation Per Clinic
                </Typography>
                <Typography sx={{ color: '#6a8094', fontSize: '0.9rem', mb: 2 }}>
                  Patient records created in the last 7 days, grouped by clinic.
                </Typography>

                {trendLabels.length === 0 || trendSeries.length === 0 ? (
                  <Typography sx={{ color: '#6a8094' }}>
                    No daily patient trend data available yet.
                  </Typography>
                ) : isMobile ? (
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {(dashboard?.dailyPatientTrends ?? []).map((trend, index) => {
                      const sortedClinics = [...(trend.clinics ?? [])].sort(
                        (left, right) => (right.patientCount ?? 0) - (left.patientCount ?? 0)
                      );
                      const totalPatientsForDay = sortedClinics.reduce(
                        (total, clinic) => total + (clinic.patientCount ?? 0),
                        0
                      );

                      return (
                        <Box
                          key={`${trend.date || trend.label || 'trend'}-${index}`}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid rgba(22,50,79,0.08)',
                            backgroundColor: '#fbfdff',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                              {trend.label || '--'}
                            </Typography>
                            <Typography sx={{ color: '#2f6db3', fontWeight: 800 }}>
                              {totalPatientsForDay} patient{totalPatientsForDay === 1 ? '' : 's'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'grid', gap: 0.8 }}>
                            {sortedClinics.map((clinic, clinicIndex) => (
                              <Box
                                key={`${clinic.clinicName || 'clinic'}-${clinicIndex}`}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: 0.6,
                                  borderTop:
                                    clinicIndex === 0 ? 'none' : '1px solid rgba(22,50,79,0.08)',
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: '#5d7489',
                                    fontSize: '0.88rem',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {clinic.clinicName || '--'}
                                </Typography>
                                <Typography sx={{ color: '#17344f', fontWeight: 800 }}>
                                  {clinic.patientCount ?? 0}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      height={isMobile ? 260 : 300}
                      width={isMobile ? 320 : Math.max(420, trendLabels.length * 70)}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: trendLabels,
                        },
                      ]}
                      series={trendSeries}
                      hideLegend={isMobile}
                      grid={{ horizontal: true }}
                      margin={{ top: 16, right: 20, bottom: 24, left: 42 }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: '1px solid rgba(22,50,79,0.08)',
                  boxShadow: 'none',
                  height: '100%',
                }}
              >
                <Typography sx={{ fontWeight: 800, color: '#17344f', mb: 0.5 }}>
                  Clinic Owners
                </Typography>
                <Typography sx={{ color: '#6a8094', fontSize: '0.9rem', mb: 2 }}>
                  Super admin owners linked to registered clinics.
                </Typography>

                {!dashboard.owners?.length ? (
                  <Typography sx={{ color: '#6a8094' }}>
                    No clinic owners available yet.
                  </Typography>
                ) : isMobile ? (
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {dashboard.owners.map((owner, index) => (
                      <Box
                        key={`${owner.emailAddress || owner.name || 'owner'}-${index}`}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid rgba(22,50,79,0.08)',
                          backgroundColor: '#fbfdff',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                          {owner.name || '--'}
                        </Typography>
                        <Typography sx={{ color: '#6a8094', fontSize: '0.8rem', wordBreak: 'break-word', mt: 0.25 }}>
                          {owner.emailAddress || '--'}
                        </Typography>
                        <Typography sx={{ color: '#17344f', fontSize: '0.85rem', mt: 1 }}>
                          {owner.clinicName || '--'}
                        </Typography>
                        <Typography sx={{ color: '#6a8094', fontSize: '0.82rem', mt: 0.35 }}>
                          {owner.contactNumber || '--'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 420 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Owner</TableCell>
                          <TableCell>Clinic</TableCell>
                          <TableCell>Contact</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboard.owners.map((owner, index) => (
                          <TableRow key={`${owner.emailAddress || owner.name || 'owner'}-${index}`}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                                {owner.name || '--'}
                              </Typography>
                              <Typography sx={{ color: '#6a8094', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                {owner.emailAddress || '--'}
                              </Typography>
                            </TableCell>
                            <TableCell>{owner.clinicName || '--'}</TableCell>
                            <TableCell>{owner.contactNumber || '--'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Typography sx={{ fontWeight: 800, color: '#17344f', mb: 1.5 }}>
            Clinic Breakdown
          </Typography>
          {isMobile ? (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {dashboard.clinics.map((item, index) => (
                <Box
                  key={item.id || `${item.clinicName || 'clinic'}-${index}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(22,50,79,0.08)',
                    backgroundColor: '#fbfdff',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, color: '#17344f', mb: 1 }}>
                    {item.clinicName || '--'}
                  </Typography>
                  <Grid container spacing={1.25}>
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Doctors
                      </Typography>
                      <Typography sx={{ color: '#17344f', fontWeight: 800 }}>
                        {item.doctorCount ?? 0}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Patients
                      </Typography>
                      <Typography sx={{ color: '#17344f', fontWeight: 800 }}>
                        {item.patientCount ?? 0}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.4 }}>
                        Privacy
                      </Typography>
                      <Chip
                        size="small"
                        label={item.isDataPrivacyAccepted ? 'Accepted' : 'Pending'}
                        color={item.isDataPrivacyAccepted ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.4 }}>
                        Lock
                      </Typography>
                      <Chip
                        size="small"
                        label={item.isLocked ? 'Locked' : 'Active'}
                        color={item.isLocked ? 'error' : 'primary'}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Clinic</TableCell>
                  <TableCell>Doctors</TableCell>
                  <TableCell>Patients</TableCell>
                  <TableCell>Privacy</TableCell>
                  <TableCell>Lock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboard.clinics.map((item, index) => (
                  <TableRow key={item.id || `${item.clinicName || 'clinic'}-${index}`}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                        {item.clinicName || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.doctorCount ?? 0}</TableCell>
                    <TableCell>{item.patientCount ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.isDataPrivacyAccepted ? 'Accepted' : 'Pending'}
                        color={item.isDataPrivacyAccepted ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.isLocked ? 'Locked' : 'Active'}
                        color={item.isLocked ? 'error' : 'primary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          )}
        </>
      )}
    </AdminPageShell>
  );
};

export default AdminDashboard;
