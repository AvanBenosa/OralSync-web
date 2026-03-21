import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import {
  PatientDentalChartModel,
  PatientDentalChartStateProps,
  getDentalChartKind,
  getToothDisplayLabel,
} from '../api/types';
import { HandleDeletePatientDentalChartItem } from '../api/handlers';

const formatDentalChartLabel = (
  item?: PatientDentalChartModel,
  chartKind: 'adult' | 'child' = 'adult'
): string => {
  if (!item?.toothNumber) {
    return 'this dental chart item';
  }

  return getToothDisplayLabel(item.toothNumber, chartKind);
};

const PatientDentalChartDeleteModal: FunctionComponent<PatientDentalChartStateProps> = (
  props: PatientDentalChartStateProps
): JSX.Element => {
  const { state, setState, patientProfile } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const chartKind = getDentalChartKind(patientProfile);

  const chartItemLabel = useMemo(
    () => formatDentalChartLabel(state.selectedItem, chartKind),
    [chartKind, state.selectedItem]
  );

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeletePatientDentalChartItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete dental chart item.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Dental Chart Item"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{chartItemLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default PatientDentalChartDeleteModal;
