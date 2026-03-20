import { FunctionComponent, JSX } from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PatientOverViewStateProps } from '../api/types';
import styles from '../../styles.module.scss';

const OverViewHeader: FunctionComponent<PatientOverViewStateProps> = (
  props: PatientOverViewStateProps
): JSX.Element => {
  const { state, onReload } = props;
  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleWrap}>
            <DescriptionOutlinedIcon className={styles.headerTitleIcon} />
            <h3 className={styles.headerTitle}>Overview</h3>
          </div>
          <div className={styles.legendGroup} aria-label="Payment status legend">
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendSwatch} ${styles.pendingSwatch}`}
                aria-hidden="true"
              />
              <span className={styles.legendLabel}>Pending balance</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.paidSwatch}`} aria-hidden="true" />
              <span className={styles.legendLabel}>Fully paid</span>
            </div>
          </div>
        </div>
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.tabReloadButton}`}
            onClick={(): void => {
              onReload?.();
            }}
            disabled={state.load}
            title="Reload overview"
            aria-label="Reload overview"
          >
            <RefreshRoundedIcon className={styles.reloadButtonIcon} />
          </button>
        </div>
        {/* <button
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
          Add Payment
        </button> */}
      </div>
    </div>
  );
};

export default OverViewHeader;
