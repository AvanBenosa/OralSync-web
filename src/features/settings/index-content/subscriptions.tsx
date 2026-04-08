import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { FunctionComponent, JSX, useState } from 'react';
import { getManualPaymentTransactions } from '../../subscription/api/api';
import { formatCurrency, type PaymentTransactionModel } from '../../subscription/api/types';
import {
  loadProtectedAssetObjectUrl,
  resolveProtectedApiAssetUrl,
} from '../../../common/services/api-client';
import { ClinicProfileStateModel } from '../clinic-profile/api/types';
import styles from '../style.scss.module.scss';

type SubscriptionsProps = {
  state: ClinicProfileStateModel;
};

type SubscriptionPlanId = 'basic' | 'standard' | 'pro';

type SubscriptionFeature = {
  icon: JSX.Element;
  label: string;
};

type SubscriptionPlan = {
  id: SubscriptionPlanId;
  label: string;
  tagline: string;
  summary: string;
  price: number;           // monthly base price in PHP
  patientLimit: string;
  storageLimit: string;
  userLimit: string;
  features: SubscriptionFeature[];
  accentClassName: string;
};

const formatCount = (value?: number): string => {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.trunc(value ?? 0)) : 0;
  return normalizedValue.toLocaleString('en-US');
};

const normalizeSubscriptionType = (value?: string): SubscriptionPlanId | '' => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue === 'basic') {
    return 'basic';
  }

  if (normalizedValue === 'standard') {
    return 'standard';
  }

  if (normalizedValue === 'pro' || normalizedValue === 'premium' || normalizedValue === 'premuim') {
    return 'pro';
  }

  return '';
};

const formatSubscriptionType = (value?: string): string => {
  const normalizedValue = normalizeSubscriptionType(value);

  if (normalizedValue === 'basic') {
    return 'Basic';
  }

  if (normalizedValue === 'standard') {
    return 'Standard';
  }

  if (normalizedValue === 'pro') {
    return 'Pro';
  }

  return '--';
};

const formatValidityDate = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return '--';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (value?: string | null): string => {
  if (!value?.trim()) {
    return '--';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return '--';
  }

  return parsedDate.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatManualPaymentStatus = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  if (value.toLowerCase() === 'failed') {
    return 'Rejected';
  }

  return value;
};

const getSubscriptionStatus = (
  value?: string
): {
  label: string;
  color: 'default' | 'success' | 'warning' | 'error';
} => {
  if (!value?.trim()) {
    return {
      label: 'Date not set',
      color: 'default',
    };
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return {
      label: 'Date not set',
      color: 'default',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);

  if (parsedDate.getTime() < today.getTime()) {
    return {
      label: 'Expired',
      color: 'error',
    };
  }

  if (parsedDate.getTime() === today.getTime()) {
    return {
      label: 'Expires today',
      color: 'warning',
    };
  }

  return {
    label: 'Active',
    color: 'success',
  };
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    label: 'Basic',
    tagline: 'Starter clinic plan',
    summary: 'Best for solo or startup clinics handling a lighter daily patient load.',
    price: 450,
    patientLimit: '500 patients',
    storageLimit: '500 photos/files',
    userLimit: '2 users',
    accentClassName: styles.subscriptionPlanCardBasic,
    features: [
      {
        icon: <GroupsRoundedIcon />,
        label: 'Patient records up to 1,000',
      },
      {
        icon: <PhotoLibraryRoundedIcon />,
        label: 'Store up to 500 patient photos/files',
      },
      {
        icon: <SmsRoundedIcon />,
        label: 'No SMS reminders included',
      },
      {
        icon: <MarkEmailReadRoundedIcon />,
        label: 'No email notifications included',
      },
      {
        icon: <Inventory2RoundedIcon />,
        label: 'Inventory module not included',
      },
    ],
  },
  {
    id: 'standard',
    label: 'Standard',
    tagline: 'Balanced everyday plan',
    summary: 'Built for growing clinics that want reminders, inventory, and larger storage.',
    price: 800,
    patientLimit: '1000 patients',
    storageLimit: '1000 photos/files',
    userLimit: '5 users',
    accentClassName: styles.subscriptionPlanCardStandard,
    features: [
      {
        icon: <GroupsRoundedIcon />,
        label: 'Patient records up to 1,000',
      },
      {
        icon: <PhotoLibraryRoundedIcon />,
        label: 'Store up to 1,000 patient photos/files',
      },
      {
        icon: <SmsRoundedIcon />,
        label: 'SMS reminders with monthly usage limits',
      },
      {
        icon: <MarkEmailReadRoundedIcon />,
        label: 'Email notifications included',
      },
      {
        icon: <Inventory2RoundedIcon />,
        label: 'Inventory module included',
      },
    ],
  },
  // {
  //   id: 'pro',
  //   label: 'Pro',
  //   tagline: 'Advanced clinic operations',
  //   summary: 'Designed for busy clinics that need automation, scale, and wider staff access.',
  //   patientLimit: '20,000 patients',
  //   storageLimit: '10,000 photos/files',
  //   userLimit: 'Unlimited users',
  //   accentClassName: styles.subscriptionPlanCardPro,
  //   features: [
  //     {
  //       icon: <GroupsRoundedIcon />,
  //       label: 'Patient records up to 20,000',
  //     },
  //     {
  //       icon: <PhotoLibraryRoundedIcon />,
  //       label: 'Store up to 10,000 patient photos/files',
  //     },
  //     {
  //       icon: <SmsRoundedIcon />,
  //       label: 'Full SMS reminders and higher usage capacity',
  //     },
  //     {
  //       icon: <MarkEmailReadRoundedIcon />,
  //       label: 'Full email notification support',
  //     },
  //     {
  //       icon: <Inventory2RoundedIcon />,
  //       label: 'Inventory module and advanced workflow support',
  //     },
  //   ],
  // },
];

