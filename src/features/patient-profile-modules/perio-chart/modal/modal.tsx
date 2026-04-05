import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import {
  PatientPerioChartModel,
  PatientPerioChartStateProps,
  getDentalChartKind,
  getToothDisplayLabel,
} from '../api/types';
import { HandleDeletePatientPerioChartItem } from '../api/handlers';

const formatPerioChartLabel = (
  item?: PatientPerioChartModel,
  chartKind: 'adult' | 'child' = 'adult'
): string => {
  if (!item?.toothNumber) {
    return 'this perio chart entry';
  }

  return getToothDisplayLabel(item.toothNumber, chartKind);
};

const PatientPerioChartDeleteModal: FunctionComponent<PatientPerioChartStateProps> = (
  props: PatientPerioChartStateProps
): JSX.Element => {
  const { state, setState, patientProfile } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const chartKind = getDentalChartKind(patientProfile);

  const chartItemLabel = useMemo(
    () => formatPerioChartLabel(state.selectedItem, chartKind),
    [chartKind, state.selectedItem]
  );

  const handleClose = (): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      isDelete: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeletePatientPerioChartItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete perio chart entry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Perio Chart Entry"
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

export default PatientPerioChartDeleteModal;
