import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import {
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FunctionComponent, JSX, useMemo } from 'react';

import styles from '../../style.scss.module.scss';
import patientStyles from '../../../patient/style.scss.module.scss';
import { TemplateFormModel, TemplateFormStateProps } from '../api/types';

type TemplateFormTableProps = TemplateFormStateProps & {
  statusMessage: string;
  submitError: string;
  onOpenCreate: () => void;
  onOpenEdit: (item: TemplateFormModel) => void;
  onOpenDelete: (item: TemplateFormModel) => void;
  onClearMessages: () => void;
};

const formatDateLabel = (value?: string | null): string => {
  if (!value) {
    return '--';
  }

  const parsedValue = new Date(value);
  if (Number.isNaN(parsedValue.getTime())) {
    return value;
  }

  return parsedValue.toLocaleString();
};

const TemplateFormTable: FunctionComponent<TemplateFormTableProps> = (
  props: TemplateFormTableProps
): JSX.Element => {
  const {
    state,
    setState,
    statusMessage,
    submitError,
    onOpenCreate,
    onOpenEdit,
    onOpenDelete,
    onClearMessages,
  } = props;

  const sortedItems = useMemo(
    () =>
      [...state.items].sort((leftItem, rightItem) =>
        (leftItem.templateName || '').localeCompare(rightItem.templateName || '')
      ),
    [state.items]
  );

  const handleSelect = (item: TemplateFormModel): void => {
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
            <ArticleRoundedIcon />
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>Template Forms</h3>
            <p className={styles.formPanelDescription}>
              Manage reusable clinic form templates and preview their content before use.
            </p>
          </div>
        </div>

        <div className={styles.templateToolbar}>
          <div>
            <Typography className={styles.userListMeta}>
              {state.totalItem} template{state.totalItem === 1 ? '' : 's'}
            </Typography>
          </div>

          <Button
            onClick={onOpenCreate}
            component="label"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Add Template
          </Button>
        </div>

        <div className={styles.templateTableWrap}>
          <TableContainer component={Paper} elevation={0}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Template Name</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.load ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <div className={styles.emptyMiniState}>
                        <Typography className={styles.emptyMiniTitle}>Loading templates</Typography>
                        <Typography className={styles.emptyMiniText}>
                          Fetching template forms from your clinic settings.
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length ? (
                  sortedItems.map((item) => {
                    const isSelected = item.id === state.selectedItem?.id;

                    return (
                      <TableRow
                        hover
                        key={item.id || item.templateName}
                        selected={isSelected}
                        onClick={() => handleSelect(item)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography className={styles.userListName}>
                            {item.templateName || 'Untitled template'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <div
                            className={`${patientStyles.buttonContainer} ${patientStyles.tableButtonContainer}`}
                          >
                            <button
                              type="button"
                              title="Edit"
                              aria-label="Edit template"
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
                              aria-label="Delete template"
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
                    <TableCell colSpan={2}>
                      <div className={styles.emptyMiniState}>
                        <Typography className={styles.emptyMiniTitle}>No template forms</Typography>
                        <Typography className={styles.emptyMiniText}>
                          Create your first template from the add button above.
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
            <h3 className={styles.formPanelTitle}>Template Preview</h3>
            <p className={styles.formPanelDescription}>
              Review the selected template content exactly as it will be shown.
            </p>
          </div>
        </div>

        <div className={styles.templatePreviewSurface}>
          {state.selectedItem ? (
            <>
              <div className={styles.templatePreviewMeta}>
                <Typography className={styles.userListName}>
                  {state.selectedItem.templateName || 'Untitled template'}
                </Typography>
                <Typography className={styles.userListMeta}>
                  Last template date: {formatDateLabel(state.selectedItem.date)}
                </Typography>
              </div>
              <div className={styles.templatePreviewScroll}>
                <div
                  className={styles.templatePreviewHtml}
                  dangerouslySetInnerHTML={{
                    __html:
                      state.selectedItem.templateContent?.trim() ||
                      '<p>No template content available.</p>',
                  }}
                />
              </div>
            </>
          ) : (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>No template selected</Typography>
              <Typography className={styles.emptyMiniText}>
                Choose a template from the left panel to preview it here.
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TemplateFormTable;
