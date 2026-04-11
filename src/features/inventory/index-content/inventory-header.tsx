import { FunctionComponent, JSX } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import type { InventoryStateProps } from '../api/types';
import styles from '../style.scss.module.scss';

const InventoryHeader: FunctionComponent<InventoryStateProps> = (
  props: InventoryStateProps
): JSX.Element => {
  const { state, setState, onReload } = props;
  const recordCount = state.totalItem;

  return (
    <div className={styles.listHeader}>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon} aria-hidden="true">
          <Inventory2RoundedIcon className={styles.headerIconSvg} />
        </div>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.headerTitle}>Inventory Module</h2>
            <span className={styles.headerBadge}>
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </span>
          </div>
          <div className={styles.legendGroup} aria-label="Inventory legend">
            <div className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.lowStockSwatch}`} />
              <span className={styles.legendLabel}>
                Needs restock: quantity on hand is already at or below the minimum stock level
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search item code, name or supplier ..."
            value={String(state.search ?? '')}
            onChange={(event): void =>
              setState({
                ...state,
                search: event.target.value,
                pageStart: 0,
              })
            }
          />
          <button
            type="button"
            className={`${styles.reloadButton} ${styles.inlineReloadButton}`}
            onClick={(): void => onReload?.()}
            disabled={state.load}
            title="Reload inventory records"
            aria-label="Reload inventory records"
          >
            <RefreshRoundedIcon className={styles.reloadIcon} />
          </button>
        </div>

        <div className={styles.actionRow}>
          <button
            title="Add inventory item"
            type="button"
            className={`${styles.actionPillButton} ${styles.addInventoryButton}`}
            aria-label="Add inventory item"
            onClick={(): void => {
              setState({
                ...state,
                openModal: true,
                isDelete: false,
                isUpdate: false,
                selectedItem: undefined,
              });
            }}
          >
            <AddRoundedIcon className={styles.pillActionIcon} />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryHeader;
