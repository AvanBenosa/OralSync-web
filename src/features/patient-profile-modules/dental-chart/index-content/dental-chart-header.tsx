import { FunctionComponent, JSX } from 'react';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PatientDentalChartStateProps } from '../api/types';
import styles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';

const PatientDentalChartHeader: FunctionComponent<PatientDentalChartStateProps> = (
  props: PatientDentalChartStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const canZoomCircleFull = state.chartLayout === 'circle' && state.circleHalf === 'full';

  const updateZoom = (nextZoom: number): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      circleZoom: Math.min(1.4, Math.max(0.45, Number(nextZoom.toFixed(2)))),
    }));
  };

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerMeta}>
          <div className={styles.headerTitleWrap}>
            <MedicalServicesOutlinedIcon className={styles.headerTitleIcon} />
            <h3 className={styles.headerTitle}>Dental Chart</h3>
          </div>
          <span className={styles.headerBadge}>{state.items.length} charted teeth</span>
        </div>
        <div className={localStyles.layoutTabs} role="tablist" aria-label="Odontogram layout">
          <button
            type="button"
            role="tab"
            aria-selected={state.chartLayout === 'square'}
            className={`${localStyles.layoutTabButton} ${
              state.chartLayout === 'square' ? localStyles.layoutTabButtonActive : ''
            }`}
            onClick={(): void =>
              setState((prevState: typeof state) => ({
                ...prevState,
                chartLayout: 'square',
              }))
            }
          >
            Square
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.chartLayout === 'circle'}
            className={`${localStyles.layoutTabButton} ${
              state.chartLayout === 'circle' ? localStyles.layoutTabButtonActive : ''
            }`}
            onClick={(): void =>
              setState((prevState: typeof state) => ({
                ...prevState,
                chartLayout: 'circle',
              }))
            }
          >
            Circle
          </button>
        </div>
        {state.chartLayout === 'circle' ? (
          <div className={localStyles.layoutTabs} role="tablist" aria-label="Circle arch view">
            <button
              type="button"
              role="tab"
              aria-selected={state.circleHalf === 'full'}
              className={`${localStyles.layoutTabButton} ${
                state.circleHalf === 'full' ? localStyles.layoutTabButtonActive : ''
              }`}
              onClick={(): void =>
                setState((prevState: typeof state) => ({
                  ...prevState,
                  circleHalf: 'full',
                }))
              }
            >
              Full
            </button>
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
        ) : null}
        {canZoomCircleFull ? (
          <div className={localStyles.zoomControls} aria-label="Odontogram zoom controls">
            <button
              type="button"
              className={localStyles.zoomButton}
              onClick={(): void => updateZoom(state.circleZoom - 0.1)}
              disabled={state.circleZoom <= 0.45}
              aria-label="Zoom out odontogram"
              title="Zoom out"
            >
              -
            </button>
            <span className={localStyles.zoomValue}>{Math.round(state.circleZoom * 100)}%</span>
            <button
              type="button"
              className={localStyles.zoomButton}
              onClick={(): void => updateZoom(state.circleZoom + 0.1)}
              disabled={state.circleZoom >= 1.4}
              aria-label="Zoom in odontogram"
              title="Zoom in"
            >
              +
            </button>
          </div>
        ) : null}
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.tabReloadButton}`}
            onClick={(): void => {
              onReload?.();
            }}
            disabled={state.load}
            title="Reload dental chart"
            aria-label="Reload dental chart"
          >
            <RefreshRoundedIcon className={styles.reloadButtonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDentalChartHeader;
