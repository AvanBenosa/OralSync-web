import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import sharedStyles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';
import { DentalImagesTab, PatientDentalPhotoStateModel, PatientUploadStateModel } from '../api/types';

type PatientDentalPhotoHeaderProps = {
  chartState: PatientDentalPhotoStateModel;
  uploadState: PatientUploadStateModel;
  activeTab: DentalImagesTab;
  onTabChange: (tab: DentalImagesTab) => void;
  onReload?: () => void;
  onDeleteSelection?: () => void;
  onAddUpload?: () => void;
};

const PatientDentalPhotoHeader: FunctionComponent<PatientDentalPhotoHeaderProps> = (
  props: PatientDentalPhotoHeaderProps
): JSX.Element => {
  const {
    chartState,
    uploadState,
    activeTab,
    onTabChange,
    onReload,
    onDeleteSelection,
    onAddUpload,
  } = props;

  const activeCount = activeTab === 'uploads' ? uploadState.items.length : chartState.items.length;
  const activeLabel = activeTab === 'uploads' ? 'upload' : 'image';
  const isLoading = activeTab === 'uploads' ? uploadState.load : chartState.load;
  const selectedUploadCount = uploadState.selectedUploadIds.length;

  return (
    <div className={sharedStyles.listHeader}>
      <div className={sharedStyles.headerInfo}>
        <div className={sharedStyles.headerMeta}>
          <div className={sharedStyles.headerTitleWrap}>
            <PhotoLibraryOutlinedIcon className={sharedStyles.headerTitleIcon} />
            <h3 className={sharedStyles.headerTitle}>Photos</h3>
          </div>
          <span className={sharedStyles.headerBadge}>
            {activeCount} {activeCount === 1 ? activeLabel : `${activeLabel}s`}
          </span>
        </div>

        <div className={localStyles.headerActionCluster}>
          {activeTab === 'uploads' ? (
            <button
              type="button"
              className={localStyles.deleteSelectionButton}
              onClick={onDeleteSelection}
              disabled={selectedUploadCount === 0}
              title={
                selectedUploadCount === 0
                  ? 'Select uploads to delete'
                  : `Delete ${selectedUploadCount} selected upload${
                      selectedUploadCount === 1 ? '' : 's'
                    }`
              }
              aria-label={
                selectedUploadCount === 0
                  ? 'Select uploads to delete'
                  : `Delete ${selectedUploadCount} selected uploads`
              }
            >
              Delete Selection
              {selectedUploadCount > 0 ? (
                <span className={localStyles.deleteSelectionBadge}>{selectedUploadCount}</span>
              ) : null}
            </button>
          ) : null}

          <div className={localStyles.photoTabs}>
            <button
              type="button"
              className={`${localStyles.photoTabButton} ${
                activeTab === 'uploads' ? localStyles.photoTabButtonActive : ''
              }`}
              onClick={() => onTabChange('uploads')}
            >
              Uploads
            </button>
            <button
              type="button"
              className={`${localStyles.photoTabButton} ${
                activeTab === 'chart-images' ? localStyles.photoTabButtonActive : ''
              }`}
              onClick={() => onTabChange('chart-images')}
            >
              Dental Chart Images
            </button>
          </div>

          {activeTab === 'uploads' ? (
            <button
              type="button"
              className={sharedStyles.addButton}
              onClick={onAddUpload}
              title="Add upload"
              aria-label="Add upload"
            >
              <AddRoundedIcon className={sharedStyles.addButtonIcon} />
              <span>Add Upload</span>
            </button>
          ) : null}

          <button
            type="button"
            className={sharedStyles.reloadButton}
            onClick={onReload}
            disabled={isLoading}
            title={activeTab === 'uploads' ? 'Reload uploads' : 'Reload photos'}
            aria-label={activeTab === 'uploads' ? 'Reload uploads' : 'Reload photos'}
          >
            <RefreshRoundedIcon className={sharedStyles.reloadButtonIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDentalPhotoHeader;
