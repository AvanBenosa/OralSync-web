import { FunctionComponent, JSX } from 'react';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import styles from '../style.scss.module.scss';

const SettingsHeader: FunctionComponent = (): JSX.Element => {
  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <SettingsOutlinedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Settings Module</h2>
          </div>
          <p className={styles.headerDescription}>
            Configure clinic-level preferences and system options here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;