const Subscriptions: FunctionComponent<SubscriptionsProps> = (
  props: SubscriptionsProps
): JSX.Element => {
  const { state } = props;
  const [isManualHistoryOpen, setIsManualHistoryOpen] = useState(false);
  const [manualPaymentItems, setManualPaymentItems] = useState<PaymentTransactionModel[]>([]);
  const [manualPaymentsLoad, setManualPaymentsLoad] = useState(false);
  const [manualPaymentsError, setManualPaymentsError] = useState('');
  const currentPlanId = normalizeSubscriptionType(state.item?.subscriptionType);
  const currentPlan =
    SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlanId) || SUBSCRIPTION_PLANS[0];
  const subscriptionStatus = getSubscriptionStatus(state.item?.validityDate);

  const loadManualPaymentItems = async (): Promise<void> => {
    setManualPaymentsLoad(true);
    setManualPaymentsError('');

    try {
      const items = await getManualPaymentTransactions();
      setManualPaymentItems(items);
    } catch (error: any) {
      setManualPaymentsError(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to load manual payment history.'
      );
    } finally {
      setManualPaymentsLoad(false);
    }
  };

  const handleOpenManualHistory = async (): Promise<void> => {
    setIsManualHistoryOpen(true);
    await loadManualPaymentItems();
  };

  const handleOpenProof = async (proofImageUrl?: string): Promise<void> => {
    if (!proofImageUrl?.trim()) {
      return;
    }

    try {
      const isProtectedStorage = proofImageUrl.startsWith('/storage/');
      const url = isProtectedStorage
        ? await loadProtectedAssetObjectUrl(proofImageUrl)
        : resolveProtectedApiAssetUrl(proofImageUrl);

      if (!url) {
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setManualPaymentsError('Unable to open the uploaded proof of payment.');
    }
  };

  return (
    <div>
      <div className={styles.subscriptionHeaderRow}>
        <div className={styles.tabPanelHeader}>
          <div className={styles.tabPanelIcon}>
            <WorkspacePremiumRoundedIcon />
          </div>
          <div className={styles.tabPanelText}>
            <h2 className={styles.tabPanelTitle}>Clinic Subscription</h2>
            <p className={styles.tabPanelDescription}>
              Review the active plan, compare subscription tiers, and see what your clinic workspace
              currently includes.
            </p>
          </div>
        </div>
        <Button
          variant="contained"
          startIcon={<HistoryRoundedIcon />}
          className={styles.moduleActionButton}
          onClick={() => void handleOpenManualHistory()}
        >
          Manual Payment History
        </Button>
      </div>

      {state.load && !state.item ? (
        <div className={styles.subscriptionLoadingState}>
          <CircularProgress size={28} />
        </div>
      ) : (
        <div className={styles.subscriptionSurface}>
          <section className={styles.subscriptionHeroCard}>
            <div className={styles.subscriptionHeroContent}>
              <Typography className={styles.subscriptionHeroEyebrow}>
                Current Subscription
              </Typography>
              <Typography className={styles.subscriptionHeroTitle}>
                {formatSubscriptionType(state.item?.subscriptionType)}
              </Typography>
              <Typography className={styles.subscriptionHeroText}>
                {currentPlan.summary} Clinic: {state.item?.clinicName?.trim() || '--'}.
              </Typography>
              <div className={styles.subscriptionHeroChips}>
                <Chip
                  label={subscriptionStatus.label}
                  color={subscriptionStatus.color}
                  variant={subscriptionStatus.color === 'default' ? 'outlined' : 'filled'}
                  size="small"
                />
                <Chip
                  label={`Valid until ${formatValidityDate(state.item?.validityDate)}`}
                  variant="outlined"
                  size="small"
                />
              </div>
            </div>

            <div className={styles.subscriptionHeroMetrics}>
              <div className={styles.subscriptionHeroMetric}>
                <span className={styles.subscriptionHeroMetricLabel}>Patients</span>
                <strong className={styles.subscriptionHeroMetricValue}>
                  {formatCount(state.item?.patientCount)}
                </strong>
                <span className={styles.subscriptionHeroMetricMeta}>
                  Current patients of {currentPlan.patientLimit}
                </span>
              </div>
              <div className={styles.subscriptionHeroMetric}>
                <span className={styles.subscriptionHeroMetricLabel}>Storage</span>
                <strong className={styles.subscriptionHeroMetricValue}>
                  {formatCount(state.item?.uploadedFileCount)}
                </strong>
                <span className={styles.subscriptionHeroMetricMeta}>
                  Current uploaded photos/files of {currentPlan.storageLimit}
                </span>
              </div>
              <div className={styles.subscriptionHeroMetric}>
                <span className={styles.subscriptionHeroMetricLabel}>Team Access</span>
                <strong className={styles.subscriptionHeroMetricValue}>
                  {formatCount(state.item?.userCount)}
                </strong>
                <span className={styles.subscriptionHeroMetricMeta}>
                  Current users of {currentPlan.userLimit}
                </span>
              </div>
            </div>
          </section>

          <div className={styles.subscriptionPlansGrid}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isActive = plan.id === currentPlanId;

              return (
                <article
                  key={plan.id}
                  className={`${styles.subscriptionPlanCard} ${plan.accentClassName} ${
                    isActive ? styles.subscriptionPlanCardActive : ''
                  }`}
                >
                  <div className={styles.subscriptionPlanHeader}>
                    <div>
                      <Typography className={styles.subscriptionPlanTagline}>
                        {plan.tagline}
                      </Typography>
                      <Typography className={styles.subscriptionPlanTitle}>{plan.label}</Typography>
                    </div>
                    {isActive ? <Chip label="Current plan" color="primary" size="small" /> : null}
                  </div>

                  <Typography className={styles.subscriptionPlanSummary}>{plan.summary}</Typography>

                  {/* Price */}
                  <div className={styles.subscriptionPlanPrice}>
                    <span className={styles.subscriptionPlanPriceAmount}>
                      ₱{plan.price.toLocaleString('en-PH')}
                    </span>
                    <span className={styles.subscriptionPlanPricePer}>&nbsp;/ month</span>
                  </div>

                  <div className={styles.subscriptionPlanMetrics}>
                    <div className={styles.subscriptionPlanMetric}>
                      <span className={styles.subscriptionPlanMetricLabel}>Patients</span>
                      <strong className={styles.subscriptionPlanMetricValue}>
                        {plan.patientLimit}
                      </strong>
                    </div>
                    <div className={styles.subscriptionPlanMetric}>
                      <span className={styles.subscriptionPlanMetricLabel}>Photos</span>
                      <strong className={styles.subscriptionPlanMetricValue}>
                        {plan.storageLimit}
                      </strong>
                    </div>
                    <div className={styles.subscriptionPlanMetric}>
                      <span className={styles.subscriptionPlanMetricLabel}>Users</span>
                      <strong className={styles.subscriptionPlanMetricValue}>
                        {plan.userLimit}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.subscriptionFeatureList}>
                    {plan.features.map((feature) => (
                      <div
                        key={`${plan.id}-${feature.label}`}
                        className={styles.subscriptionFeatureItem}
                      >
                        <span className={styles.subscriptionFeatureIcon}>{feature.icon}</span>
                        <span className={styles.subscriptionFeatureText}>{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <section className={styles.subscriptionInfoBanner}>
            <div className={styles.subscriptionInfoBannerIcon}>
              <CalendarMonthRoundedIcon />
            </div>
            <div>
              <Typography className={styles.subscriptionInfoBannerTitle}>
                Validity and plan changes
              </Typography>
              <Typography className={styles.subscriptionInfoBannerText}>
                Subscription renewals, upgrades, and access changes are managed from the admin
                portal. This tab is for plan visibility and clinic-side review.
              </Typography>
            </div>
          </section>
        </div>
      )}

      <Dialog
        open={isManualHistoryOpen}
        onClose={() => setIsManualHistoryOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Clinic Manual Payment History</DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          {manualPaymentsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {manualPaymentsError}
            </Alert>
          ) : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              Review submitted manual payment proofs and their verification status.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => void loadManualPaymentItems()}
              disabled={manualPaymentsLoad}
            >
              {manualPaymentsLoad ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '18px' }}>
            <Table stickyHeader aria-label="Clinic manual payment history table">
              <TableHead>
                <TableRow>
                  <TableCell>Submitted At</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Proof</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manualPaymentsLoad ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : manualPaymentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={0.75}>
                        No manual payment records yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submitted manual payment transactions will appear here.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  manualPaymentItems.map((item, index) => (
                    <TableRow hover key={item.id || `manual-payment-history-${index}`}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                          {formatDateTime(item.submittedAt ?? item.createdAt ?? null)}
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                          Ref: {item.referenceNumber || '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                          {item.subscriptionType || '--'}
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                          {item.subscriptionMonths ? `${item.subscriptionMonths} month(s)` : '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(item.amount || 0))}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                          {item.paymentMethod || '--'}
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                          {item.senderName || '--'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                          {formatManualPaymentStatus(item.status)}
                        </Typography>
                        <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                          {item.verifiedAt
                            ? `Verified ${formatDateTime(item.verifiedAt)}`
                            : item.rejectionReason || '--'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<OpenInNewRoundedIcon />}
                          onClick={() => void handleOpenProof(item.proofImageUrl)}
                          disabled={!item.proofImageUrl}
                        >
                          View Proof
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsManualHistoryOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
