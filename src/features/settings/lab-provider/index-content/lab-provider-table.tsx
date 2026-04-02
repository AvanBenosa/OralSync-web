import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
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
import { getLabProviderItemKey, LabProviderModel, LabProviderStateProps } from '../api/types';

type LabProviderTableProps = LabProviderStateProps & {
  items: LabProviderModel[];
  selectedItem: LabProviderModel | null;
  statusMessage: string;
  submitError: string;
  onOpenCreate: () => void;
  onOpenEdit: (item: LabProviderModel) => void;
  onOpenDelete: (item: LabProviderModel) => void;
  onClearMessages: () => void;
};

const detailValue = (value?: string | null, fallback: string = '--'): string =>
  value?.trim() || fallback;

const LabProviderTable: FunctionComponent<LabProviderTableProps> = (
  props: LabProviderTableProps
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
        (leftItem.labName || '').localeCompare(rightItem.labName || '')
      ),
    [items]
  );

  const handleSelect = (item: LabProviderModel): void => {
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
            <BiotechRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>Lab Providers</h3>
            <p className={styles.formPanelDescription}>
              Manage clinic lab partners, their contact information, and the type of services they
              handle.
            </p>
          </div>
        </div>

        <div className={styles.templateToolbar}>
          <Typography className={styles.userListMeta}>
            {sortedItems.length} lab provider{sortedItems.length === 1 ? '' : 's'}
          </Typography>

          <Button
            onClick={onOpenCreate}
            component="label"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Add Lab Provider
          </Button>
        </div>

        <div className={styles.templateTableWrap}>
          <TableContainer component={Paper} elevation={0}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lab Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.load ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className={styles.emptyMiniState}>
                        <Typography className={styles.emptyMiniTitle}>
                          Loading lab providers
                        </Typography>
                        <Typography className={styles.emptyMiniText}>
                          Fetching your clinic lab providers and contacts.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length ? (
                  sortedItems.map((item) => {
                    const isSelected =
                      getLabProviderItemKey(item) === getLabProviderItemKey(selectedItem);

                    return (
                      <TableRow
                        hover
                        key={getLabProviderItemKey(item)}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography className={styles.userListName}>
                            {detailValue(item.labName, 'Unnamed lab provider')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography className={styles.userListMeta}>
                            {detailValue(item.labType)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <div
                            className={`${patientStyles.buttonContainer} ${patientStyles.tableButtonContainer}`}
                          >
                            <button
                              type="button"
                              title="Edit"
                              aria-label="Edit lab provider"
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
                              aria-label="Delete lab provider"
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
                        <Typography className={styles.emptyMiniTitle}>No lab providers</Typography>
                        <Typography className={styles.emptyMiniText}>
                          Add your first lab provider to keep referral and contact details in one
                          place.
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
            <h3 className={styles.formPanelTitle}>Lab Provider Details</h3>
            <p className={styles.formPanelDescription}>
              Review the selected lab provider information before updating or removing it.
            </p>
          </div>
        </div>

        <div className={styles.templatePreviewSurface}>
          {selectedItem ? (
            <Stack spacing={2.5} sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography className={styles.userListName}>
                    {detailValue(selectedItem.labName, 'Unnamed lab provider')}
                  </Typography>
                  <Chip
                    size="small"
                    label={detailValue(selectedItem.labType, 'General')}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: 'rgba(47, 109, 179, 0.1)',
                      color: '#1d6fb6',
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                <Typography className={styles.userListMeta}>
                  Keep this contact updated for referrals, outsourced work, and case coordination.
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ p: 1.5, border: '1px solid rgba(206, 218, 229, 0.95)', borderRadius: 2 }}
                >
                  <LocalHospitalRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Lab Type</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.labType)}
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
                    <Typography className={styles.userListMeta}>Contact Person</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.contactPerson)}
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
                  <MailOutlineRoundedIcon sx={{ color: '#2f6db3', mt: '2px' }} />
                  <div>
                    <Typography className={styles.userListMeta}>Email Address</Typography>
                    <Typography className={styles.userListEmail}>
                      {detailValue(selectedItem.emailAddress)}
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>No lab provider selected</Typography>
              <Typography className={styles.emptyMiniText}>
                Choose a lab provider from the left panel to review its clinic contact details.
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LabProviderTable;
