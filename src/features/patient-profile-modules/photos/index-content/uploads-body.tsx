import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import sharedStyles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';
import { PatientUploadModel, PatientUploadFileType, PatientUploadStateProps } from '../api/types';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../../common/services/api-client';

const isImageUpload = (item?: PatientUploadModel): boolean =>
  item?.fileMediaType?.startsWith('image/') ||
  ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(
    item?.fileExtension?.trim().toLowerCase() || ''
  );

const isPdfUpload = (item?: PatientUploadModel): boolean =>
  item?.fileType === PatientUploadFileType.Pdf ||
  item?.fileMediaType === 'application/pdf' ||
  item?.fileExtension?.trim().toLowerCase() === '.pdf';

const getUploadTypeLabel = (item?: PatientUploadModel): string => {
  switch (item?.fileType) {
    case PatientUploadFileType.Image:
      return 'Image';
    case PatientUploadFileType.Pdf:
      return 'PDF';
    case PatientUploadFileType.Word:
      return 'Word';
    case PatientUploadFileType.Excel:
      return 'Excel';
    default:
      return item?.fileExtension?.trim() ? item.fileExtension.replace('.', '').toUpperCase() : 'File';
  }
};

const renderUploadIcon = (item?: PatientUploadModel): JSX.Element => {
  if (isPdfUpload(item)) {
    return <PictureAsPdfOutlinedIcon className={localStyles.documentPreviewIcon} />;
  }

  if (item?.fileType === PatientUploadFileType.Word) {
    return <DescriptionOutlinedIcon className={localStyles.documentPreviewIcon} />;
  }

  if (item?.fileType === PatientUploadFileType.Excel) {
    return <GridOnOutlinedIcon className={localStyles.documentPreviewIcon} />;
  }

  return <InsertDriveFileOutlinedIcon className={localStyles.documentPreviewIcon} />;
};

