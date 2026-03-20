import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import styles from '../style.scss.module.scss';
import { DashboardStateprops } from '../api/types';

const DashBoardHeader: FunctionComponent<DashboardStateprops> = (
  props: DashboardStateprops
): JSX.Element => {
  const navigate = useNavigate();
  const { state, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <DashboardRoundedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.headerTitle}>Dashboard Overview</h3>
        </div>
      </div>
      <div className={styles.headerActions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.reloadButton}`}
          onClick={(): void => {
            onReload?.();
          }}
          disabled={state?.load}
          title="Reload dashboard"
        >
          <RefreshRoundedIcon className={styles.actionButtonIcon} />
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.appointmentButton}`}
          onClick={(): void => {
            toast.info('Appointment module is not available yet.');
          }}
        >
          <CalendarMonthRoundedIcon className={styles.actionButtonIcon} />
          Add Appointment
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.addPatientButton}`}
          onClick={(): void => {
            navigate('/patient');
          }}
        >
          <AddRoundedIcon className={styles.actionButtonIcon} />
          Add Patient
        </button>
      </div>
    </div>
  );
};

export default DashBoardHeader;
