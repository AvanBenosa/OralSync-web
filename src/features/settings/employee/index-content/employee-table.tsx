import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FunctionComponent, JSX, useMemo } from 'react';

import patientStyles from '../../../patient/style.scss.module.scss';
import styles from '../../style.scss.module.scss';
import {
  EmployeeModel,
  EmployeeStateProps,
  getEmployeeItemKey,
  getEmployeePrefixLabel,
  getEmployeeRoleLabel,
} from '../api/types';

type EmployeeTableProps = EmployeeStateProps & {
  items: EmployeeModel[];
  selectedItem: EmployeeModel | null;
  statusMessage: string;
  submitError: string;
  onOpenCreate: () => void;
  onOpenEdit: (item: EmployeeModel) => void;
  onOpenDelete: (item: EmployeeModel) => void;
  onClearMessages: () => void;
};

const detailValue = (value?: string | null, fallback: string = '--'): string =>
  value?.trim() || fallback;

const buildEmployeeName = (item?: EmployeeModel | null): string => {
  const values = [item?.firstName?.trim(), item?.middleName?.trim(), item?.lastName?.trim()].filter(
    Boolean
  );

  return values.join(' ') || 'Unnamed employee';
};

const EmployeeTable: FunctionComponent<EmployeeTableProps> = (
  props: EmployeeTableProps
): JSX.Element => {
  const {
    state,
    setState,
    items,
    selectedItem,
    statusMessage,
    submitError,
    onOpenCreate,
    onOpenEdit,
    onOpenDelete,
    onClearMessages,
  } = props;

  const sortedItems = useMemo(
    () =>
      [...items].sort((leftItem, rightItem) =>
        `${leftItem.lastName || ''} ${leftItem.firstName || ''}`.localeCompare(
          `${rightItem.lastName || ''} ${rightItem.firstName || ''}`
        )
      ),
    [items]
  );

  const handleSelect = (item: EmployeeModel): void => {
    onClearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
    }));
  };

  return (
    <div className={styles.dualPanelGrid}>
      <section className={`${styles.formPanel} ${styles.templateListPanel}`}>
        <div className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <BadgeRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>Employees</h3>
            <p className={styles.formPanelDescription}>
              Manage the employee list used by your clinic, including contact details and assigned
              roles.
            </p>
          </div>
        </div>

        <div className={styles.templateToolbar}>
          <Typography className={styles.userListMeta}>
            {sortedItems.length} employee{sortedItems.length === 1 ? '' : 's'}
          </Typography>

          <Button
            onClick={onOpenCreate}
            component="label"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Add Employee
          </Button>
        </div>

        <div className={styles.templateTableWrap}>
          <TableContainer component={Paper} elevation={0}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.load ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className={styles.emptyMiniState}>
                        <Typography className={styles.emptyMiniTitle}>
                          Loading employees
                        </Typography>
                        <Typography className={styles.emptyMiniText}>
                          Fetching the employees saved for this clinic.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length ? (
                  sortedItems.map((item) => {
                    const isSelected = getEmployeeItemKey(item) === getEmployeeItemKey(selectedItem);

                    return (
                      <TableRow
                        hover
                        key={getEmployeeItemKey(item)}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography className={styles.userListName}>
                            {buildEmployeeName(item)}
                          </Typography>
                          <Typography className={styles.userListMeta}>
                            {detailValue(item.emailAddress)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography className={styles.userListMeta}>
                            {getEmployeeRoleLabel(item.role)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <div
                            className={`${patientStyles.buttonContainer} ${patientStyles.tableButtonContainer}`}
                          >
                            <button
                              type="button"
                              title="Edit"
                              aria-label="Edit employee"
                              className={`${patientStyles.buttonItem} ${patientStyles.tableActionButton} ${patientStyles.editButton}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenEdit(item);
                              }}
                            >
                              <EditOutlinedIcon className={patientStyles.iconEdit} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label="Delete employee"
                              className={`${patientStyles.buttonItem} ${patientStyles.tableActionButton} ${patientStyles.deleteButton}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenDelete(item);
                              }}
                            >
                              <DeleteOutlineOutlinedIcon className={patientStyles.iconDelete} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className={styles.emptyMiniState}>
                        <Typography className={styles.emptyMiniTitle}>No employees</Typography>
                        <Typography className={styles.emptyMiniText}>
                          Add your first employee record to start organizing your clinic team.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {submitError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        ) : null}
        {statusMessage ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            {statusMessage}
          </Alert>
        ) : null}
      </section>

      <section className={`${styles.formPanel} ${styles.templatePreviewPanel}`}>
        <div className={styles.formPanelHeader}>
          <div className={styles.formPanelIcon} aria-hidden="true">
            <PreviewRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>Employee Details</h3>
            <p className={styles.formPanelDescription}>
              Review the selected employee information before updating or removing it.
            </p>
          </div>
        </div>

        <div className={styles.templatePreviewSurface}>
          {selectedItem ? (
            <Stack spacing={2.5} sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography className={styles.userListName}>
                    {buildEmployeeName(selectedItem)}
                  </Typography>
                  <Chip
                    size="small"
                    label={getEmployeeRoleLabel(selectedItem.role)}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: 'rgba(47, 109, 179, 0.1)',
                      color: '#1d6fb6',
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                <Typography className={styles.userListMeta}>
                  Prefix: {getEmployeePrefixLabel(selectedItem.preffix)}
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <WorkOutlineRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Role</Typography>
                    <Typography className={styles.userListEmail}>
                      {getEmployeeRoleLabel(selectedItem.role)}
                    </Typography>
                  </div>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <PersonOutlineRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Full Name</Typography>
                    <Typography className={styles.userListEmail}>
                      {buildEmployeeName(selectedItem)}
                    </Typography>
                  </div>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <MailOutlineRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Email Address</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.emailAddress)}
                    </Typography>
                  </div>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <CallRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Contact Number</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.contactNumber)}
                    </Typography>
                  </div>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <HomeRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Address</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.address)}
                    </Typography>
                  </div>
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <ImageOutlinedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Profile Picture</Typography>
                    <Typography className={styles.userListEmail} sx={{ wordBreak: 'break-all' }}>
                      {detailValue(selectedItem.profilePicture)}
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>No employee selected</Typography>
              <Typography className={styles.emptyMiniText}>
                Choose an employee from the left panel to review the saved details.
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmployeeTable;
