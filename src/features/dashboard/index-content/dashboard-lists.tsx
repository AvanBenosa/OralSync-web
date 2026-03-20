import { FunctionComponent, JSX, useState } from 'react';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  DashboardAppointmentModel,
  DashboardPatientItemModel,
  DashboardStateprops,
} from '../api/types';
import styles from '../style.scss.module.scss';

type ListCardProps = {
  icon: JSX.Element;
  items: Array<DashboardAppointmentModel | DashboardPatientItemModel>;
  title: string;
  emptyText: string;
  kind: 'patients' | 'appointments';
  onSelectPatient?: (patient: DashboardPatientItemModel) => void;
};

const renderItem = (
  item: DashboardAppointmentModel | DashboardPatientItemModel,
  kind: 'patients' | 'appointments',
  onSelectPatient?: (patient: DashboardPatientItemModel) => void
): JSX.Element => {
  if (kind === 'patients') {
    const patient = item as DashboardPatientItemModel;

    return (
      <button
        type="button"
        className={styles.patientRowButton}
        onClick={() => {
          onSelectPatient?.(patient);
        }}
      >
        <div className={styles.dashboardListPrimaryRow}>
          <Typography className={styles.dashboardListName}>{patient.fullName ?? '--'}</Typography>
        </div>
        <Typography className={styles.dashboardListReason}>
          {patient.latestActivity ?? 'No recent activity'}
        </Typography>
      </button>
    );
  }

  const appointment = item as DashboardAppointmentModel;

  return (
    <>
      <div className={styles.dashboardListPrimaryRow}>
        <Typography className={styles.dashboardListName}>{appointment.fullName ?? '--'}</Typography>
        <Typography className={styles.dashboardListTime}>{appointment.time ?? '--'}</Typography>
      </div>
      <Typography className={styles.dashboardListReason}>
        {appointment.reason ?? 'No appointment reason'}
      </Typography>
    </>
  );
};

const ListCard: FunctionComponent<ListCardProps> = ({
  title,
  items,
  icon,
  emptyText,
  kind,
  onSelectPatient,
}: ListCardProps): JSX.Element => (
  <Card className={styles.chartCard}>
    <CardContent className={styles.chartCardContent}>
      <div className={styles.dashboardListHeader}>
        <div className={styles.dashboardListTitleWrap}>
          <div className={styles.dashboardListIcon}>{icon}</div>
          <Typography className={styles.chartTitle}>{title}</Typography>
        </div>
        <Typography className={styles.dashboardListCount}>{items.length}</Typography>
      </div>

      <div className={styles.dashboardListBody}>
        {items.length > 0 ? (
          <Stack spacing={0}>
            {items.map((item, index) => (
              <div key={`${title}-${index}`} className={styles.dashboardListItem}>
                {renderItem(item, kind, onSelectPatient)}
              </div>
            ))}
          </Stack>
        ) : (
          <div className={styles.dashboardListEmpty}>
            <Typography className={styles.dashboardListEmptyText}>{emptyText}</Typography>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const DashBoardLists: FunctionComponent<DashboardStateprops> = (
  props: DashboardStateprops
): JSX.Element => {
  const { state } = props;
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<DashboardPatientItemModel | null>(null);

  const handleClosePatientDialog = (): void => {
    setSelectedPatient(null);
  };

  return (
    <>
      <div className={styles.dashboardListsGrid}>
        <ListCard
          title="Newly Added Patients"
          items={state?.latestPatients ?? []}
          icon={<GroupAddRoundedIcon />}
          emptyText="No newly added patients yet."
          kind="patients"
          onSelectPatient={(patient) => {
            setSelectedPatient(patient);
          }}
        />
        <ListCard
          title="Appointment Today"
          items={state?.todayAppointment ?? []}
          icon={<EventAvailableRoundedIcon />}
          emptyText="No appointments scheduled for today."
          kind="appointments"
        />
        <ListCard
          title="Appointment Next Day"
          items={state?.nextDayAppointment ?? []}
          icon={<ScheduleRoundedIcon />}
          emptyText="No appointments scheduled for the next day."
          kind="appointments"
        />
      </div>

      <Dialog
        open={Boolean(selectedPatient)}
        onClose={handleClosePatientDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Open Patient Profile</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4f6983', lineHeight: 1.7 }}>
            {selectedPatient?.fullName || 'This patient'} will be opened in the patient profile
            page. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePatientDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const patientId = selectedPatient?.id?.trim();

              if (patientId) {
                navigate(`/patient-profile/${patientId}`);
              }

              handleClosePatientDialog();
            }}
          >
            Open Profile
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashBoardLists;
