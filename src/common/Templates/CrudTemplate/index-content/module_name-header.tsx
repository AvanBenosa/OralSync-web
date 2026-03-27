// TODO: Replace MODULE_NAME, module_name, MODULE_NOUN, MODULE_ICON tokens.

import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import type { MODULE_NAMEStateProps } from '../api/types';
import styles from '../style.scss.module.scss';

const MODULE_NAMEHeader: FunctionComponent<MODULE_NAMEStateProps> = (
  props: MODULE_NAMEStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const recordCount = state.totalItem;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          {/* <MODULE_ICON className={styles.headerIconSvg} /> */}
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>MODULE_NOUN</h2>
            <span className={styles.headerBadge}>
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.searchForm}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search ..." // TODO: update placeholder text
            value={String(state.search ?? '')}
            onChange={(event): void =>
              setState({ ...state, search: event.target.value, pageStart: 0 })
            }
          />
          <div className={styles.headerActionControls}>
            <button
              type="button"
              className={styles.reloadButton}
              onClick={(): void => onReload?.()}
              disabled={state.load}
              title="Reload records"
              aria-label="Reload records"
            >
              <RefreshRoundedIcon className={styles.reloadIcon} />
            </button>
            <div className={styles.buttonContainer}>
              <button
                title="Add record"
                type="button"
                className={`${styles.actionPillButton} ${styles.addInventoryButton}`}
                aria-label="Add record"
                onClick={(): void =>
                  setState({
                    ...state,
                    openModal: true,
                    isDelete: false,
                    isUpdate: false,
                    selectedItem: undefined,
                  })
                }
              >
                <AddRoundedIcon className={styles.pillActionIcon} />
                <span>Add MODULE_NOUN</span> {/* TODO: update button label */}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MODULE_NAMEHeader;
