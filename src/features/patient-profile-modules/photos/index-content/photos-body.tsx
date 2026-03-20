import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import sharedStyles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';
import { PatientDentalPhotoModel, PatientDentalPhotoStateProps } from '../api/types';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../../common/services/api-client';
import { getDentalChartConditionLabel, getToothDisplayLabel } from '../../dental-chart/api/types';

const PatientDentalPhotoBody: FunctionComponent<PatientDentalPhotoStateProps> = (
  props: PatientDentalPhotoStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let isActive = true;
    const filePath = state.selectedItem?.filePath?.trim();

    if (!filePath) {
      setPreviewUrl('');
      return;
    }

    if (!isProtectedStoragePath(filePath)) {
      setPreviewUrl(resolveApiAssetUrl(filePath));
      return;
    }

    void loadProtectedAssetObjectUrl(filePath)
      .then((objectUrl) => {
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setPreviewUrl((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }
          return objectUrl;
        });
      })
      .catch(() => {
        if (isActive) {
          setPreviewUrl('');
        }
      });

    return () => {
      isActive = false;
    };
  }, [state.selectedItem?.filePath]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSelect = (item: PatientDentalPhotoModel): void => {
    setState((prev: typeof state) => ({
      ...prev,
      selectedItem: item,
    }));
  };

  return (
    <div className={localStyles.photoLayout}>
      <section className={localStyles.photoPanel}>
        <div className={localStyles.panelHeader}>
          <h4 className={localStyles.panelTitle}>Image Table List</h4>
          <p className={localStyles.panelText}>Select a tooth image to preview it.</p>
        </div>
        <div className={localStyles.tableWrap}>
          <TableContainer component={Paper} className={sharedStyles.tableSurface}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className={sharedStyles.tableHeaderCell}>Tooth</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell}>File Name</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell}>Condition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.items.length === 0 ? (
                  <TableRow className={sharedStyles.noHoverRow}>
                    <TableCell colSpan={3} className={sharedStyles.tableBodyCell}>
                      <div className={sharedStyles.emptyState}>
                        <Typography className={sharedStyles.emptyStateTitle}>
                          No photos found
                        </Typography>
                        <Typography className={sharedStyles.emptyStateText}>
                          Upload images from Dental Chart and they will appear here.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  state.items.map((item) => {
                    const isSelected = item.id === state.selectedItem?.id;

                    return (
                      <TableRow
                        hover
                        key={item.id || `${item.patientTeethId}-${item.displayOrder}`}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        className={localStyles.clickableRow}
                      >
                        <TableCell className={sharedStyles.tableBodyCell}>
                          {getToothDisplayLabel(item.toothNumber)}
                        </TableCell>
                        <TableCell className={sharedStyles.tableBodyCell}>
                          <div className={localStyles.fileCell}>
                            <span className={localStyles.fileName}>
                              {item.originalFileName || item.fileName || '--'}
                            </span>
                            <span className={localStyles.fileMeta}>
                              #{item.displayOrder || 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={sharedStyles.tableBodyCell}>
                          {getDentalChartConditionLabel(item.condition)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </section>

      <section className={localStyles.photoPanel}>
        <div className={localStyles.panelHeader}>
          <h4 className={localStyles.panelTitle}>Image Preview</h4>
          <p className={localStyles.panelText}>
            {state.selectedItem
              ? `${getToothDisplayLabel(state.selectedItem.toothNumber)}`
              : 'Choose an image from the table to preview it.'}
          </p>
        </div>
        <div className={localStyles.previewSurface}>
          {state.selectedItem && previewUrl ? (
            <>
              <div className={localStyles.previewImageWrap}>
                <img
                  src={previewUrl}
                  alt={
                    state.selectedItem.originalFileName ||
                    state.selectedItem.fileName ||
                    'Selected dental photo'
                  }
                  className={localStyles.previewImage}
                />
              </div>
              <Box className={localStyles.previewMeta}>
                <Typography className={localStyles.previewFileName}>
                  {state.selectedItem.originalFileName ||
                    state.selectedItem.fileName ||
                    'Unnamed image'}
                </Typography>
                <Typography className={localStyles.previewText}>
                  Condition: {getDentalChartConditionLabel(state.selectedItem.condition)}
                </Typography>
                <Typography className={localStyles.previewText}>
                  Tooth remarks: {state.selectedItem.toothRemarks || '--'}
                </Typography>
                <Typography className={localStyles.previewText}>
                  Image remarks: {state.selectedItem.remarks || '--'}
                </Typography>
              </Box>
            </>
          ) : (
            <div className={localStyles.previewEmpty}>
              <Typography className={sharedStyles.emptyStateTitle}>No image selected</Typography>
              <Typography className={sharedStyles.emptyStateText}>
                Pick a row on the left panel to see the full image here.
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientDentalPhotoBody;
