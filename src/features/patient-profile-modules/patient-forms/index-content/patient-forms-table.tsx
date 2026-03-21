import { FunctionComponent, JSX, useMemo } from 'react';
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
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import styles from '../../styles.module.scss';
import { PatientFormModel, PatientFormStateProps } from '../api/types';

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const formatDate = (value?: string | Date): string => toValidDateDisplay(value, 'MMM DD, YYYY');

const renderFormLabel = (item: PatientFormModel): string =>
  item.formType?.trim() || 'Untitled form';

const renderAssignedDoctorLabel = (item: PatientFormModel): string =>
  item.assignedDoctor?.trim() || '--';

const PatientFormsTable: FunctionComponent<PatientFormStateProps> = (
  props: PatientFormStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const columnCount = isMobile ? 1 : 4;
  const sortedItems = useMemo(
    () =>
      [...state.items].sort((leftItem, rightItem) => {
        const leftDate = parseDateValue(leftItem.date)?.getTime() || 0;
        const rightDate = parseDateValue(rightItem.date)?.getTime() || 0;
        return rightDate - leftDate;
      }),
    [state.items]
  );

  const renderActionButtons = (item: PatientFormModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="View"
        aria-label="View patient form"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.viewButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: false,
            isDelete: false,
            isView: true,
            openModal: true,
          })
        }
      >
        <VisibilityOutlinedIcon className={styles.iconView} />
      </button>
      <button
        type="button"
        title="Edit"
        aria-label="Edit patient form"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            isView: false,
            openModal: true,
          })
        }
      >
        <EditOutlinedIcon className={styles.iconEdit} />
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete patient form"
        className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            isView: false,
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
      <Table stickyHeader aria-label="Patient forms table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Date</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Form Type</TableCell>
                <TableCell className={styles.tableHeaderCell}>Assigned Dentist</TableCell>
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
                { width: '24%' },
                { width: '34%' },
                { width: '26%' },
                { kind: 'actions', align: 'right', itemCount: 3 },
              ]}
              mobileConfig={{
                primaryWidth: '74%',
                secondaryWidth: 132,
                secondaryHeight: 18,
                actionCount: 3,
                actionSize: 34,
              }}
            />
          ) : sortedItems.length === 0 ? (
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
                  <Typography className={styles.emptyStateTitle}>No forms yet</Typography>
                  <Typography className={styles.emptyStateText}>
                    Generated patient forms will appear here once you create one for this patient.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item, index) => (
              <TableRow hover key={item.id ?? `patient-form-row-${index}`}>
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          {renderFormLabel(item)}
                        </Typography>
                        <div className={styles.mobileMeta}>
                          <Typography component="span" className={styles.mobileContact}>
                            {formatDate(item.date)}
                          </Typography>
                          <Typography component="span" className={styles.mobileContact}>
                            {renderAssignedDoctorLabel(item)}
                          </Typography>
                        </div>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    formatDate(item.date)
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>{renderFormLabel(item)}</TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {renderAssignedDoctorLabel(item)}
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

export default PatientFormsTable;
