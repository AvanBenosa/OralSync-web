import React, { FunctionComponent, JSX } from 'react';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import styles from '../style.scss.module.scss';
import { AppointmentStateProps, AppointmentViewTab } from '../api/types';

type AppointmentHeaderProps = AppointmentStateProps & {
  activeTab: AppointmentViewTab;
  onTabChange: (tab: AppointmentViewTab) => void;
};

const AppointmentHeader: FunctionComponent<AppointmentHeaderProps> = (
  props: AppointmentHeaderProps
): JSX.Element => {
  const { state, setState, onReload, activeTab, onTabChange } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <EventNoteOutlinedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Appointment Module</h2>
            <span className={styles.headerBadge}>
              {state.totalItem} {state.totalItem === 1 ? 'record' : 'records'}
            </span>
          </div>
          <div className={styles.legendGroup} aria-label="Appointment legend">
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.todaySwatch}`} aria-hidden="true" />
              <span className={styles.legendLabel}>Today and upcoming</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.pastSwatch}`} aria-hidden="true" />
              <span className={styles.legendLabel}>Today and already past</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.headerTabsSection}>
        <div className={styles.tabList} role="tablist" aria-label="Appointment views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            className={`${styles.tabButton} ${activeTab === 'requests' ? styles.tabButtonActive : ''}`}
            onClick={() => onTabChange('requests')}
          >
            <span className={styles.tabButtonIcon} aria-hidden="true">
              <ListAltRoundedIcon />
            </span>
            <span>Requests</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calendar'}
            className={`${styles.tabButton} ${activeTab === 'calendar' ? styles.tabButtonActive : ''}`}
            onClick={() => onTabChange('calendar')}
          >
            <span className={styles.tabButtonIcon} aria-hidden="true">
              <CalendarMonthRoundedIcon />
            </span>
            <span>Calendar</span>
          </button>
        </div>
      </div>
      <div className={styles.headerActions}>
        <div className={styles.searchForm}>
          {activeTab === 'requests' ? (
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search patient or reason ..."
              value={String(state.search ?? '')}
              onChange={(event): void =>
                setState({
                  ...state,
                  search: event.target.value,
                  pageStart: 0,
                })
              }
            />
          ) : null}
          <div className={styles.headerActionControls}>
            <button
              type="button"
              className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
              onClick={(): void => {
                onReload?.();
              }}
              disabled={state.load}
              title="Reload appointments"
              aria-label="Reload appointments"
            >
              <RefreshRoundedIcon className={styles.reloadIcon} />
            </button>
            <div className={styles.buttonContainer}>
              <button
                title="Add appointment"
                type="button"
                className={`${styles.actionPillButton} ${styles.addAppointmentButton}`}
                aria-label="Add appointment"
                onClick={(): void => {
                  setState({
                    ...state,
                    openModal: true,
                    isDelete: false,
                    isUpdate: false,
                  });
                }}
              >
                <AddIcon className={styles.pillActionIcon} />
                <span>Add Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHeader;
