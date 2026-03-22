import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { Chip, CircularProgress, Typography } from '@mui/material';
import { FunctionComponent, JSX } from 'react';
import { ClinicProfileStateModel } from '../clinic-profile/api/types';
import styles from '../style.scss.module.scss';

type SubscriptionsProps = {
  state: ClinicProfileStateModel;
};

const formatSubscriptionType = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  return value
    .replace(/^Premuim$/i, 'Premium')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
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

const Subscriptions: FunctionComponent<SubscriptionsProps> = (
  props: SubscriptionsProps
): JSX.Element => {
  const { state } = props;
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
            Review your current subscription plan and validity period from this settings section.
          </p>
        </div>
      </div>

      {state.load && !state.item ? (
        <div className={styles.subscriptionLoadingState}>
          <CircularProgress size={28} />
        </div>
      ) : (
        <div className={styles.dualPanelGrid}>
          <section className={styles.formPanel}>
            <div className={styles.formPanelHeader}>
              <div className={styles.formPanelIcon}>
                <WorkspacePremiumRoundedIcon />
              </div>
              <div>
                <h3 className={styles.formPanelTitle}>Subscription Plan</h3>
                <p className={styles.formPanelDescription}>
                  This plan is currently assigned to your clinic workspace.
                </p>
              </div>
            </div>

            <div className={styles.subscriptionMetricCard}>
              <Typography className={styles.subscriptionMetricLabel}>Plan Type</Typography>
              <Typography className={styles.subscriptionMetricValue}>
                {formatSubscriptionType(state.item?.subscriptionType)}
              </Typography>
              <Typography className={styles.subscriptionMetricMeta}>
                Clinic: {state.item?.clinicName?.trim() || '--'}
              </Typography>
            </div>
          </section>

          <section className={styles.formPanel}>
            <div className={styles.formPanelHeader}>
              <div className={styles.formPanelIcon}>
                <CalendarMonthRoundedIcon />
              </div>
              <div>
                <h3 className={styles.formPanelTitle}>Validity And Access</h3>
                <p className={styles.formPanelDescription}>
                  Track the active date coverage of your current subscription.
                </p>
              </div>
            </div>

            <div className={styles.subscriptionInfoList}>
              <div className={styles.subscriptionMetricCard}>
                <Typography className={styles.subscriptionMetricLabel}>Validity Date</Typography>
                <Typography className={styles.subscriptionMetricValue}>
                  {formatValidityDate(state.item?.validityDate)}
                </Typography>
                <Typography className={styles.subscriptionMetricMeta}>
                  Renewal and subscription changes are managed by the admin portal.
                </Typography>
              </div>

              <div className={styles.subscriptionStatusRow}>
                <div className={styles.subscriptionStatusMeta}>
                  <LockClockRoundedIcon />
                  <div>
                    <Typography className={styles.subscriptionMetricLabel}>
                      Subscription Status
                    </Typography>
                    <Typography className={styles.subscriptionMetricMeta}>
                      Access remains based on the current validity date assigned to the clinic.
                    </Typography>
                  </div>
                </div>
                <Chip
                  label={subscriptionStatus.label}
                  color={subscriptionStatus.color}
                  variant={subscriptionStatus.color === 'default' ? 'outlined' : 'filled'}
                  size="small"
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
