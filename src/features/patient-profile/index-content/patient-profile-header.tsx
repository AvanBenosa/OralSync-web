import React, { FunctionComponent, JSX } from 'react';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import { useMediaQuery, useTheme } from '@mui/material';

import styles from '../styles.scss.module.scss';
import { PatientProfileStateProps } from '../api/types';

const PatientProfileHeader: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, onBack, activeTab, onTabChange, mobileReload } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fullName = [
    state.profile?.firstName?.trim(),
    state.profile?.middleName?.trim(),
    state.profile?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ');

  const patientTabList = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DashboardRoundedIcon />,
    },
    {
      id: 'progress-notes',
      label: 'Progress Notes',
      icon: <NotesRoundedIcon />,
    },
    {
      id: 'medical-history',
      label: 'Medical History',
      icon: <HistoryEduRoundedIcon />,
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <PhotoLibraryRoundedIcon />,
    },
    { id: 'dental-chart', label: 'Dental Chart', icon: <MedicalServicesRoundedIcon /> },
    {
      id: 'forms',
      label: 'Forms',
      icon: <DescriptionRoundedIcon />,
    },
    {
      id: 'lab-cases',
      label: 'Lab Cases',
      icon: <ScienceRoundedIcon />,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <EventAvailableRoundedIcon />,
    },
  ];

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerControlsRow}>
        <div className={styles.headerPrimaryActions}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <ArrowBackIosNewRoundedIcon className={styles.backIcon} />
            Back
          </button>
          {isMobile && mobileReload?.onReload ? (
            <button
              type="button"
              className={styles.headerReloadButton}
              onClick={mobileReload.onReload}
              disabled={mobileReload.disabled}
              title={mobileReload.title ?? 'Reload current tab'}
              aria-label={mobileReload.ariaLabel ?? mobileReload.title ?? 'Reload current tab'}
            >
              <RefreshRoundedIcon className={styles.headerReloadIcon} />
            </button>
          ) : null}
        </div>
        <div className={styles.reportContentCard}>
          <div className={styles.tabList} role="tablist" aria-label="Report categories">
            {patientTabList.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.tabButtonActive : ''
                }`}
                onClick={(): void => {
                  onTabChange?.(tab.id);
                }}
              >
                <span className={styles.tabButtonIcon} aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {isMobile && <div className={styles.profileTag}>{`Patient Name: ${fullName || '--'}`}</div>}
      </div>
    </div>
  );
};

export default PatientProfileHeader;
