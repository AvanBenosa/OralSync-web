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
import { useNavigate } from 'react-router-dom';

import { PatientModel, PatientStateProps } from '../api/types';
import styles from '../style.scss.module.scss';
import HighlightText from '../../../common/components/Highlight';
import TableLoadingSkeleton from '../../../common/components/TableLoadingSkeleton';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';

const formatPatientName = (patient: PatientModel): string => {
  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (!lastName && !givenNames) {
    return '--';
  }

  if (!lastName) {
    return givenNames;
  }

  if (!givenNames) {
    return lastName;
  }

  return `${lastName}, ${givenNames}`;
};

const formatBirthDate = (birthDate?: string | Date): string =>
  toValidDateDisplay(birthDate, 'MMM DD, YYYY');

const PatientTable: FunctionComponent<PatientStateProps> = (
  props: PatientStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const columnCount = isMobile ? 1 : 5;

  const handleOpenPatientProfile = (item: PatientModel): void => {
    if (item.id) {
      navigate(`/patient-profile/${item.id}`);
      return;
    }

    navigate('/patient');
  };

  const renderActionButtons = (item: PatientModel): JSX.Element => (
    <div className={`${styles.buttonContainer} ${styles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit patient"
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
        aria-label="Delete patient"
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
      <Table stickyHeader aria-label="Patient table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.tableHeaderCell}>Full Name</TableCell>
            {!isMobile ? (
              <>
                <TableCell className={styles.tableHeaderCell}>Patient No.</TableCell>
                <TableCell className={styles.tableHeaderCell}>Contact No.</TableCell>
                <TableCell className={styles.tableHeaderCell}>Birth Date</TableCell>
                <TableCell className={styles.tableHeaderCell} align="right"></TableCell>
              </>
            ) : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {state.load ? (
            <TableLoadingSkeleton
              rowCount={isMobile ? 4 : 6}
              isMobile={isMobile}
              cellClassName={styles.tableBodyCell}
              desktopCells={[
                { width: '68%', height: 26 },
                { width: '62%' },
                { width: '58%' },
                { width: '54%' },
                { kind: 'actions', align: 'right' },
              ]}
              mobileConfig={{
                primaryWidth: '72%',
                secondaryWidth: '44%',
                secondaryHeight: 20,
                actionCount: 2,
                actionSize: 34,
              }}
            />
          ) : state.items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                align="center"
                sx={{ borderBottom: 0, px: isMobile ? 1.5 : 3, py: 9 }}
              >
                <Box className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <PersonSearchOutlinedIcon className={styles.emptyStateGlyph} />
                  </div>
                  <Typography className={styles.emptyStateTitle}>No patient records yet</Typography>
                  <Typography className={styles.emptyStateText}>
                    Patient information will appear here once records are added or your search
                    matches existing entries.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            state.items.map((item, index) => (
              <TableRow
                hover
                key={
                  item.id !== undefined
                    ? `patient-id-${item.id}`
                    : item.patientNumber
                    ? `patient-number-${item.patientNumber}`
                    : `patient-fallback-${index}`
                }
              >
                <TableCell className={styles.tableBodyCell}>
                  {isMobile ? (
                    <div className={styles.mobileRowInline}>
                      <div className={styles.mobileMain}>
                        <Typography component="span" className={styles.mobileName}>
                          <button
                            type="button"
                            className={styles.nameButton}
                            onClick={(): void => handleOpenPatientProfile(item)}
                          >
                            {formatPatientName(item)}
                          </button>
                        </Typography>
                        <Typography component="span" className={styles.mobileContact}>
                          {item.contactNumber || '--'}
                        </Typography>
                      </div>
                      <div className={styles.mobileActions}>{renderActionButtons(item)}</div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.nameButton}
                      onClick={(): void => handleOpenPatientProfile(item)}
                    >
                      <HighlightText query={state.search} text={formatPatientName(item)} />
                    </button>
                  )}
                </TableCell>
                {!isMobile ? (
                  <>
                    <TableCell className={styles.tableBodyCell}>
                      {item.patientNumber || '--'}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {item.contactNumber || '--'}
                    </TableCell>
                    <TableCell className={styles.tableBodyCell}>
                      {formatBirthDate(item.birthDate)}
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

export default PatientTable;
