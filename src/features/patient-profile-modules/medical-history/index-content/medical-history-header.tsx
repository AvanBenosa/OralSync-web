import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PatientMedicalHistoryStateProps } from '../api/types';
import styles from '../../styles.module.scss';

const PatientMedicalHistoryHeader: FunctionComponent<PatientMedicalHistoryStateProps> = (
  props: PatientMedicalHistoryStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerTitleWrap}>
          <DescriptionOutlinedIcon className={styles.headerTitleIcon} />
          <h3 className={styles.headerTitle}>Medical History</h3>
        </div>
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.tabReloadButton}`}
            onClick={(): void => {
              onReload?.();
            }}
            disabled={state.load}
            title="Reload medical history"
            aria-label="Reload medical history"
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
            Add Medical History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalHistoryHeader;
