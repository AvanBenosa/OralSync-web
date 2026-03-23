import { FunctionComponent, JSX } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

import type { InvoiceGeneratorHeaderProps } from '../api/types';
import styles from '../style.scss.module.scss';

const InvoiceGeneratorHeader: FunctionComponent<InvoiceGeneratorHeaderProps> = (
  props: InvoiceGeneratorHeaderProps
): JSX.Element => {
  const { state, onReload, onOpenPreview, canPreview } = props;
  const recordCount = state.totalItem;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <ReceiptLongRoundedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Invoice Generator</h2>
            <span className={styles.headerBadge}>
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className={styles.headerSubtitle}>
            Select a patient and treatment date to pull invoice-ready progress notes.
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.invoiceHeaderButtons}>
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
            onClick={(): void => onReload?.()}
            disabled={state.load || !state.selectedPatientId || !state.filterDate}
            title="Reload invoice records"
            aria-label="Reload invoice records"
          >
            <RefreshRoundedIcon className={styles.reloadIcon} />
          </button>

          <button
            type="button"
            className={`${styles.actionPillButton} ${styles.invoicePreviewButton}`}
            onClick={onOpenPreview}
            disabled={!canPreview || state.load}
          >
            <VisibilityRoundedIcon className={styles.pillActionIcon} />
            <span>Preview Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneratorHeader;
