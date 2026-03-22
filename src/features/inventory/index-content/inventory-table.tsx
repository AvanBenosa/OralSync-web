import { FunctionComponent, JSX } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';

import TableLoadingSkeleton from '../../../common/components/TableLoadingSkeleton';
import { formatCurrency as formatCurrencyValue } from '../../../common/helpers/formatCurrency';
import HighlightText from '../../../common/components/Highlight';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';
import {
  InventoryModel,
  InventoryStateProps,
  getInventoryCategoryLabel,
  getInventoryTypeLabel,
} from '../api/types';
import styles from '../style.scss.module.scss';

const formatDate = (value?: string | Date): string =>
  value ? toValidDateDisplay(value, 'MMM DD, YYYY') : '--';

const formatQuantity = (value?: number, unit?: string): string => {
  const formattedValue = Number(value ?? 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });

  return unit?.trim() ? `${formattedValue} ${unit.trim()}` : formattedValue;
};

const InventoryTable: FunctionComponent<InventoryStateProps> = (
  props: InventoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const columnCount = isMobile ? 1 : 8;

  const renderStatusBadges = (item: InventoryModel): JSX.Element => {
    const badges: Array<{ label: string; className: string }> = [];

    if (!item.isActive) {
      badges.push({ label: 'Inactive', className: styles.statusMuted });
    }

    if (item.isExpired) {
      badges.push({ label: 'Expired', className: styles.statusDanger });
    }

    if (item.isLowStock) {
      badges.push({ label: 'Low Stock', className: styles.statusWarning });
    }

    if (badges.length === 0) {
      badges.push({ label: 'Healthy', className: styles.statusHealthy });
    }

    return (
      <div className={styles.statusBadgeGroup}>
        {badges.map((badge) => (
          <span
            key={`${item.id ?? item.name ?? 'inventory'}-${badge.label}`}
            className={`${styles.statusBadge} ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>
    );
  };

  const renderActionButtons = (item: InventoryModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit inventory record"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            openModal: true,
          })
        }
      >
        <EditOutlinedIcon className={styles.iconEdit} />
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete inventory record"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            openModal: true,
          })
        }
      >
        <DeleteOutlineOutlinedIcon className={styles.iconDelete} />
      </button>
    </div>
  );

  return (
    <TableContainer className={styles.tableSurface} component={Paper} elevation={0}>
      <Table stickyHeader aria-label="Inventory table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Item Code</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Item Name</TableCell>
                <TableCell className={styles.tableHeaderCell}>Category</TableCell>
                <TableCell className={styles.tableHeaderCell}>Quantity</TableCell>
                <TableCell className={styles.tableHeaderCell}>Total Value</TableCell>
                <TableCell className={styles.tableHeaderCell}>Expiration</TableCell>
                <TableCell className={styles.tableHeaderCell}>Status</TableCell>
                <TableCell className={styles.tableHeaderCell} align="right" />
              </>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {state.load ? (
            <TableLoadingSkeleton
              rowCount={isMobile ? 4 : 5}
              isMobile={isMobile}
              cellClassName={styles.tableBodyCell}
              rowClassName={styles.noHoverRow}
              desktopCells={[
                { width: '18%' },
                { width: '26%' },
                { width: '16%' },
                { width: '16%' },
                { width: '16%' },
                { width: '16%' },
                { width: '18%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '62%',
                secondaryWidth: '52%',
                secondaryHeight: 18,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell colSpan={columnCount} align="center" sx={{ borderBottom: 0, py: 9 }}>
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <Inventory2RoundedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>
                    No inventory records found
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    Add dental supplies, tools, medicines, and other stock items here to start
                    tracking your clinic inventory.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow
                hover
                key={item.id ?? `inventory-${index}`}
                className={item.isLowStock ? styles.lowStockRow : undefined}
              >
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          <HighlightText query={state.search} text={item.name || '--'} />
                        </Typography>
                        <div className={styles.mobileMeta}>
                          <Typography component="span" className={styles.mobileContact}>
                            <HighlightText query={state.search} text={item.itemCode || '--'} />
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            {getInventoryCategoryLabel(item.category)}
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            {formatQuantity(item.quantityOnHand, item.unitOfMeasure)}
                          </Typography>
                        </div>
                        {renderStatusBadges(item)}
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                      <HighlightText query={state.search} text={item.itemCode || '--'} />
                    </Typography>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>
                      <Typography sx={{ fontWeight: 700, color: '#1f4467', lineHeight: 1.2 }}>
                        <HighlightText query={state.search} text={item.name || '--'} />
                      </Typography>
                      <Typography sx={{ color: '#6f8297', fontSize: '12px', mt: 0.35 }}>
                        {getInventoryTypeLabel(item.type)} |{' '}
                        <HighlightText query={state.search} text={item.description || '--'} />
                      </Typography>
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      <HighlightText
                        query={state.search}
                        text={getInventoryCategoryLabel(item.category)}
                      />
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatQuantity(item.quantityOnHand, item.unitOfMeasure)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      <HighlightText
                        query={state.search}
                        text={formatCurrencyValue(item.totalValue)}
                      />
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatDate(item.expirationDate)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {renderStatusBadges(item)}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell} align="right">
                      {renderActionButtons(item)}
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InventoryTable;
