import { FunctionComponent, JSX, MouseEvent, useState } from 'react';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Box,
  Chip,
  Divider,
  Popover,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { useAuthStore } from '../../common/store/authStore';
import type { ReportFilter, ReportsProps } from './api/types';
import ReportsFinance from './index-content/reports-finance';
import ReportsPatients from './index-content/reports-patients';
import ReportsAppointments from './index-content/reports-appointments';

type ReportTab = 'finance' | 'patients' | 'appointments';

const TABS: { value: ReportTab; label: string; icon: JSX.Element }[] = [
  { value: 'finance', label: 'Finance', icon: <AttachMoneyRoundedIcon fontSize="small" /> },
  { value: 'patients', label: 'Patients', icon: <GroupRoundedIcon fontSize="small" /> },
  { value: 'appointments', label: 'Appointments', icon: <EventNoteRoundedIcon fontSize="small" /> },
];

const DATE_PRESETS = [
  { label: 'This Month', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    };
  }},
  { label: 'This Quarter', getRange: () => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    return {
      from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10),
      to: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().slice(0, 10),
    };
  }},
  { label: 'This Year', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
      to: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10),
    };
  }},
  { label: 'Last Year', getRange: () => {
    const year = new Date().getFullYear() - 1;
    return {
      from: new Date(year, 0, 1).toISOString().slice(0, 10),
      to: new Date(year, 11, 31).toISOString().slice(0, 10),
    };
  }},
];

const ReportsModule: FunctionComponent<ReportsProps> = ({ clinicId }): JSX.Element => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.toLowerCase() ?? '';

  const visibleTabs = TABS.filter((tab) => {
    if (tab.value === 'finance') {
      return role === 'superadmin' || role === 'branchadmin' || role === 'accountant';
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<ReportTab>(visibleTabs[0]?.value ?? 'patients');
  const [filter, setFilter] = useState<ReportFilter>({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
  });

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [draftFrom, setDraftFrom] = useState(filter.dateFrom ?? '');
  const [draftTo, setDraftTo] = useState(filter.dateTo ?? '');
  const [refreshKey, setRefreshKey] = useState(0);

  const isFilterOpen = Boolean(filterAnchorEl);
  const isInvalidRange = Boolean(draftFrom && draftTo && draftFrom > draftTo);

  const filterLabel = filter.dateFrom && filter.dateTo
    ? `${filter.dateFrom} → ${filter.dateTo}`
    : filter.dateFrom
    ? `From ${filter.dateFrom}`
    : filter.dateTo
    ? `To ${filter.dateTo}`
    : 'All time';

  const handleOpenFilter = (e: MouseEvent<HTMLButtonElement>): void => {
    setDraftFrom(filter.dateFrom ?? '');
    setDraftTo(filter.dateTo ?? '');
    setFilterAnchorEl(e.currentTarget);
  };

  const handleCloseFilter = (): void => {
    setFilterAnchorEl(null);
  };

  const handleApply = (): void => {
    if (isInvalidRange) return;
    setFilter((prev) => ({ ...prev, dateFrom: draftFrom || undefined, dateTo: draftTo || undefined }));
    handleCloseFilter();
  };

  const handleClear = (): void => {
    setDraftFrom('');
    setDraftTo('');
    setFilter((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }));
    handleCloseFilter();
  };

  const handlePreset = (getRange: () => { from: string; to: string }): void => {
    const { from, to } = getRange();
    setDraftFrom(from);
    setDraftTo(to);
  };

  const handleRefresh = (): void => {
    setRefreshKey((k) => k + 1);
  };

  const activeFilter: ReportFilter = { ...filter, _key: String(refreshKey) } as ReportFilter & { _key: string };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <AssessmentRoundedIcon sx={{ color: '#2E6F40', fontSize: 28 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Reports & Analytics
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Clinic performance summary
          </Typography>
        </Box>
      </Stack>

      {/* Filter Bar */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        mb={2}
        flexWrap="wrap"
        useFlexGap
      >
        <Chip
          icon={<DateRangeRoundedIcon fontSize="small" />}
          label={filterLabel}
          onClick={handleOpenFilter as unknown as () => void}
          variant={filter.dateFrom || filter.dateTo ? 'filled' : 'outlined'}
          color={filter.dateFrom || filter.dateTo ? 'primary' : 'default'}
          size="small"
          clickable
        />
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh reports"
          aria-label="Refresh reports"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '50%',
          }}
        >
          <RefreshRoundedIcon fontSize="small" />
        </button>
      </Stack>

      {/* Date Range Filter Popover */}
      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 300 } }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          Date Range
        </Typography>

        {/* Presets */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              size="small"
              onClick={() => handlePreset(preset.getRange)}
              variant="outlined"
              clickable
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              From
            </Typography>
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              To
            </Typography>
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </Box>
          {isInvalidRange && (
            <Typography variant="caption" color="error">
              "From" date must be before "To" date.
            </Typography>
          )}
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
          <button
            type="button"
            onClick={handleClear}
            style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: 'none' }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isInvalidRange}
            style={{
              padding: '4px 12px',
              cursor: isInvalidRange ? 'not-allowed' : 'pointer',
              borderRadius: 4,
              border: 'none',
              background: '#2E6F40',
              color: '#fff',
              opacity: isInvalidRange ? 0.5 : 1,
            }}
          >
            Apply
          </button>
        </Stack>
      </Popover>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v: ReportTab) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'finance' && <ReportsFinance clinicId={clinicId} filter={activeFilter} />}
      {activeTab === 'patients' && <ReportsPatients clinicId={clinicId} filter={activeFilter} />}
      {activeTab === 'appointments' && <ReportsAppointments clinicId={clinicId} filter={activeFilter} />}
    </Box>
  );
};

export default ReportsModule;
