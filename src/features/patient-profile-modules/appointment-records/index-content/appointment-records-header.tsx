import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PatientAppointmentRecordStateProps } from '../api/types';
import styles from '../../styles.module.scss';

const PatientAppointmentRecordsHeader: FunctionComponent<PatientAppointmentRecordStateProps> = (
  props: PatientAppointmentRecordStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleWrap}>
            <EventAvailableRoundedIcon className={styles.headerTitleIcon} />
            <h3 className={styles.headerTitle}>Appointment Records</h3>
          </div>
          <span className={styles.headerBadge}>
            {state.items.length} {state.items.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.tabReloadButton}`}
            onClick={(): void => {
              onReload?.();
            }}
            disabled={state.load}
            title="Reload appointment records"
            aria-label="Reload appointment records"
          >
            <RefreshRoundedIcon className={styles.reloadButtonIcon} />
          </button>
          <button
            type="button"
            className={styles.addButton}
            onClick={(): void =>
              setState((prevState: typeof state) => ({
                ...prevState,
                selectedItem: undefined,
                isUpdate: false,
                isDelete: false,
                openModal: true,
              }))
            }
          >
            <AddRoundedIcon className={styles.addButtonIcon} />
            Add Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentRecordsHeader;
