import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { FunctionComponent, JSX } from 'react';

import styles from '../../styles.module.scss';
import { PatientFormStateProps } from '../api/types';

const PatientFormsHeader: FunctionComponent<PatientFormStateProps> = (
  props: PatientFormStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleWrap}>
            <DescriptionOutlinedIcon className={styles.headerTitleIcon} />
            <h3 className={styles.headerTitle}>Forms</h3>
          </div>
          <span className={styles.headerBadge}>
            {state.items.length} form{state.items.length === 1 ? '' : 's'}
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
            title="Reload forms"
            aria-label="Reload forms"
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
                isView: false,
                openModal: true,
              }))
            }
          >
            <AddRoundedIcon className={styles.addButtonIcon} />
            Add Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientFormsHeader;