const PatientUploadsBody: FunctionComponent<PatientUploadStateProps> = (
  props: PatientUploadStateProps
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

  const handleSelect = (item: PatientUploadModel): void => {
    setState((prev: typeof state) => ({
      ...prev,
      selectedItem: item,
    }));
  };

  const handleEdit = (item: PatientUploadModel): void => {
    setState((prev: typeof state) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: true,
      isDelete: false,
    }));
  };

  const handleDelete = (item: PatientUploadModel): void => {
    setState((prev: typeof state) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: false,
      isDelete: true,
    }));
  };

  return (
    <div className={localStyles.photoLayout}>
      <section className={localStyles.photoPanel}>
        <div className={localStyles.tableWrap}>
          <TableContainer component={Paper} className={sharedStyles.tableSurface}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className={sharedStyles.tableHeaderCell}>File Name</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell}>Type</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell}>Remarks</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell} align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.items.length === 0 ? (
                  <TableRow className={sharedStyles.noHoverRow}>
                    <TableCell colSpan={4} className={sharedStyles.tableBodyCell}>
                      <div className={sharedStyles.emptyState}>
                        <Typography className={sharedStyles.emptyStateTitle}>
                          No uploads found
                        </Typography>
                        <Typography className={sharedStyles.emptyStateText}>
                          Add one image or document for this patient and it will appear here.
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
                        key={item.id || item.filePath || item.fileName}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        className={localStyles.clickableRow}
                      >
                        <TableCell className={sharedStyles.tableBodyCell}>
                          <div className={localStyles.fileCell}>
                            <span className={localStyles.fileName}>
                              {item.originalFileName || item.fileName || '--'}
                            </span>
                            <span className={localStyles.fileMeta}>
                              {item.fileExtension?.trim() || 'No extension'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={sharedStyles.tableBodyCell}>
                          {getUploadTypeLabel(item)}
                        </TableCell>
                        <TableCell className={sharedStyles.tableBodyCell}>
                          {item.remarks?.trim() || '--'}
                        </TableCell>
                        <TableCell className={sharedStyles.tableBodyCell} align="right">
                          <div
                            className={`${sharedStyles.buttonContainer} ${sharedStyles.tableButtonContainer}`}
                          >
                            <button
                              type="button"
                              title="Edit Remarks"
                              aria-label={`Edit remarks for ${
                                item.originalFileName || item.fileName || 'upload'
                              }`}
                              className={`${sharedStyles.buttonItem} ${sharedStyles.tableActionButton} ${sharedStyles.editButton}`}
                              onClick={(event): void => {
                                event.stopPropagation();
                                handleEdit(item);
                              }}
                            >
                              <EditOutlinedIcon className={sharedStyles.iconEdit} />
                            </button>
                            <button
                              type="button"
                              title="Delete Upload"
                              aria-label={`Delete ${
                                item.originalFileName || item.fileName || 'upload'
                              }`}
                              className={`${sharedStyles.buttonItem} ${sharedStyles.tableActionButton} ${sharedStyles.deleteButton}`}
                              onClick={(event): void => {
                                event.stopPropagation();
                                handleDelete(item);
                              }}
                            >
                              <DeleteOutlineOutlinedIcon className={sharedStyles.iconDelete} />
                            </button>
                          </div>
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
          <h4 className={localStyles.panelTitle}>Upload Preview</h4>
          <p className={localStyles.panelText}>
            {state.selectedItem
              ? state.selectedItem.originalFileName || state.selectedItem.fileName || 'Selected upload'
              : 'Choose an upload from the table to preview it.'}
          </p>
        </div>
        <div className={localStyles.previewSurface}>
          {state.selectedItem ? (
            <>
              {isImageUpload(state.selectedItem) && previewUrl ? (
                <div className={localStyles.previewImageWrap}>
                  <img
                    src={previewUrl}
                    alt={state.selectedItem.originalFileName || state.selectedItem.fileName || 'Selected upload'}
                    className={localStyles.previewImage}
                  />
                </div>
              ) : isPdfUpload(state.selectedItem) && previewUrl ? (
                <div className={localStyles.previewImageWrap}>
                  <iframe
                    src={previewUrl}
                    title={state.selectedItem.originalFileName || state.selectedItem.fileName || 'PDF preview'}
                    className={localStyles.previewFrame}
                  />
                </div>
              ) : (
                <div className={localStyles.documentPreviewCard}>
                  <div className={localStyles.documentPreviewIconWrap}>
                    {renderUploadIcon(state.selectedItem)}
                  </div>
                  <Typography className={localStyles.previewFileName}>
                    {state.selectedItem.originalFileName ||
                      state.selectedItem.fileName ||
                      'Unnamed file'}
                  </Typography>
                  <Typography className={localStyles.previewText}>
                    Type: {getUploadTypeLabel(state.selectedItem)}
                  </Typography>
                  <div className={localStyles.documentPreviewActions}>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                      onClick={() => {
                        if (!previewUrl) {
                          return;
                        }

                        window.open(previewUrl, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Open File
                    </Button>
                  </div>
                </div>
              )}

              <Box className={localStyles.previewMeta}>
                <Typography className={localStyles.previewFileName}>
                  {state.selectedItem.originalFileName ||
                    state.selectedItem.fileName ||
                    'Unnamed file'}
                </Typography>
                <Typography className={localStyles.previewText}>
                  Upload Type: {getUploadTypeLabel(state.selectedItem)}
                </Typography>
                <Typography className={localStyles.previewText}>
                  Remarks: {state.selectedItem.remarks || '--'}
                </Typography>
              </Box>
            </>
          ) : (
            <div className={localStyles.previewEmpty}>
              <Typography className={sharedStyles.emptyStateTitle}>No upload selected</Typography>
              <Typography className={sharedStyles.emptyStateText}>
                Pick a row on the left panel to preview the uploaded image or document here.
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientUploadsBody;
