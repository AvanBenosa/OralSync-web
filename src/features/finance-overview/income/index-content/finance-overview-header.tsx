import { FunctionComponent, JSX, MouseEvent, useEffect, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import { Popover } from '@mui/material';

import type { FinanceIncomeStateProps } from '../api/types';
import styles from '../../style.scss.module.scss';

type FinanceOverviewIncomeHeaderProps = FinanceIncomeStateProps;

const FinanceOverviewIncomeHeader: FunctionComponent<FinanceOverviewIncomeHeaderProps> = (
  props: FinanceOverviewIncomeHeaderProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const recordCount = state.totalItem;
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [draftDateFrom, setDraftDateFrom] = useState(state.dateFrom ?? '');
  const [draftDateTo, setDraftDateTo] = useState(state.dateTo ?? '');
  const isDateFilterOpen = Boolean(filterAnchorEl);
  const hasActiveDateFilter = Boolean(state.dateFrom || state.dateTo);
  const isInvalidDateRange = Boolean(draftDateFrom && draftDateTo && draftDateFrom > draftDateTo);

  useEffect(() => {
    if (isDateFilterOpen) {
      return;
    }

    setDraftDateFrom(state.dateFrom ?? '');
    setDraftDateTo(state.dateTo ?? '');
  }, [state.dateFrom, state.dateTo, isDateFilterOpen]);

  const handleOpenDateFilter = (event: MouseEvent<HTMLButtonElement>): void => {
    setDraftDateFrom(state.dateFrom ?? '');
    setDraftDateTo(state.dateTo ?? '');
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseDateFilter = (): void => {
    setFilterAnchorEl(null);
  };

  const handleApplyDateFilter = (): void => {
    if (isInvalidDateRange) {
      return;
    }

    setState({
      ...state,
      dateFrom: draftDateFrom,
      dateTo: draftDateTo,
      pageStart: 0,
    });
    handleCloseDateFilter();
  };

  const handleClearDateFilter = (): void => {
    setDraftDateFrom('');
    setDraftDateTo('');
    setState({
      ...state,
      dateFrom: '',
      dateTo: '',
      pageStart: 0,
    });
    handleCloseDateFilter();
  };

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
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.searchForm}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search patient name"
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
                if (state.dateFrom || state.dateTo) {
                  setDraftDateFrom('');
                  setDraftDateTo('');
                  handleCloseDateFilter();
                  setState({
                    ...state,
                    dateFrom: '',
                    dateTo: '',
                    pageStart: 0,
                  });
                  return;
                }

                onReload?.();
              }}
              disabled={state.load}
              title="Reload income records"
              aria-label="Reload income records"
            >
              <RefreshRoundedIcon className={styles.reloadIcon} />
            </button>
            <button
              type="button"
              className={`${styles.reloadButton} ${styles.inlineReloadButton} ${
                hasActiveDateFilter ? styles.dateFilterButtonActive : ''
              }`}
              onClick={handleOpenDateFilter}
              title={hasActiveDateFilter ? 'Change date filter' : 'Filter income by date'}
              aria-label={hasActiveDateFilter ? 'Change date filter' : 'Filter income by date'}
              aria-haspopup="dialog"
              aria-expanded={isDateFilterOpen}
            >
              <DateRangeRoundedIcon className={styles.reloadIcon} />
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
        </div>
      </div>

      <Popover
        open={isDateFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseDateFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          className: styles.filterPopoverPaper,
        }}
      >
        <div className={styles.filterPopoverBody}>
          <div className={styles.filterPopoverHeader}>
            <h3 className={styles.filterPopoverTitle}>Date Filter</h3>
            <p className={styles.filterPopoverSubtitle}>
              Narrow income records using an inclusive start and end date.
            </p>
          </div>

          <div className={styles.filterFieldGrid}>
            <label className={styles.filterFieldGroup}>
              <span className={styles.filterFieldLabel}>From</span>
              <input
                className={styles.filterDateInput}
                type="date"
                value={draftDateFrom}
                max={draftDateTo || undefined}
                onChange={(event): void => {
                  setDraftDateFrom(event.target.value);
                }}
              />
            </label>
            <label className={styles.filterFieldGroup}>
              <span className={styles.filterFieldLabel}>To</span>
              <input
                className={styles.filterDateInput}
                type="date"
                value={draftDateTo}
                min={draftDateFrom || undefined}
                onChange={(event): void => {
                  setDraftDateTo(event.target.value);
                }}
              />
            </label>
          </div>

          <p
            className={`${styles.filterHelperText} ${
              isInvalidDateRange ? styles.filterValidationText : ''
            }`}
          >
            {isInvalidDateRange
              ? 'The "from" date must be on or before the "to" date.'
              : 'Leave either field empty to keep that side of the range open.'}
          </p>

          <div className={styles.filterPopoverActions}>
            <button
              type="button"
              className={styles.filterSecondaryButton}
              onClick={handleClearDateFilter}
              disabled={!state.dateFrom && !state.dateTo && !draftDateFrom && !draftDateTo}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.filterPrimaryButton}
              onClick={handleApplyDateFilter}
              disabled={isInvalidDateRange}
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default FinanceOverviewIncomeHeader;
