import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
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
import {
  getTemplateItemKey,
  getTemplateTypeContent,
  TemplateFormModel,
  TemplateFormStateProps,
  TemplateType,
} from '../api/types';

type TemplateFormTableProps = TemplateFormStateProps & {
  templateType: TemplateType;
  items: TemplateFormModel[];
  selectedItem: TemplateFormModel | null;
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
    templateType,
    items,
    selectedItem,
    statusMessage,
    submitError,
    onOpenCreate,
    onOpenEdit,
    onOpenDelete,
    onClearMessages,
  } = props;
  const templateTypeContent = useMemo(() => getTemplateTypeContent(templateType), [templateType]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((leftItem, rightItem) =>
        (leftItem.templateName || '').localeCompare(rightItem.templateName || '')
      ),
    [items]
  );

  const listIcon = useMemo(() => {
    switch (templateType) {
      case TemplateType.Email:
        return <EmailRoundedIcon />;
      case TemplateType.Sms:
        return <SmsRoundedIcon />;
      default:
        return <ArticleRoundedIcon />;
    }
  }, [templateType]);

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
            {listIcon}
          </div>
          <div>
            <h3 className={styles.formPanelTitle}>{templateTypeContent.listTitle}</h3>
            <p className={styles.formPanelDescription}>{templateTypeContent.listDescription}</p>
          </div>
        </div>

        <div className={styles.templateToolbar}>
          <div>
            <Typography className={styles.userListMeta}>
              {sortedItems.length} {templateTypeContent.pluralLabel}
            </Typography>
          </div>

          <Button
            onClick={onOpenCreate}
            component="label"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            {templateTypeContent.addButtonLabel}
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
                        <Typography className={styles.emptyMiniTitle}>
                          {templateTypeContent.loadingTitle}
                        </Typography>
                        <Typography className={styles.emptyMiniText}>
                          {templateTypeContent.loadingText}
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedItems.length ? (
                  sortedItems.map((item) => {
                    const isSelected =
                      getTemplateItemKey(item) === getTemplateItemKey(selectedItem);

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
                        <Typography className={styles.emptyMiniTitle}>
                          {templateTypeContent.emptyTitle}
                        </Typography>
                        <Typography className={styles.emptyMiniText}>
                          {templateTypeContent.emptyText}
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
            <h3 className={styles.formPanelTitle}>{templateTypeContent.previewTitle}</h3>
            <p className={styles.formPanelDescription}>{templateTypeContent.previewDescription}</p>
          </div>
        </div>

        <div className={styles.templatePreviewSurface}>
          {selectedItem ? (
            <>
              <div className={styles.templatePreviewMeta}>
                <Typography className={styles.userListName}>
                  {selectedItem.templateName || 'Untitled template'}
                </Typography>
                <Typography className={styles.userListMeta}>
                  Last template date: {formatDateLabel(selectedItem.date)}
                </Typography>
              </div>
              <div className={styles.templatePreviewScroll}>
                <div
                  className={styles.templatePreviewHtml}
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedItem.templateContent?.trim() ||
                      '<p>No template content available.</p>',
                  }}
                />
              </div>
            </>
          ) : (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>
                {templateTypeContent.previewEmptyTitle}
              </Typography>
              <Typography className={styles.emptyMiniText}>
                {templateTypeContent.previewEmptyText}
              </Typography>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TemplateFormTable;
