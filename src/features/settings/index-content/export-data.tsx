import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import TableViewRoundedIcon from '@mui/icons-material/TableViewRounded';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
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
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import { downloadExportDatasetCsv, getExportDatasets } from '../export-data/api/api';
import type { ExportDatasetModel } from '../export-data/api/types';
import styles from '../style.scss.module.scss';

const formatCount = (value?: number): string => {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value ?? 0)) : 0;
  return normalizedValue.toLocaleString('en-US');
};

const ExportData: FunctionComponent = (): JSX.Element => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [items, setItems] = useState<ExportDatasetModel[]>([]);
  const [load, setLoad] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingKey, setDownloadingKey] = useState('');

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const categoryComparison = left.category.localeCompare(right.category);
        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return left.label.localeCompare(right.label);
      }),
    [items]
  );

  const totalRecords = useMemo(
    () => items.reduce((total, item) => total + Math.max(0, Number(item.recordCount || 0)), 0),
    [items]
  );
  const categoryCount = useMemo(() => new Set(items.map((item) => item.category)).size, [items]);

  const loadDatasets = async (): Promise<void> => {
    setLoad(true);
    setErrorMessage('');

    try {
      setItems(await getExportDatasets());
    } catch (error: any) {
      setErrorMessage(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to load exportable datasets.'
      );
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => {
    void loadDatasets();
  }, []);

  const handleDownload = async (item: ExportDatasetModel): Promise<void> => {
    setDownloadingKey(item.key);

    try {
      await downloadExportDatasetCsv(item.key, item.fileName);
    } finally {
      setDownloadingKey('');
    }
  };

  const renderEmptyState = (): JSX.Element => (
    <div className={styles.emptyMiniState}>
      <StorageRoundedIcon sx={{ fontSize: 34, color: '#5c7992' }} />
      <Typography className={styles.emptyMiniTitle}>No export datasets found</Typography>
      <Typography className={styles.emptyMiniText}>
        Exportable clinic tables will appear here once the export service is available.
      </Typography>
    </div>
  );

  return (
    <div>
      <div className={styles.exportHeaderRow}>
        <div className={styles.tabPanelHeader}>
          <div className={styles.tabPanelIcon}>
            <FileDownloadRoundedIcon />
          </div>
          <div className={styles.tabPanelText}>
            <h2 className={styles.tabPanelTitle}>Export Data</h2>
            <p className={styles.tabPanelDescription}>
              Download clinic data as CSV files. Each export is scoped to the currently signed-in
              clinic and generated directly from the saved database records.
            </p>
          </div>
        </div>
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          className={styles.moduleActionButton}
          onClick={() => void loadDatasets()}
          disabled={load}
        >
          {load ? 'Refreshing...' : 'Refresh List'}
        </Button>
      </div>

      {errorMessage ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      ) : null}

      <div className={styles.exportSurface}>
        {/* <section className={styles.exportHeroCard}>
          <div className={styles.exportHeroContent}>
            <Typography className={styles.exportHeroEyebrow}>Clinic Data Export</Typography>
            <Typography className={styles.exportHeroTitle}>CSV Export Center</Typography>
            <Typography className={styles.exportHeroText}>
              Use this tab to export the tables you want to back up, migrate, or review outside the
              system. CSV files open easily in Excel, Google Sheets, and most reporting tools.
            </Typography>
          </div>

          <div className={styles.exportHeroMetrics}>
            <div className={styles.exportHeroMetric}>
              <span className={styles.exportHeroMetricLabel}>Datasets</span>
              <strong className={styles.exportHeroMetricValue}>{formatCount(items.length)}</strong>
              <span className={styles.exportHeroMetricMeta}>Available exportable tables</span>
            </div>
            <div className={styles.exportHeroMetric}>
              <span className={styles.exportHeroMetricLabel}>Records</span>
              <strong className={styles.exportHeroMetricValue}>{formatCount(totalRecords)}</strong>
              <span className={styles.exportHeroMetricMeta}>Rows across the listed datasets</span>
            </div>
            <div className={styles.exportHeroMetric}>
              <span className={styles.exportHeroMetricLabel}>Modules</span>
              <strong className={styles.exportHeroMetricValue}>{formatCount(categoryCount)}</strong>
              <span className={styles.exportHeroMetricMeta}>
                Clinic, patient, finance, and lab data
              </span>
            </div>
          </div>
        </section> */}

        <Alert severity="info">
          Exports include the database columns saved for each dataset. You can download only the
          tables you need, and empty tables still export with CSV headers.
        </Alert>

        {isCompact ? (
          <div className={styles.exportDatasetList}>
            {load ? (
              <div className={styles.exportLoadingState}>
                <CircularProgress size={28} />
              </div>
            ) : sortedItems.length === 0 ? (
              renderEmptyState()
            ) : (
              sortedItems.map((item) => {
                const isDownloading = downloadingKey === item.key;

                return (
                  <article key={item.key} className={styles.exportDatasetCard}>
                    <div className={styles.exportDatasetCardHeader}>
                      <div className={styles.exportDatasetCardHeaderText}>
                        <Typography className={styles.exportDatasetCardTitle}>
                          {item.label}
                        </Typography>
                        <Typography className={styles.exportDatasetCardDescription}>
                          {item.description}
                        </Typography>
                      </div>
                      <Chip label={item.category} size="small" variant="outlined" />
                    </div>

                    <div className={styles.exportDatasetChipRow}>
                      <Chip
                        icon={<TableViewRoundedIcon />}
                        label={item.format}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <span className={styles.exportDatasetRecordPill}>
                        {formatCount(item.recordCount)} records
                      </span>
                    </div>

                    <Divider />

                    <div className={styles.exportDatasetMetaGrid}>
                      <div className={styles.exportDatasetMetaItem}>
                        <span className={styles.exportDatasetMetaLabel}>Module</span>
                        <span className={styles.exportDatasetMetaValue}>{item.category}</span>
                      </div>
                      <div className={styles.exportDatasetMetaItem}>
                        <span className={styles.exportDatasetMetaLabel}>Database Table</span>
                        <span className={styles.exportDatasetMetaValue}>{item.tableName}</span>
                      </div>
                      <div className={styles.exportDatasetMetaItem}>
                        <span className={styles.exportDatasetMetaLabel}>File Name</span>
                        <span className={styles.exportDatasetMetaValue}>{item.fileName}</span>
                      </div>
                    </div>

                    <Button
                      variant="contained"
                      startIcon={
                        isDownloading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <DownloadRoundedIcon />
                        )
                      }
                      onClick={() => void handleDownload(item)}
                      disabled={isDownloading}
                      className={styles.exportDatasetActionButton}
                    >
                      {isDownloading ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </article>
                );
              })
            )}
          </div>
        ) : (
          <div className={styles.exportTableWrap}>
            <TableContainer component={Paper} elevation={0}>
              <Table stickyHeader aria-label="Exportable dataset table">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Database Table</TableCell>
                    <TableCell align="right">Records</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {load ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : sortedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        {renderEmptyState()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedItems.map((item) => {
                      const isDownloading = downloadingKey === item.key;

                      return (
                        <TableRow hover key={item.key}>
                          <TableCell>
                            <Chip label={item.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography className={styles.exportTablePrimaryText}>
                                {item.label}
                              </Typography>
                              <Typography className={styles.exportTableSecondaryText}>
                                {item.description}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography className={styles.exportTablePrimaryTextSecondary}>
                                {item.tableName}
                              </Typography>
                              <Typography className={styles.exportTableSecondaryText}>
                                {item.fileName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Typography className={styles.exportTableCountText}>
                              {formatCount(item.recordCount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<TableViewRoundedIcon />}
                              label={item.format}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={
                                isDownloading ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <DownloadRoundedIcon />
                                )
                              }
                              onClick={() => void handleDownload(item)}
                              disabled={isDownloading}
                            >
                              {isDownloading ? 'Exporting...' : 'Export CSV'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportData;
