import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { Dialog, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

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

const getUploadKey = (item: PatientUploadModel, index: number): string =>
  item.id || item.filePath || item.fileName || `upload-${index}`;

const getUploadSelectionId = (item: PatientUploadModel, index: number): string =>
  item.id || getUploadKey(item, index);

const formatUploadDate = (value?: string | Date): string => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const PatientUploadsBody: FunctionComponent<PatientUploadStateProps> = (
  props: PatientUploadStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [viewerImage, setViewerImage] = useState<{
    alt: string;
    src: string;
    remarks: string;
    downloadName: string;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadPreviewUrls = async (): Promise<void> => {
      const nextPreviewUrls: Record<string, string> = {};

      for (let index = 0; index < state.items.length; index += 1) {
        const item = state.items[index];
        if (!isImageUpload(item)) {
          continue;
        }

        const filePath = item.filePath?.trim();
        if (!filePath) {
          continue;
        }

        const key = getUploadKey(item, index);

        if (!isProtectedStoragePath(filePath)) {
          nextPreviewUrls[key] = resolveApiAssetUrl(filePath);
          continue;
        }

        try {
          const objectUrl = await loadProtectedAssetObjectUrl(filePath);
          if (!isActive) {
            URL.revokeObjectURL(objectUrl);
            continue;
          }

          nextPreviewUrls[key] = objectUrl;
        } catch {
          // Ignore failed previews and continue rendering the rest of the gallery.
        }
      }

      if (!isActive) {
        return;
      }

      const previousPreviewUrls = previewUrlsRef.current;
      Object.values(previousPreviewUrls).forEach((url) => {
        if (url.startsWith('blob:') && !Object.values(nextPreviewUrls).includes(url)) {
          URL.revokeObjectURL(url);
        }
      });

      previewUrlsRef.current = nextPreviewUrls;
      setPreviewUrls(nextPreviewUrls);
    };

    void loadPreviewUrls();

    return () => {
      isActive = false;
    };
  }, [state.items]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleSelect = (item: PatientUploadModel): void => {
    setState((prev: typeof state) => ({
      ...prev,
      selectedItem: item,
    }));
  };

  const handleToggleSelection = (item: PatientUploadModel, index: number): void => {
    const selectionId = getUploadSelectionId(item, index);

    setState((prev: typeof state) => {
      const isSelected = prev.selectedUploadIds.includes(selectionId);

      return {
        ...prev,
        selectedItem: item,
        selectedUploadIds: isSelected
          ? prev.selectedUploadIds.filter((itemId) => itemId !== selectionId)
          : [...prev.selectedUploadIds, selectionId],
      };
    });
  };

  const handleOpenViewer = (item: PatientUploadModel, previewUrl?: string): void => {
    if (!isImageUpload(item) || !previewUrl) {
      return;
    }

    const fileName = item.originalFileName || item.fileName || 'Upload preview';
    handleSelect(item);
    setViewerImage({
      alt: fileName,
      downloadName: fileName,
      remarks: item.remarks?.trim() || 'No remarks',
      src: previewUrl,
    });
  };

  return (
    <>
      <div className={localStyles.uploadGalleryPanel}>
        <section className={localStyles.photoPanel}>
          {state.items.length === 0 ? (
            <div className={sharedStyles.emptyState}>
              <Typography className={sharedStyles.emptyStateTitle}>No uploads found</Typography>
              <Typography className={sharedStyles.emptyStateText}>
                Add one image or document for this patient and it will appear here.
              </Typography>
            </div>
          ) : (
            <div className={localStyles.uploadGalleryGrid}>
              {state.items.map((item, index) => {
                const uploadKey = getUploadKey(item, index);
                const selectionId = getUploadSelectionId(item, index);
                const previewUrl = previewUrls[uploadKey];
                const isSelected = state.selectedUploadIds.includes(selectionId);
                const fileName = item.originalFileName || item.fileName || 'Unnamed upload';
                const createdLabel = formatUploadDate(item.createdAt || item.updatedAt);

                return (
                  <article
                    key={uploadKey}
                    className={`${localStyles.uploadCard} ${
                      isSelected ? localStyles.uploadCardSelected : ''
                    }`}
                  >
                    <div
                      className={`${localStyles.uploadCardPreview} ${
                        isImageUpload(item) && previewUrl
                          ? localStyles.uploadCardPreviewInteractive
                          : ''
                      }`}
                      onClick={() => handleOpenViewer(item, previewUrl)}
                    >
                      {isImageUpload(item) && previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={fileName}
                          className={localStyles.uploadCardImage}
                        />
                      ) : (
                        <div className={localStyles.uploadCardPlaceholder}>
                          <div className={localStyles.documentPreviewIconWrap}>
                            {renderUploadIcon(item)}
                          </div>
                        </div>
                      )}

                      <div className={localStyles.uploadCardSelection}>
                        <button
                          type="button"
                          title={isSelected ? 'Deselect upload' : 'Select upload'}
                          aria-label={isSelected ? `Deselect ${fileName}` : `Select ${fileName}`}
                          className={`${localStyles.uploadCardSelectButton} ${
                            isSelected ? localStyles.uploadCardSelectButtonActive : ''
                          }`}
                          onClick={(event): void => {
                            event.stopPropagation();
                            handleToggleSelection(item, index);
                          }}
                        >
                          {isSelected ? (
                            <CheckCircleRoundedIcon className={localStyles.uploadCardSelectIcon} />
                          ) : (
                            <RadioButtonUncheckedRoundedIcon
                              className={localStyles.uploadCardSelectIcon}
                            />
                          )}
                        </button>
                      </div>

                      {createdLabel ? (
                        <span className={localStyles.uploadCardDate}>{createdLabel}</span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={Boolean(viewerImage)}
        onClose={() => setViewerImage(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          className: localStyles.uploadViewerDialog,
        }}
      >
        {viewerImage ? (
          <div className={localStyles.uploadViewerContent}>
            <div className={localStyles.uploadViewerMediaFrame}>
              <img
                src={viewerImage.src}
                alt={viewerImage.alt}
                className={localStyles.uploadViewerImage}
              />
            </div>

            <div className={localStyles.uploadViewerMeta}>
              <div className={localStyles.uploadViewerMetaText}>
                <Typography className={localStyles.uploadViewerTitle}>
                  {viewerImage.alt}
                </Typography>
                <Typography className={localStyles.uploadViewerRemarksLabel}>
                  Remarks
                </Typography>
                <Typography className={localStyles.uploadViewerRemarks}>
                  {viewerImage.remarks}
                </Typography>
              </div>

              <a
                href={viewerImage.src}
                download={viewerImage.downloadName}
                className={localStyles.uploadViewerDownloadButton}
              >
                <FileDownloadOutlinedIcon className={localStyles.uploadViewerDownloadIcon} />
                <span>Download</span>
              </a>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
};

export default PatientUploadsBody;
