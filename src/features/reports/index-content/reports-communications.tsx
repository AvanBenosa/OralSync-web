import { FunctionComponent, JSX, useEffect, useState } from 'react';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import moment from 'moment';

import RoundedPagination from '../../../common/components/RoundedPagination';
import { GetNotificationLogs } from '../api/api';
import type {
  NotificationLogItem,
  NotificationLogsModel,
  ReportFilter,
  ReportsProps,
} from '../api/types';
import {
  ReportsEmptyState,
  reportFilterChipSx,
  reportTableBodyCellSx,
  reportTableContainerSx,
  reportTableHeaderCellSx,
} from './reports-ui';

type ChannelFilter = 'all' | 'email' | 'sms';

const CHANNEL_FILTERS: { value: ChannelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

function formatNotificationType(raw: string): string {
  switch (raw) {
    case 'AppointmentReminder':
      return 'Appointment Reminder';
    case 'BirthdayGreeting':
      return 'Birthday Greeting';
    case 'PrescriptionReady':
      return 'Prescription Ready';
    case 'PaymentReminder':
      return 'Payment Reminder';
    case 'SystemNotification':
      return 'System Notification';
    default:
      return raw;
  }
}

const ChannelChip: FunctionComponent<{ channel: string }> = ({ channel }): JSX.Element => {
  const isEmail = channel.toLowerCase() === 'email';

  return (
    <Chip
      icon={isEmail ? <EmailRoundedIcon fontSize="small" /> : <SmsRoundedIcon fontSize="small" />}
      label={isEmail ? 'Email' : 'SMS'}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 11,
        bgcolor: isEmail ? '#e8f1fb' : '#e8f5e9',
        color: isEmail ? '#2d6dab' : '#2e7d32',
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  );
};

const StatusChip: FunctionComponent<{
  isSent: boolean;
  isFailed: boolean;
  failureReason?: string | null;
}> = ({ isSent, isFailed, failureReason }): JSX.Element => {
  if (isFailed) {
    return (
      <Tooltip title={failureReason ?? 'Send failed'} placement="top">
        <Chip
          icon={<ErrorOutlineRoundedIcon fontSize="small" />}
          label="Failed"
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: 11,
            bgcolor: '#fdecea',
            color: '#c62828',
            '& .MuiChip-icon': { color: 'inherit' },
            cursor: failureReason ? 'help' : 'default',
          }}
        />
      </Tooltip>
    );
  }

  if (isSent) {
    return (
      <Chip
        icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
        label="Sent"
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: 11,
          bgcolor: '#e8f5e9',
          color: '#2e7d32',
          '& .MuiChip-icon': { color: 'inherit' },
        }}
      />
    );
  }

  return (
    <Chip
      label="Pending"
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: 11,
        bgcolor: '#fff8e1',
        color: '#f57f17',
      }}
    />
  );
};

type ReportsCommunicationsProps = ReportsProps & { filter: ReportFilter };

const ReportsCommunications: FunctionComponent<ReportsCommunicationsProps> = ({
  clinicId,
  filter,
}): JSX.Element => {
  const [data, setData] = useState<NotificationLogsModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const refreshKey = (filter as ReportFilter & { _key?: string })._key ?? '';
  const { branchId, dateFrom, dateTo, dentistId } = filter;

  useEffect(() => {
    setPage(1);
  }, [branchId, channelFilter, dateFrom, dateTo, dentistId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const channelParam = channelFilter === 'email' ? 1 : channelFilter === 'sms' ? 2 : undefined;

    const fetchData = async (): Promise<void> => {
      try {
        const requestFilter: ReportFilter = {
          branchId,
          dateFrom,
          dateTo,
          dentistId,
        };

        const result = await GetNotificationLogs(
          clinicId,
          requestFilter,
          page,
          channelParam,
          refreshKey !== ''
        );

        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load communication logs.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [branchId, channelFilter, clinicId, dateFrom, dateTo, dentistId, page, refreshKey]);

  const items: NotificationLogItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageSize = data?.pageSize ?? 50;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: { xs: 'auto', lg: '100%' },
        minHeight: { xs: 'auto', lg: '100%' },
        maxHeight: { xs: 'none', lg: '100%' },
      }}
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {CHANNEL_FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            size="small"
            clickable
            onClick={(): void => setChannelFilter(item.value)}
            variant={channelFilter === item.value ? 'filled' : 'outlined'}
            sx={reportFilterChipSx(channelFilter === item.value)}
          />
        ))}
      </Stack>

      {error && (
        <Typography color="#b23b57" variant="body2" fontWeight={700}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: { xs: 'auto', lg: 0 },
          maxHeight: { xs: 'none', lg: '100%' },
        }}
      >
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            ...reportTableContainerSx,
            flex: 1,
            minHeight: { xs: 0, lg: 0 },
            maxHeight: { xs: 'none', lg: '100%' },
            overflowX: 'auto',
            overflowY: { xs: 'visible', lg: 'auto' },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={reportTableHeaderCellSx}>Date / Time</TableCell>
                <TableCell sx={reportTableHeaderCellSx}>Type</TableCell>
                <TableCell sx={reportTableHeaderCellSx}>Channel</TableCell>
                <TableCell sx={reportTableHeaderCellSx}>Recipient</TableCell>
                <TableCell sx={reportTableHeaderCellSx}>Message</TableCell>
                <TableCell sx={reportTableHeaderCellSx}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex} sx={reportTableBodyCellSx}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ borderBottom: 0, py: 4 }}>
                    <ReportsEmptyState
                      label="No communication logs found for the selected filters."
                      minHeight={160}
                    />
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ ...reportTableBodyCellSx, whiteSpace: 'nowrap' }}>
                      {moment(item.createdAt).format('MMM D, YYYY h:mm A')}
                    </TableCell>
                    <TableCell sx={reportTableBodyCellSx}>
                      {formatNotificationType(item.notificationType)}
                    </TableCell>
                    <TableCell sx={reportTableBodyCellSx}>
                      <ChannelChip channel={item.channel} />
                    </TableCell>
                    <TableCell sx={reportTableBodyCellSx}>{item.recipientAddress}</TableCell>
                    <TableCell
                      sx={{
                        ...reportTableBodyCellSx,
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Tooltip title={item.message} placement="top-start">
                        <span>{item.message}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={reportTableBodyCellSx}>
                      <StatusChip
                        isSent={item.isSent}
                        isFailed={item.isFailed}
                        failureReason={item.failureReason}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            mt: 'auto',
            flex: '0 0 auto',
          }}
        >
          <RoundedPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ReportsCommunications;
