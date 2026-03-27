// TODO: Replace MODULE_NAME, module_name, MODULE_NOUN, MODULE_ICON tokens.
// TODO: Update column headers, row cells, and empty-state text to match your domain.

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

import { MODULE_NAMEModel, MODULE_NAMEStateProps } from '../api/types';
import styles from '../style.scss.module.scss';
import TableLoadingSkeleton from '../../../components/TableLoadingSkeleton';
import HighlightText from '../../../components/Highlight';

const MODULE_NAMETable: FunctionComponent<MODULE_NAMEStateProps> = (
  props: MODULE_NAMEStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // TODO: update desktop column count to match your <TableCell> headers below
  const DESKTOP_COLUMN_COUNT = 4;
  const columnCount = isMobile ? 1 : DESKTOP_COLUMN_COUNT;

  const renderActionButtons = (item: MODULE_NAMEModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit record"
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
        aria-label="Delete record"
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
      <Table stickyHeader aria-label="MODULE_NOUN table">
        <TableHead>
          <TableRow>
            {/* TODO: replace with your actual column headers */}
            <TableCell className={styles.tableHeaderCell}>Name</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Description</TableCell>
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
                // TODO: adjust widths & counts to match your columns
                { width: '30%' },
                { width: '40%' },
                { width: '20%' },
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
                    {/* <MODULE_ICON className={styles.emptyStateGlyph} /> */}
                  </div>
                  <Typography className={styles.emptyStateTitle}>
                    No MODULE_NOUN records found {/* TODO: update label */}
                  </Typography>
                  <Typography className={styles.emptyStateText}>
                    Start adding MODULE_NOUN records to see them here.{' '}
                    {/* TODO: update description */}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow hover key={item.id ?? `module_name-${index}`}>
                {/* Mobile layout */}
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          <HighlightText query={state.search} text={item.name || '--'} />
                        </Typography>
                        <div className={styles.mobileMeta}>
                          <Typography component="span" className={styles.mobileContact}>
                            {item.description || '--'}
                          </Typography>
                        </div>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    // Desktop: first column
                    <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                      <HighlightText query={state.search} text={item.name || '--'} />
                    </Typography>
                  )}
                </TableCell>

                {/* Desktop-only columns */}
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>
                      <HighlightText query={state.search} text={item.description || '--'} />
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {item.isActive ? 'Active' : 'Inactive'}
                      {/* TODO: swap with status badge component if needed */}
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

export default MODULE_NAMETable;
