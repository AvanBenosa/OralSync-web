import { ChangeEvent, FunctionComponent, JSX } from 'react';
import AddIcon from '@mui/icons-material/Add';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import styles from '../style.scss.module.scss';
import {
  DENTAL_LAB_CASE_STATUS_OPTIONS,
  DentalLabCaseStateProps,
  getDentalLabCaseStatusLabel,
} from '../api/types';

const DentalLabCasesHeader: FunctionComponent<DentalLabCaseStateProps> = (
  props: DentalLabCaseStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <BiotechRoundedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Dental Lab Cases</h2>
            <span className={styles.headerBadge}>
              {state.totalItem} {state.totalItem === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.searchForm}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Enter keyword ..."
            value={String(state.search ?? '')}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              setState((prev) => ({
                ...prev,
                search: event.target.value,
                pageStart: 0,
              }))
            }
          />
          <div className={styles.headerActionControls}>
            <select
              className={styles.filterSelect}
              value={state.statusFilter ?? 'All'}
              onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                setState((prev) => ({
                  ...prev,
                  statusFilter: event.target.value as typeof prev.statusFilter,
                  pageStart: 0,
                }))
              }
              aria-label="Filter by lab case status"
              title="Filter by status"
            >
              <option value="All">All Statuses</option>
              {DENTAL_LAB_CASE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {getDentalLabCaseStatusLabel(status)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
              onClick={(): void => {
                onReload?.();
              }}
              disabled={state.load}
              title="Reload lab cases"
              aria-label="Reload lab cases"
            >
              <RefreshRoundedIcon className={styles.reloadIcon} />
            </button>
            <div className={styles.buttonContainer}>
              <button
                type="button"
                title="Add lab case"
                aria-label="Add lab case"
                className={`${styles.actionPillButton} ${styles.addLabCaseButton}`}
                onClick={(): void =>
                  setState((prev) => ({
                    ...prev,
                    openModal: true,
                    isDelete: false,
                    isUpdate: false,
                    selectedItem: undefined,
                  }))
                }
              >
                <AddIcon className={styles.pillActionIcon} />
                <span>Add Lab Case</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalLabCasesHeader;
