import { FunctionComponent, JSX, useEffect, useMemo, useRef } from 'react';

import styles from './styles.module.scss';

interface HighlightTextProps {
  text?: string;
  query?: string;
  className?: string;
}

type SegmentType = 'plain' | 'match' | 'exact';

type HighlightSegment = {
  text: string;
  type: SegmentType;
};

const navigatedKeys = new Set<string>();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSegments = (text: string, query: string): HighlightSegment[] => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const highlightMask: SegmentType[] = Array.from({ length: text.length }, () => 'plain');
  const exactRanges: Array<{ start: number; end: number }> = [];
  const queryWords = Array.from(new Set(queryLower.split(/\s+/).filter(Boolean)));

  let exactIndex = textLower.indexOf(queryLower);

  while (exactIndex !== -1) {
    exactRanges.push({ start: exactIndex, end: exactIndex + queryLower.length });
    exactIndex = textLower.indexOf(queryLower, exactIndex + 1);
  }

  exactRanges.forEach((range) => {
    for (let index = range.start; index < range.end; index += 1) {
      highlightMask[index] = 'exact';
    }
  });

  queryWords.forEach((word) => {
    const matcher = new RegExp(escapeRegExp(word), 'ig');
    let match = matcher.exec(text);

    while (match) {
      const start = match.index;
      const end = start + match[0].length;

      for (let index = start; index < end; index += 1) {
        if (highlightMask[index] === 'plain') {
          highlightMask[index] = 'match';
        }
      }

      match = matcher.exec(text);
    }
  });

  const segments: HighlightSegment[] = [];
  let currentType: SegmentType = highlightMask[0] || 'plain';
  let currentText = '';

  for (let index = 0; index < text.length; index += 1) {
    const nextType = highlightMask[index];
    const character = text[index];

    if (nextType === currentType) {
      currentText += character;
      continue;
    }

    segments.push({ text: currentText, type: currentType });
    currentType = nextType;
    currentText = character;
  }

  if (currentText) {
    segments.push({ text: currentText, type: currentType });
  }

  return segments;
};

const HighlightText: FunctionComponent<HighlightTextProps> = (
  props: HighlightTextProps
): JSX.Element | null => {
  const { text, query, className } = props;
  const normalizedQuery = (query || '').trim();
  const firstMatchRef = useRef<HTMLSpanElement | null>(null);

  const segments = useMemo(() => {
    if (!text) {
      return [];
    }

    if (!normalizedQuery) {
      return [{ text, type: 'plain' as const }];
    }

    return buildSegments(text, normalizedQuery);
  }, [text, normalizedQuery]);

  useEffect((): void => {
    if (!firstMatchRef.current || !normalizedQuery || typeof window === 'undefined') {
      return;
    }

    const navigationKey = `${window.location.pathname}|${normalizedQuery.toLowerCase()}`;

    if (navigatedKeys.has(navigationKey)) {
      return;
    }

    navigatedKeys.add(navigationKey);

    window.requestAnimationFrame(() => {
      firstMatchRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  }, [normalizedQuery, segments]);

  if (!text) {
    return null;
  }

  let hasAssignedFirstMatchRef = false;

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'plain') {
          return <span key={`plain-${index}`}>{segment.text}</span>;
        }

        const highlightClassName =
          segment.type === 'exact' ? styles.highlightExactMatch : styles.highlightMatch;
        const ref = !hasAssignedFirstMatchRef
          ? (element: HTMLSpanElement | null): void => {
              firstMatchRef.current = element;
            }
          : undefined;

        hasAssignedFirstMatchRef = true;

        return (
          <span key={`${segment.type}-${index}`} ref={ref} className={highlightClassName}>
            {segment.text}
          </span>
        );
      })}
    </span>
  );
};

export default HighlightText;
