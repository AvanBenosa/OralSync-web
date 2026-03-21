import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

import type { FinanceOverviewStateProps, FinanceViewTab } from '../api/types';
import styles from '../style.scss.module.scss';

type FinanceOverviewHeaderProps = FinanceOverviewStateProps & {
  activeTab: FinanceViewTab;
  onTabChange: (tab: FinanceViewTab) => void;
};

const FinanceOverviewHeader: FunctionComponent<FinanceOverviewHeaderProps> = (
  props: FinanceOverviewHeaderProps
): JSX.Element => {
  const { state, setState, onReload, activeTab, onTabChange } = props;
  const recordCount = activeTab === 'income' ? state.totalItem : 0;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <RequestQuoteRoundedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Finance Overview</h2>
            <span className={styles.headerBadge}>
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </span>
          </div>
          {activeTab === 'income' ? (
            <div className={styles.legendGroup} aria-label="Finance payment legend">
              <div className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.pendingSwatch}`} />
                <span className={styles.legendLabel}>Pending balance</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.paidSwatch}`} />
                <span className={styles.legendLabel}>Fully paid</span>
              </div>
            </div>
          ) : (
            <p className={styles.headerSubtitle}>
              Expense tab is ready for backend wiring and future CRUD support.
            </p>
          )}
        </div>
      </div>

      <div className={styles.headerTabsSection}>
        <div className={styles.tabList} role="tablist" aria-label="Finance views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'income'}
            className={`${styles.tabButton} ${activeTab === 'income' ? styles.tabButtonActive : ''}`}
            onClick={() => onTabChange('income')}
          >
            <span className={styles.tabButtonIcon} aria-hidden="true">
              <TrendingUpRoundedIcon />
            </span>
            <span>Income</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'expenses'}
            className={`${styles.tabButton} ${
              activeTab === 'expenses' ? styles.tabButtonActive : ''
            }`}
            onClick={() => onTabChange('expenses')}
          >
            <span className={styles.tabButtonIcon} aria-hidden="true">
              <TrendingDownRoundedIcon />
            </span>
            <span>Expenses</span>
          </button>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.searchForm}>
          {activeTab === 'income' ? (
            <>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search patient, procedure or dentist ..."
                value={String(state.search ?? '')}
                onChange={(event): void =>
                  setState({
                    ...state,
                    search: event.target.value,
                    pageStart: 0,
                  })
                }
              />
              <div className={styles.headerActionControls}>
                <button
                  type="button"
                  className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
                  onClick={(): void => {
                    onReload?.();
                  }}
                  disabled={state.load}
                  title="Reload income records"
                  aria-label="Reload income records"
                >
                  <RefreshRoundedIcon className={styles.reloadIcon} />
                </button>
                <div className={styles.buttonContainer}>
                  <button
                    title="Add income"
                    type="button"
                    className={`${styles.actionPillButton} ${styles.addAppointmentButton}`}
                    aria-label="Add income"
                    onClick={(): void => {
                      setState({
                        ...state,
                        openModal: true,
                        isDelete: false,
                        isUpdate: false,
                        selectedItem: undefined,
                      });
                    }}
                  >
                    <AddRoundedIcon className={styles.pillActionIcon} />
                    <span>Add Income</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <span className={styles.expenseHeaderNote}>
              Expense operations can be connected once the API contract is available.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceOverviewHeader;
