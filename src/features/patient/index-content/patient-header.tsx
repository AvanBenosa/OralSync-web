import React, { FunctionComponent, JSX } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import styles from '../style.scss.module.scss';
import { downloadPatientImportTemplate } from '../api/import-template';
import { PatientStateProps } from '../api/types';

const PatientHeader: FunctionComponent<PatientStateProps> = (
  props: PatientStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <PeopleIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Patients Module</h2>
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
              title="Reload patients"
              aria-label="Reload patients"
            >
              <RefreshRoundedIcon className={styles.reloadIcon} />
            </button>
            <button
              type="button"
              className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
              onClick={(): void => {
                downloadPatientImportTemplate();
              }}
              disabled={state.load}
              title="Download patient import template"
              aria-label="Download patient import template"
            >
              <DownloadOutlinedIcon className={styles.reloadIcon} />
            </button>
            <div className={styles.buttonContainer}>
              <button
                title="Import or export patient xlsx"
                type="button"
                className={`${styles.actionPillButton} ${styles.importButton}`}
                aria-label="Upload"
                onClick={(): void => {
                  setState({
                    ...state,
                    openModal: true,
                    upload: true,
                    isDelete: false,
                    isUpdate: false,
                  });
                }}
              >
                <FileUploadOutlinedIcon className={styles.pillActionIcon} />
                <span>Upload</span>
              </button>
              <button
                title="Add patients"
                type="button"
                className={`${styles.actionPillButton} ${styles.addPatientButton}`}
                aria-label="Add"
                onClick={(): void => {
                  setState({
                    ...state,
                    openModal: true,
                    upload: false,
                    isDelete: false,
                    isUpdate: false,
                  });
                }}
              >
                <AddIcon className={styles.pillActionIcon} />
                <span>Add Patients</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
