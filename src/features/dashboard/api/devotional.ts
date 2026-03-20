export type DailyDevotionalModel = {
  reference: string;
  message: string;
  source: string;
};

export const DEVOTIONAL_CACHE_KEY = 'dashboard-daily-devotional-cache';
export const DEVOTIONAL_HIDDEN_KEY = 'dashboard-daily-devotional-hidden-session';

type BibleApiRandomVerseResponse = {
  random_verse?: {
    book?: string;
    chapter?: number;
    verse?: number;
    text?: string;
  };
};

const DEVOTIONAL_API_URL = 'https://bible-api.com/data/web/random/PSA,JHN,PHP,ISA';

export const getCurrentDateStorageKey = (): string => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = `${currentDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${currentDate.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getCachedDailyDevotional = (): DailyDevotionalModel | null => {
  const cachedValue = window.localStorage.getItem(DEVOTIONAL_CACHE_KEY);

  if (!cachedValue) {
    return null;
  }

  try {
    const parsedCache = JSON.parse(cachedValue) as {
      dateKey?: string;
      devotional?: DailyDevotionalModel;
    };

    if (parsedCache.dateKey === getCurrentDateStorageKey() && parsedCache.devotional) {
      return parsedCache.devotional;
    }
  } catch {
    window.localStorage.removeItem(DEVOTIONAL_CACHE_KEY);
  }

  return null;
};

export const getDailyDevotional = async (
  signal?: AbortSignal
): Promise<DailyDevotionalModel> => {
  const response = await fetch(DEVOTIONAL_API_URL, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    throw new Error('Unable to load devotional verse.');
  }

  const data = (await response.json()) as BibleApiRandomVerseResponse;
  const randomVerse = data.random_verse;

  if (!randomVerse?.book || !randomVerse.chapter || !randomVerse.verse || !randomVerse.text) {
    throw new Error('Invalid devotional verse response.');
  }

  return {
    reference: `${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}`,
    message: randomVerse.text.replace(/\s+/g, ' ').trim(),
    source: 'bible-api.com',
  };
};
