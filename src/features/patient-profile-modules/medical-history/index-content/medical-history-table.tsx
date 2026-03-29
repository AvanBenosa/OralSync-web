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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';

import styles from '../../styles.module.scss';
import {
  getMedicalHistoryConditionSummary,
  PatientMedicalHistoryModel,
  PatientMedicalHistoryStateProps,
} from '../api/types';
import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';

const formatDate = (value?: string | Date): string => toValidDateDisplay(value, 'MMM DD, YYYY');
const getConditionSummary = (item: PatientMedicalHistoryModel): string =>
  getMedicalHistoryConditionSummary(item.q11Conditions, item.others);

const PatientMedicalHistoryTable: FunctionComponent<PatientMedicalHistoryStateProps> = (
  props: PatientMedicalHistoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const columnCount = isMobile ? 1 : 3;

  const renderActionButtons = (item: PatientMedicalHistoryModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit medical history"
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
        aria-label="Delete medical history"
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
    <TableContainer
      className={styles.tableSurface}
      component={Paper}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '20px',
      }}
    >
      <Table stickyHeader aria-label="Medical history table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Date</TableCell>
            {!isMobile ? (
              <TableCell className={styles.tableHeaderCell}>Conditions</TableCell>
            ) : null}
            {!isMobile ? <TableCell className={styles.tableHeaderCell} align="right" /> : null}
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
                { width: '24%' },
                { width: '58%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '56%',
                secondaryWidth: '80%',
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow className={styles.noHoverRow}>
              <TableCell
                colSpan={columnCount}
                align="center"
                sx={{ borderBottom: 0, px: isMobile ? 1.5 : 3, py: 9 }}
              >
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <PersonSearchOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>No medical history yet</Typography>
                  <Typography className={styles.emptyStateText}>
                    Medical history records will appear here once entries are added for this
                    patient.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow hover key={item.id ?? `medical-history-row-${index}`}>
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          {formatDate(item.date)}
                        </Typography>
                        <Typography
                          component="span"
                          className={styles.mobileContact}
                          title={getConditionSummary(item)}
                        >
                          {getConditionSummary(item)}
                        </Typography>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    formatDate(item.date)
                  )}
                </TableCell>
                {!isMobile ? (
                  <TableCell className={styles.tableBodyCell}>
                    <Typography
                      title={getConditionSummary(item)}
                      sx={{
                        color: '#35506b',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        wordBreak: 'break-word',
                      }}
                    >
                      {getConditionSummary(item)}
                    </Typography>
                  </TableCell>
                ) : null}
                {!isMobile ? (
                  <TableCell className={styles.tableBodyCell} align="right">
                    {renderActionButtons(item)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PatientMedicalHistoryTable;
