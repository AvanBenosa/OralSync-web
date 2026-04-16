import { FunctionComponent, JSX, MouseEvent, useEffect, useState } from 'react';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Popover } from '@mui/material';

import { useAuthStore } from '../../common/store/authStore';
import type { ReportFilter, ReportsProps } from './api/types';
import ReportsAppointments from './index-content/reports-appointments';
import ReportsCommunications from './index-content/reports-communications';
import ReportsFinance from './index-content/reports-finance';
import ReportsPatients from './index-content/reports-patients';
import styles from './style.scss.module.scss';

type ReportTab = 'finance' | 'patients' | 'appointments' | 'communications';

const TABS: { value: ReportTab; label: string; icon: JSX.Element }[] = [
  { value: 'finance', label: 'Finance', icon: <AttachMoneyRoundedIcon fontSize="small" /> },
  { value: 'patients', label: 'Patients', icon: <GroupRoundedIcon fontSize="small" /> },
  { value: 'appointments', label: 'Appointments', icon: <EventNoteRoundedIcon fontSize="small" /> },
  {
    value: 'communications',
    label: 'Communications',
    icon: <MarkEmailReadRoundedIcon fontSize="small" />,
  },
];

const DATE_PRESETS = [
  {
    label: 'This Month',
    getRange: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      };
    },
  },
  {
    label: 'This Quarter',
    getRange: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10),
        to: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10),
      };
    },
  },
  {
    label: 'This Year',
    getRange: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
        to: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10),
      };
    },
  },
  {
    label: 'Last Year',
    getRange: () => {
      const year = new Date().getFullYear() - 1;
      return {
        from: new Date(year, 0, 1).toISOString().slice(0, 10),
        to: new Date(year, 11, 31).toISOString().slice(0, 10),
      };
    },
  },
];

