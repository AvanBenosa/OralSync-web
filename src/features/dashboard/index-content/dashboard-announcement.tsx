import { FunctionComponent, JSX, useEffect, useState } from 'react';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import { useNavigate } from 'react-router-dom';

import styles from '../style.scss.module.scss';
import {
  DailyDevotionalModel,
  DEVOTIONAL_CACHE_KEY,
  DEVOTIONAL_HIDDEN_KEY,
  getCachedDailyDevotional,
  getCurrentDateStorageKey,
  getDailyDevotional,
} from '../api/devotional';
import { useAuthStore } from '../../../common/store/authStore';
import {
  formatSubscriptionValidityDate,
  getSubscriptionDaysRemaining,
  isPendingClinicStatus,
} from '../../../common/utils/subscription';

const fallbackDevotional: DailyDevotionalModel = {
  reference: 'Psalm 118:24',
  message: 'This is the day that Yahweh has made. We will rejoice and be glad in it.',
  source: 'Fallback verse',
};

const SUBSCRIPTION_WARNING_WINDOW_DAYS = 10;

const getSubscriptionAnnouncementTitle = (daysRemaining: number): string => {
  if (daysRemaining === 0) {
    return 'Subscription expires today';
  }

  return `Subscription expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
};

const getSubscriptionAnnouncementMessage = (
  daysRemaining: number,
  formattedValidityDate: string
): string => {
  if (daysRemaining === 0) {
    return `Your clinic subscription ends today, ${formattedValidityDate}. Please renew to avoid service interruption.`;
  }

  if (daysRemaining === 1) {
    return `Your clinic subscription will end tomorrow, ${formattedValidityDate}. Please renew to avoid service interruption.`;
  }

  return `Your clinic subscription will end in ${daysRemaining} days on ${formattedValidityDate}. Please renew before the validity date to avoid service interruption.`;
};

const DashBoardAnnouncement: FunctionComponent = (): JSX.Element | null => {
  const navigate = useNavigate();
  const clinicStatus = useAuthStore((store) => store.user?.status);
  const validityDate = useAuthStore((store) => store.user?.validityDate);
  const trialExpiry = useAuthStore((store) => store.user?.trialExpiry);
  const daysRemaining = getSubscriptionDaysRemaining(validityDate);
  const trialDaysRemaining = getSubscriptionDaysRemaining(trialExpiry);
  const isPaymentValidationPending = isPendingClinicStatus(clinicStatus);
  const hasPaidSubscription = Boolean(validityDate?.trim());
  const isTrialAnnouncementActive =
    trialDaysRemaining !== null && trialDaysRemaining >= 0 && !hasPaidSubscription;
  const isSubscriptionWarningActive =
    daysRemaining !== null &&
    daysRemaining >= 0 &&
    daysRemaining <= SUBSCRIPTION_WARNING_WINDOW_DAYS;
  const isPriorityAnnouncementActive =
    isPaymentValidationPending || isTrialAnnouncementActive || isSubscriptionWarningActive;
  const formattedValidityDate = formatSubscriptionValidityDate(validityDate);
  const formattedTrialExpiryDate = formatSubscriptionValidityDate(trialExpiry);
  const [isDismissed, setIsDismissed] = useState<boolean>(
    () => window.sessionStorage.getItem(DEVOTIONAL_HIDDEN_KEY) === 'true'
  );
  const [devotional, setDevotional] = useState<DailyDevotionalModel | null>(() =>
    getCachedDailyDevotional()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => getCachedDailyDevotional() === null);

  useEffect(() => {
    if (isPriorityAnnouncementActive) {
      return;
    }

    if (window.sessionStorage.getItem(DEVOTIONAL_HIDDEN_KEY) === 'true') {
      return;
    }

    const cachedDevotional = getCachedDailyDevotional();
    if (cachedDevotional) {
      setDevotional(cachedDevotional);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    void getDailyDevotional(abortController.signal)
      .then((response) => {
        setDevotional(response);
        window.localStorage.setItem(
          DEVOTIONAL_CACHE_KEY,
          JSON.stringify({
            dateKey: getCurrentDateStorageKey(),
            devotional: response,
          })
        );
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') {
          return;
        }

        setDevotional(fallbackDevotional);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [isPriorityAnnouncementActive]);

  if (!isPriorityAnnouncementActive && isDismissed) {
    return null;
  }

  const announcementEyebrow = isPaymentValidationPending
    ? 'Payment Validation'
    : isTrialAnnouncementActive
      ? 'Trial Only'
    : isSubscriptionWarningActive
      ? 'Subscription Reminder'
    : 'Daily Devotional';
  const announcementTitle = isPaymentValidationPending
    ? 'Manual payment is under review'
    : isTrialAnnouncementActive
      ? trialDaysRemaining === 0
        ? 'Free trial ends today'
        : `Free trial ends on ${formattedTrialExpiryDate}`
    : isSubscriptionWarningActive
      ? getSubscriptionAnnouncementTitle(daysRemaining)
    : isLoading
      ? "Loading today's verse..."
      : devotional?.reference ?? fallbackDevotional.reference;
  const announcementMessage = isPaymentValidationPending
    ? 'We received your manual payment. Your selected plan and updated validity date will be applied once the payment is marked as paid in the admin portal.'
    : isTrialAnnouncementActive
      ? `Your clinic is currently running on trial access only. Trial access ends on ${formattedTrialExpiryDate}. Subscribe before the expiry date to avoid the clinic being locked again.`
    : isSubscriptionWarningActive
      ? getSubscriptionAnnouncementMessage(daysRemaining, formattedValidityDate)
    : isLoading
      ? 'Fetching a fresh Bible verse for today.'
      : devotional?.message ?? fallbackDevotional.message;
  const announcementActionLabel = isPaymentValidationPending
    ? 'Validating Your Payment'
    : isTrialAnnouncementActive
      ? 'Pay Subscription'
      : 'Renew Subscription';

  const handleRenewSubscription = (): void => {
    navigate('/subscription');
  };

  return (
    <section className={styles.announcementBanner} aria-live="polite">
      <div className={styles.announcementAccent} aria-hidden="true" />
      <div className={styles.announcementContent}>
        <div className={styles.announcementIcon}>
          {isPaymentValidationPending ? (
            <HourglassTopRoundedIcon className={styles.announcementIconSvg} />
          ) : isTrialAnnouncementActive || isSubscriptionWarningActive ? (
            <WarningAmberRoundedIcon className={styles.announcementIconSvg} />
          ) : (
            <AutoStoriesRoundedIcon className={styles.announcementIconSvg} />
          )}
        </div>
        <div className={styles.announcementText}>
          <div className={styles.announcementEyebrow}>{announcementEyebrow}</div>
          <h2 className={styles.announcementTitle}>{announcementTitle}</h2>
          <p className={styles.announcementMessage}>{announcementMessage}</p>
          {isPriorityAnnouncementActive && (
            <button
              type="button"
              className={styles.announcementRenewButton}
              onClick={isPaymentValidationPending ? undefined : handleRenewSubscription}
              disabled={isPaymentValidationPending}
              aria-label={
                isPaymentValidationPending
                  ? 'Your manual payment is being validated'
                  : 'Pay your clinic subscription'
              }
            >
              {isPaymentValidationPending ? (
                <HourglassTopRoundedIcon fontSize="small" />
              ) : (
                <AutorenewRoundedIcon fontSize="small" />
              )}
              {announcementActionLabel}
            </button>
          )}
        </div>
      </div>
      {!isPriorityAnnouncementActive ? (
        <button
          type="button"
          className={styles.announcementCloseButton}
          onClick={(): void => {
            window.sessionStorage.setItem(DEVOTIONAL_HIDDEN_KEY, 'true');
            setIsDismissed(true);
          }}
          aria-label="Hide daily devotional announcement"
          title="Hide this announcement for today"
        >
          <CloseRoundedIcon />
        </button>
      ) : null}
    </section>
  );
};

export default DashBoardAnnouncement;
