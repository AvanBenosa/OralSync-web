import { FunctionComponent, JSX } from 'react';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PatientPerioChartStateProps } from '../api/types';
import styles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';

type PatientPerioChartHeaderProps = PatientPerioChartStateProps & {
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
};

const PatientPerioChartHeader: FunctionComponent<PatientPerioChartHeaderProps> = (
  props: PatientPerioChartHeaderProps
): JSX.Element => {
  const { state, setState, onReload, onDownloadPdf, isDownloadingPdf = false } = props;

  const updateZoom = (nextZoom: number): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      circleZoom: Math.min(1.3, Math.max(0.72, Number(nextZoom.toFixed(2)))),
    }));
  };

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleWrap}>
            <BiotechOutlinedIcon className={styles.headerTitleIcon} />
            <h3 className={styles.headerTitle}>Perio Chart</h3>
          </div>
          <span className={styles.headerBadge}>{state.items.length} recorded teeth</span>
        </div>
        {/* <p className={localStyles.headerCaption}>
          Switch between upper and lower periodontal recording views and edit teeth directly on the
          page.
        </p> */}
        <div className={localStyles.layoutTabs} role="tablist" aria-label="Perio chart arch view">
          <button
            type="button"
            role="tab"
            aria-selected={state.circleHalf === 'upper'}
            className={`${localStyles.layoutTabButton} ${
              state.circleHalf === 'upper' ? localStyles.layoutTabButtonActive : ''
            }`}
            onClick={(): void =>
              setState((prevState: typeof state) => ({
                ...prevState,
                circleHalf: 'upper',
              }))
            }
          >
            Upper
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.circleHalf === 'lower'}
            className={`${localStyles.layoutTabButton} ${
              state.circleHalf === 'lower' ? localStyles.layoutTabButtonActive : ''
            }`}
            onClick={(): void =>
              setState((prevState: typeof state) => ({
                ...prevState,
                circleHalf: 'lower',
              }))
            }
          >
            Lower
          </button>
        </div>
        <div className={localStyles.zoomControls} aria-label="Perio chart zoom controls">
          <button
            type="button"
            className={localStyles.zoomButton}
            onClick={(): void => updateZoom(state.circleZoom - 0.08)}
            disabled={state.circleZoom <= 0.72}
            aria-label="Zoom out perio chart"
            title="Zoom out"
          >
            -
          </button>
          <span className={localStyles.zoomValue}>{Math.round(state.circleZoom * 100)}%</span>
          <button
            type="button"
            className={localStyles.zoomButton}
            onClick={(): void => updateZoom(state.circleZoom + 0.08)}
            disabled={state.circleZoom >= 1.3}
            aria-label="Zoom in perio chart"
            title="Zoom in"
          >
            +
          </button>
        </div>
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={styles.addButton}
            onClick={(): void => {
              onDownloadPdf?.();
            }}
            disabled={state.load || isDownloadingPdf}
            title="Download perio chart summary as PDF"
            aria-label="Download perio chart summary as PDF"
          >
            <PictureAsPdfRoundedIcon className={styles.addButtonIcon} />
            {isDownloadingPdf ? 'Preparing PDF...' : 'Print Summary'}
          </button>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.tabReloadButton}`}
            onClick={(): void => {
              onReload?.();
            }}
            disabled={state.load}
            title="Reload perio chart"
            aria-label="Reload perio chart"
          >
            <RefreshRoundedIcon className={styles.reloadButtonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientPerioChartHeader;
