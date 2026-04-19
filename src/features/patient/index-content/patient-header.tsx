import React, { FunctionComponent, JSX, MouseEvent, useEffect, useState } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import { Popover } from '@mui/material';

import styles from '../style.scss.module.scss';
import { downloadPatientImportTemplate } from '../api/import-template';
import { PatientSortDirection, PatientSortField, PatientStateProps } from '../api/types';

const PatientHeader: FunctionComponent<PatientStateProps> = (
  props: PatientStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [draftSortBy, setDraftSortBy] = useState<PatientSortField>(state.sortBy);
  const [draftSortDirection, setDraftSortDirection] = useState<PatientSortDirection>(
    state.sortDirection
  );
  const isSortPopoverOpen = Boolean(sortAnchorEl);
  const hasCustomSort = state.sortBy !== 'lastVisited' || state.sortDirection !== 'desc';

  useEffect(() => {
    if (isSortPopoverOpen) {
      return;
    }

    setDraftSortBy(state.sortBy);
    setDraftSortDirection(state.sortDirection);
  }, [state.sortBy, state.sortDirection, isSortPopoverOpen]);

  const handleOpenSortPopover = (event: MouseEvent<HTMLButtonElement>): void => {
    setDraftSortBy(state.sortBy);
    setDraftSortDirection(state.sortDirection);
    setSortAnchorEl(event.currentTarget);
  };

  const handleCloseSortPopover = (): void => {
    setSortAnchorEl(null);
  };

  const handleApplySort = (): void => {
    setState({
      ...state,
      sortBy: draftSortBy,
      sortDirection: draftSortDirection,
      pageStart: 0,
    });
    handleCloseSortPopover();
  };

  const handleResetSort = (): void => {
    setDraftSortBy('lastVisited');
    setDraftSortDirection('desc');
    setState({
      ...state,
      sortBy: 'lastVisited',
      sortDirection: 'desc',
      pageStart: 0,
    });
    handleCloseSortPopover();
  };

  return (
    <div className={styles.listHeader}>
      {/* ── Left: icon + title ────────────────────────────────────────── */}
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

      {/* ── Right: search + controls ──────────────────────────────────── */}
      <div className={styles.headerActions}>

        {/* Row 1: search input + icon buttons (reload, download) */}
        <div className={styles.searchRow}>
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
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.inlineReloadButton} ${
              hasCustomSort ? styles.sortButtonActive : ''
            }`}
            onClick={handleOpenSortPopover}
            disabled={state.load}
            title="Sort patients"
            aria-label="Sort patients"
            aria-haspopup="dialog"
            aria-expanded={isSortPopoverOpen}
          >
            <SortRoundedIcon className={styles.reloadIcon} />
          </button>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
            onClick={(): void => { onReload?.(); }}
            disabled={state.load}
            title="Reload patients"
            aria-label="Reload patients"
          >
            <RefreshRoundedIcon className={styles.reloadIcon} />
          </button>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
            onClick={(): void => { downloadPatientImportTemplate(); }}
            disabled={state.load}
            title="Download patient import template"
            aria-label="Download patient import template"
          >
            <DownloadOutlinedIcon className={styles.reloadIcon} />
          </button>
        </div>

        {/* Row 2: pill action buttons (Upload, Add Patients) */}
        <div className={styles.actionRow}>
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

      <Popover
        open={isSortPopoverOpen}
        anchorEl={sortAnchorEl}
        onClose={handleCloseSortPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          className: styles.filterPopoverPaper,
        }}
      >
        <div className={styles.filterPopoverBody}>
          <div className={styles.filterPopoverHeader}>
            <h3 className={styles.filterPopoverTitle}>Sort Patients</h3>
            <p className={styles.filterPopoverSubtitle}>
              Choose how patient records are ordered in this list.
            </p>
          </div>

          <div className={styles.filterSection}>
            <span className={styles.filterSectionTitle}>Sort by</span>
            <div className={styles.filterOptionGrid}>
              <button
                type="button"
                className={`${styles.filterOptionButton} ${
                  draftSortBy === 'lastVisited' ? styles.filterOptionButtonActive : ''
                }`}
                onClick={(): void => {
                  setDraftSortBy('lastVisited');
                }}
              >
                Last Visited
              </button>
              <button
                type="button"
                className={`${styles.filterOptionButton} ${
                  draftSortBy === 'lastName' ? styles.filterOptionButtonActive : ''
                }`}
                onClick={(): void => {
                  setDraftSortBy('lastName');
                }}
              >
                Last Name
              </button>
              <button
                type="button"
                className={`${styles.filterOptionButton} ${
                  draftSortBy === 'createdAt' ? styles.filterOptionButtonActive : ''
                }`}
                onClick={(): void => {
                  setDraftSortBy('createdAt');
                }}
              >
                Date Created
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <span className={styles.filterSectionTitle}>Direction</span>
            <div className={styles.filterOptionGrid}>
              <button
                type="button"
                className={`${styles.filterOptionButton} ${
                  draftSortDirection === 'asc' ? styles.filterOptionButtonActive : ''
                }`}
                onClick={(): void => {
                  setDraftSortDirection('asc');
                }}
              >
                Ascending
              </button>
              <button
                type="button"
                className={`${styles.filterOptionButton} ${
                  draftSortDirection === 'desc' ? styles.filterOptionButtonActive : ''
                }`}
                onClick={(): void => {
                  setDraftSortDirection('desc');
                }}
              >
                Descending
              </button>
            </div>
          </div>

          <div className={styles.filterPopoverActions}>
            <button
              type="button"
              className={styles.filterSecondaryButton}
              onClick={handleResetSort}
              disabled={state.sortBy === 'lastVisited' && state.sortDirection === 'desc'}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.filterPrimaryButton}
              onClick={handleApplySort}
            >
              Apply
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default PatientHeader;
