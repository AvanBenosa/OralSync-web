import { FunctionComponent, JSX } from 'react';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import sharedStyles from '../../styles.module.scss';
import { PatientDentalPhotoStateProps } from '../api/types';

const PatientDentalPhotoHeader: FunctionComponent<PatientDentalPhotoStateProps> = (
  props: PatientDentalPhotoStateProps
): JSX.Element => {
  const { state, onReload, } = props;

  return (
    <div className={sharedStyles.listHeader}>
      <div className={sharedStyles.headerInfo}>
        <div className={sharedStyles.headerMeta}>
          <div className={sharedStyles.headerTitleWrap}>
            <PhotoLibraryOutlinedIcon className={sharedStyles.headerTitleIcon} />
            <h3 className={sharedStyles.headerTitle}>Photos</h3>
          </div>
          <span className={sharedStyles.headerBadge}>
            {state.items.length} {state.items.length === 1 ? 'image' : 'images'}
          </span>
        </div>
        <button
          type="button"
          className={sharedStyles.reloadButton}
          onClick={onReload}
          disabled={state.load}
          title="Reload photos"
          aria-label="Reload photos"
        >
          <RefreshRoundedIcon className={sharedStyles.reloadButtonIcon} />
        </button>
      </div>
    </div>
  );
};

export default PatientDentalPhotoHeader;
