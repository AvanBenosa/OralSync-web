import { FunctionComponent, JSX, useEffect, useState } from 'react';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import styles from '../style.scss.module.scss';
import {
  DailyDevotionalModel,
  DEVOTIONAL_CACHE_KEY,
  DEVOTIONAL_HIDDEN_KEY,
  getCachedDailyDevotional,
  getCurrentDateStorageKey,
  getDailyDevotional,
} from '../api/devotional';

const fallbackDevotional: DailyDevotionalModel = {
  reference: 'Psalm 118:24',
  message: 'This is the day that Yahweh has made. We will rejoice and be glad in it.',
  source: 'Fallback verse',
};

const DashBoardAnnouncement: FunctionComponent = (): JSX.Element | null => {
  const [isDismissed, setIsDismissed] = useState<boolean>(
    () => window.sessionStorage.getItem(DEVOTIONAL_HIDDEN_KEY) === 'true'
  );
  const [devotional, setDevotional] = useState<DailyDevotionalModel | null>(() =>
    getCachedDailyDevotional()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => getCachedDailyDevotional() === null);

  useEffect(() => {
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
  }, []);

  if (isDismissed) {
    return null;
  }

  return (
    <section className={styles.announcementBanner} aria-live="polite">
      <div className={styles.announcementAccent} aria-hidden="true" />
      <div className={styles.announcementContent}>
        <div className={styles.announcementIcon}>
          <AutoStoriesRoundedIcon className={styles.announcementIconSvg} />
        </div>
        <div className={styles.announcementText}>
          <div className={styles.announcementEyebrow}>Daily Devotional</div>
          <h2 className={styles.announcementTitle}>
            {isLoading
              ? "Loading today's verse..."
              : devotional?.reference ?? fallbackDevotional.reference}
          </h2>
          <p className={styles.announcementMessage}>
            {isLoading
              ? 'Fetching a fresh Bible verse for today.'
              : devotional?.message ?? fallbackDevotional.message}
          </p>
          {/* <div className={styles.announcementMeta}>
            Source: {isLoading ? 'Connecting...' : devotional?.source ?? fallbackDevotional.source}
          </div> */}
        </div>
      </div>
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
    </section>
  );
};

export default DashBoardAnnouncement;
