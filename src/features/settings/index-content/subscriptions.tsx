import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { Chip, CircularProgress, Typography } from '@mui/material';
import { FunctionComponent, JSX } from 'react';
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
  const currentPlanId = normalizeSubscriptionType(state.item?.subscriptionType);
  const currentPlan =
    SUBSCRIPTION_PLANS.find((plan) => plan.id === currentPlanId) || SUBSCRIPTION_PLANS[0];
  const subscriptionStatus = getSubscriptionStatus(state.item?.validityDate);

  return (
    <div>
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
    </div>
  );
};

export default Subscriptions;
