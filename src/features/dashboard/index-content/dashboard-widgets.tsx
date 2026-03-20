import { FunctionComponent, JSX } from 'react';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';

import styles from '../style.scss.module.scss';
import { DashboardStateprops } from '../api/types';

const DashBoardWidgets: FunctionComponent<DashboardStateprops> = (
  props: DashboardStateprops
): JSX.Element => {
  const { state } = props;

  const widgets = [
    {
      label: 'Total Patients',
      value: state?.totalPatients ?? 0,
      icon: <Groups2RoundedIcon />,
      accentClassName: styles.metricAccentBlue,
    },
    {
      label: 'Patients Today',
      value: state?.patientsToday ?? 0,
      icon: <PersonAddAlt1RoundedIcon />,
      accentClassName: styles.metricAccentCoral,
    },
    {
      label: 'Scheduled Appointment',
      value: state?.scheduledAppointments ?? 0,
      icon: <NotificationsActiveRoundedIcon />,
      accentClassName: styles.metricAccentCyan,
    },
    {
      label: 'Pending Appointment',
      value: state?.pendingAppointments ?? 0,
      icon: <HourglassEmptyRoundedIcon />,
      accentClassName: styles.metricAccentBlue,
    },
    {
      label: 'Income Today',
      value: `P${Number(state?.incomeToday ?? 0).toLocaleString('en-US')}`,
      icon: <AttachMoneyRoundedIcon />,
      accentClassName: styles.metricAccentGreen,
    },
    {
      label: 'Monthly Income',
      value: `P${Number(state?.totalIncomeMonthly ?? 0).toLocaleString('en-US')}`,
      icon: <SavingsRoundedIcon />,
      accentClassName: styles.metricAccentGold,
    },
  ];

  return (
    <div className={styles.metricsGrid}>
      {widgets.map((widget) => (
        <article key={widget.label} className={styles.metricCard}>
          <div className={`${styles.metricIconWrap} ${widget.accentClassName}`}>{widget.icon}</div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>{widget.label}</span>
            <span className={styles.metricValue}>{widget.value}</span>
          </div>
        </article>
      ))}
    </div>
  );
};

export default DashBoardWidgets;