const formatDateLabel = (value?: string): string => {
  if (!value) {
    return '';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const ReportsModule: FunctionComponent<ReportsProps> = ({ clinicId }): JSX.Element => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.toLowerCase() ?? '';

  const visibleTabs = TABS.filter((tab) => {
    if (tab.value === 'finance') {
      return role === 'superadmin' || role === 'branchadmin' || role === 'accountant';
    }

    return true;
  });

  const [activeTab, setActiveTab] = useState<ReportTab>(visibleTabs[0]?.value ?? 'patients');
  const [filter, setFilter] = useState<ReportFilter>({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [draftFrom, setDraftFrom] = useState(filter.dateFrom ?? '');
  const [draftTo, setDraftTo] = useState(filter.dateTo ?? '');
  const [refreshKey, setRefreshKey] = useState(0);

  const isFilterOpen = Boolean(filterAnchorEl);
  const isInvalidRange = Boolean(draftFrom && draftTo && draftFrom > draftTo);
  const hasFilter = Boolean(filter.dateFrom || filter.dateTo);

  const filterLabel =
    filter.dateFrom && filter.dateTo
      ? `${formatDateLabel(filter.dateFrom)} - ${formatDateLabel(filter.dateTo)}`
      : filter.dateFrom
      ? `From ${formatDateLabel(filter.dateFrom)}`
      : filter.dateTo
      ? `To ${formatDateLabel(filter.dateTo)}`
      : 'All time';

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(visibleTabs[0]?.value ?? 'patients');
    }
  }, [activeTab, visibleTabs]);

  const handleOpenFilter = (event: MouseEvent<HTMLButtonElement>): void => {
    setDraftFrom(filter.dateFrom ?? '');
    setDraftTo(filter.dateTo ?? '');
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = (): void => {
    setFilterAnchorEl(null);
  };

  const handleApply = (): void => {
    if (isInvalidRange) {
      return;
    }

    setFilter((prev) => ({
      ...prev,
      dateFrom: draftFrom || undefined,
      dateTo: draftTo || undefined,
    }));
    handleCloseFilter();
  };

  const handleClear = (): void => {
    setDraftFrom('');
    setDraftTo('');
    setFilter((prev) => ({
      ...prev,
      dateFrom: undefined,
      dateTo: undefined,
    }));
    handleCloseFilter();
  };

  const handlePreset = (getRange: () => { from: string; to: string }): void => {
    const { from, to } = getRange();
    setDraftFrom(from);
    setDraftTo(to);
  };

  const handleRefresh = (): void => {
    setRefreshKey((prev) => prev + 1);
  };

  const activeFilter = {
    ...filter,
    _key: String(refreshKey),
  } as ReportFilter & { _key: string };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.headerIcon} aria-hidden="true">
                <AssessmentRoundedIcon className={styles.headerIconSvg} />
              </div>
              <div className={styles.headerText}>
                <div className={styles.headerTitleRow}>
                  <h2 className={styles.headerTitle}>Reports & Analytics</h2>
                  <span className={styles.headerBadge}>
                    {visibleTabs.length} {visibleTabs.length === 1 ? 'view' : 'views'}
                  </span>
                </div>
                <p className={styles.headerSubtitle}>Clinic performance summary</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.actionGroup}>
                <button
                  type="button"
                  className={`${styles.filterTrigger} ${
                    hasFilter ? styles.filterTriggerActive : ''
                  }`}
                  onClick={handleOpenFilter}
                  aria-label="Open report date filter"
                >
                  <span className={styles.filterIcon} aria-hidden="true">
                    <DateRangeRoundedIcon className={styles.filterIconSvg} />
                  </span>
                  <span className={styles.filterText}>
                    <span className={styles.filterLabel}>Reporting Period</span>
                    <span className={styles.filterValue}>{filterLabel}</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
                  onClick={handleRefresh}
                  title="Refresh reports"
                  aria-label="Refresh reports"
                >
                  <RefreshRoundedIcon className={styles.reloadIcon} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.listItem}>
            <div className={styles.reportTabs}>
              {visibleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`${styles.reportTab} ${
                    activeTab === tab.value ? styles.reportTabActive : ''
                  }`}
                  onClick={(): void => setActiveTab(tab.value)}
                  aria-pressed={activeTab === tab.value}
                >
                  <span className={styles.reportTabIcon} aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.reportContent}>
              {activeTab === 'finance' && (
                <ReportsFinance clinicId={clinicId} filter={activeFilter} />
              )}
              {activeTab === 'patients' && (
                <ReportsPatients clinicId={clinicId} filter={activeFilter} />
              )}
              {activeTab === 'appointments' && (
                <ReportsAppointments clinicId={clinicId} filter={activeFilter} />
              )}
              {activeTab === 'communications' && (
                <ReportsCommunications clinicId={clinicId} filter={activeFilter} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: { xs: 280, sm: 360 },
            borderRadius: '20px',
            border: '1px solid rgba(194, 208, 220, 0.92)',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 252, 0.99))',
            boxShadow: '0 18px 34px rgba(24, 50, 79, 0.12)',
          },
        }}
      >
        <div className={styles.filterPopover}>
          <h3 className={styles.popoverTitle}>Date Range</h3>

          <div className={styles.presetGrid}>
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={styles.presetButton}
                onClick={(): void => handlePreset(preset.getRange)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.dateFieldGrid}>
            <label className={styles.dateField}>
              <span className={styles.dateFieldLabel}>From</span>
              <input
                className={styles.dateInput}
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(event) => setDraftFrom(event.target.value)}
              />
            </label>

            <label className={styles.dateField}>
              <span className={styles.dateFieldLabel}>To</span>
              <input
                className={styles.dateInput}
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(event) => setDraftTo(event.target.value)}
              />
            </label>
          </div>

          {isInvalidRange && (
            <p className={styles.dateError}>"From" date must be before "To" date.</p>
          )}

          <div className={styles.popoverActions}>
            <button type="button" onClick={handleClear} className={styles.secondaryButton}>
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isInvalidRange}
              className={`${styles.primaryButton} ${isInvalidRange ? styles.disabledButton : ''}`}
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default ReportsModule;
