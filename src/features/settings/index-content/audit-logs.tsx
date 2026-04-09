import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import PolicyRoundedIcon from '@mui/icons-material/PolicyRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';

import RoundedPagination from '../../../common/components/RoundedPagination';
import { toValidDateDisplay } from '../../../common/helpers/toValidateDateDisplay';
import { HandleGetAuditLogs } from '../audit-logs/api/handlers';
import type { AuditLogStateModel } from '../audit-logs/api/types'; //AuditLogModel
import styles from '../style.scss.module.scss';

const formatAuditDate = (value?: string): string =>
  value ? toValidDateDisplay(value, 'MMM DD, YYYY, hh:mm A') : '--';

const AuditLogs: FunctionComponent = (): JSX.Element => {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [state, setState] = useState<AuditLogStateModel>({
    items: [],
    load: true,
    search: '',
    dateFrom: '',
    dateTo: '',
    pageStart: 0,
    pageEnd: 25,
    totalItem: 0,
  });

  const summaryMetrics = useMemo(() => {
    const modules = new Set(state.items.map((item) => item.module || 'Unknown'));
    const actors = new Set(state.items.map((item) => item.actorName || 'System'));

    return {
      entryCount: state.totalItem,
      moduleCount: modules.size,
      actorCount: actors.size,
    };
  }, [state.items, state.totalItem]);

  const loadAuditLogs = async (forceRefresh: boolean = false): Promise<void> => {
    setErrorMessage(null);
    setState((prev: AuditLogStateModel) => ({
      ...prev,
      load: true,
    }));

    try {
      await HandleGetAuditLogs(
        {
          ...state,
        },
        setState,
        forceRefresh
      );
    } catch (error) {
      setState((prev: AuditLogStateModel) => ({
        ...prev,
        load: false,
      }));

      setErrorMessage(error instanceof Error ? error.message : 'Unable to load audit logs.');
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void loadAuditLogs(false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // Fetch when audit filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.search, state.dateFrom, state.dateTo, state.pageStart, state.pageEnd]);

  return (
    <>
      <div className={styles.tabPanelHeader}>
        <div className={styles.tabPanelIcon}>
          <FactCheckRoundedIcon />
        </div>
        <div className={styles.tabPanelText}>
          <h2 className={styles.tabPanelTitle}>Audit Logs</h2>
          <p className={styles.tabPanelDescription}>
            Review live clinic-scoped activity history using the backend endpoint wired for this
            settings tab. Entries are derived from the current entity audit metadata stored across
            clinic modules.
          </p>
        </div>
      </div>

      <div className={styles.auditSummaryGrid}>
        <Paper className={styles.auditSummaryCard} elevation={0}>
          <div className={styles.auditSummaryIcon}>
            <PolicyRoundedIcon />
          </div>
          <div>
            <Typography className={styles.auditSummaryLabel}>Entries</Typography>
            <Typography className={styles.auditSummaryValue}>
              {summaryMetrics.entryCount.toLocaleString('en-US')}
            </Typography>
            <Typography className={styles.auditSummaryMeta}>
              Audit events matching the current search and page filters.
            </Typography>
          </div>
        </Paper>

        <Paper className={styles.auditSummaryCard} elevation={0}>
          <div className={styles.auditSummaryIcon}>
            <StorageRoundedIcon />
          </div>
          <div>
            <Typography className={styles.auditSummaryLabel}>Modules</Typography>
            <Typography className={styles.auditSummaryValue}>
              {summaryMetrics.moduleCount.toLocaleString('en-US')}
            </Typography>
            <Typography className={styles.auditSummaryMeta}>
              Distinct clinic modules represented in the current result set.
            </Typography>
          </div>
        </Paper>

        <Paper className={styles.auditSummaryCard} elevation={0}>
          <div className={styles.auditSummaryIcon}>
            <HubRoundedIcon />
          </div>
          <div>
            <Typography className={styles.auditSummaryLabel}>Actors</Typography>
            <Typography className={styles.auditSummaryValue}>
              {summaryMetrics.actorCount.toLocaleString('en-US')}
            </Typography>
            <Typography className={styles.auditSummaryMeta}>
              Users or system identities associated with the visible audit entries.
            </Typography>
          </div>
        </Paper>
      </div>

      <div className={styles.auditPanelGrid}>
        <section className={styles.auditSurface}>
          <div className={styles.auditSectionHeader}>
            <Typography className={styles.auditSectionTitle}>Search Audit Trail</Typography>
            <Typography className={styles.auditSectionText}>
              Leave search blank to show all audit logs, or narrow results by text and date range.
            </Typography>
          </div>

          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.25,
              flexDirection: { xs: 'column', md: 'row' },
              flexWrap: 'wrap',
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search audit logs"
              value={state.search}
              onChange={(event) => {
                const nextValue = event.target.value;
                setState((prev: AuditLogStateModel) => ({
                  ...prev,
                  search: nextValue,
                  pageStart: 0,
                }));
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: '#6c85a0' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="small"
              type="date"
              label="From"
              value={state.dateFrom}
              onChange={(event) => {
                const nextValue = event.target.value;
                setState((prev: AuditLogStateModel) => ({
                  ...prev,
                  dateFrom: nextValue,
                  pageStart: 0,
                }));
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TodayRoundedIcon sx={{ color: '#6c85a0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: { xs: '100%', sm: 170 },
              }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={state.dateTo}
              onChange={(event) => {
                const nextValue = event.target.value;
                setState((prev: AuditLogStateModel) => ({
                  ...prev,
                  dateTo: nextValue,
                  pageStart: 0,
                }));
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TodayRoundedIcon sx={{ color: '#6c85a0' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: { xs: '100%', sm: 170 },
              }}
            />
            <IconButton
              aria-label="Refresh audit logs"
              onClick={() => {
                void loadAuditLogs(true);
              }}
              disabled={state.load}
              sx={{
                width: 42,
                height: 42,
                border: '1px solid rgba(174, 198, 218, 0.95)',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, #f2f7fc 0%, #dfeaf5 100%)',
                boxShadow: '0 10px 20px rgba(62, 98, 141, 0.12)',
                color: '#2f6db3',
              }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Box>

          {errorMessage ? (
            <Alert severity="error" className={styles.auditAlert}>
              {errorMessage}
            </Alert>
          ) : null}

          {state.load ? (
            <div className={styles.auditLoadingState}>
              <CircularProgress size={28} />
              <Typography className={styles.auditSectionText}>Loading audit logs...</Typography>
            </div>
          ) : state.items.length === 0 ? (
            <div className={styles.emptyMiniState}>
              <Typography className={styles.emptyMiniTitle}>No audit logs found</Typography>
              <Typography className={styles.emptyMiniText}>
                No audit entries matched the current clinic scope and search filters.
              </Typography>
            </div>
          ) : (
            <TableContainer className={styles.auditTableWrap} component={Paper} elevation={0}>
              <Table stickyHeader aria-label="Audit log table">
                <TableHead>
                  <TableRow>
                    <TableCell>Summary</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography className={styles.auditTablePrimaryText}>
                          {item.summary || '--'}
                        </Typography>
                        <Typography className={styles.auditTableSecondaryText}>
                          {item.entityType || 'Unknown'} - {item.entityId || '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography className={styles.auditTableSecondaryText}>
                          {item.module || '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <span className={styles.auditActionPill}>{item.action || 'Created'}</span>
                      </TableCell>
                      <TableCell>
                        <Typography className={styles.auditTableSecondaryText}>
                          {item.actorName || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography className={styles.auditTableSecondaryText}>
                          {formatAuditDate(item.occurredAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <RoundedPagination
            page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
            pageSize={state.pageEnd}
            totalItems={state.totalItem}
            onChange={(nextPage) => {
              setState((prev: AuditLogStateModel) => ({
                ...prev,
                pageStart: (nextPage - 1) * prev.pageEnd,
              }));
            }}
          />
        </section>
      </div>
    </>
  );
};

export default AuditLogs;
