import { FunctionComponent, JSX } from 'react';

import localStyles from '../style.scss.module.scss';
import {
  getDentalChartKind,
  getPerioChartViewByToothId,
  getToothIdFromToothNumber,
  PatientPerioChartStateProps,
} from '../api/types';
import PerioChartCanvas from './perio-chart-canvas';

const PatientPerioChartTable: FunctionComponent<PatientPerioChartStateProps> = (
  props: PatientPerioChartStateProps
): JSX.Element => {
  const { state, setState, patientProfile } = props;
  const chartKind = getDentalChartKind(patientProfile);

  const handleChartSelect = (selectedToothId: string): void => {
    const selectedItem = state.items.find(
      (item) => getToothIdFromToothNumber(item.toothNumber, chartKind) === selectedToothId
    );
    const selectedView = getPerioChartViewByToothId(selectedToothId, chartKind) || state.circleHalf;

    setState((prevState: typeof state) => ({
      ...prevState,
      circleHalf: selectedView,
      selectedItem,
      selectedToothId,
      isUpdate: Boolean(selectedItem),
      isDelete: false,
      openModal: true,
    }));
  };

  return (
    <div className={localStyles.chartPanel}>
      <div className={localStyles.chartPanelHeader}>
        <div>
          <h4 className={localStyles.chartPanelTitle}>Periodontal Overview</h4>
          {/* <p className={localStyles.chartPanelText}>
            Click any tooth column in the active arch to add or update its record.
          </p> */}
        </div>
      </div>
      <div className={localStyles.chartPreview}>
        <PerioChartCanvas
          items={state.items}
          chartKind={chartKind}
          selectedToothId={state.selectedToothId}
          onSelectTooth={handleChartSelect}
          zoom={state.circleZoom}
          view={state.circleHalf}
          interactive={!state.load}
        />
      </div>
    </div>
  );
};

export default PatientPerioChartTable;
