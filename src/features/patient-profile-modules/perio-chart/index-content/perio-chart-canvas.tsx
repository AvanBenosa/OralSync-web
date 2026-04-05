import {
  ComponentType,
  FunctionComponent,
  JSX,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Group as KonvaGroup,
  Layer as KonvaLayer,
  Line as KonvaLine,
  Rect as KonvaRect,
  Stage as KonvaStage,
  Text as KonvaText,
} from 'react-konva';

import {
  DentalChartKind,
  getPerioChartCondition,
  getPerioChartConditionLabel,
  getToothIdFromToothNumber,
  PatientPerioChartModel,
  perioChartConditionColors,
  PerioChartCondition,
} from '../api/types';
import { PRIMARY_TOOTH_LABEL_MAP, UNIVERSAL_TO_FDI_MAP } from '../../dental-chart/api/types';
import localStyles from '../style.scss.module.scss';

export type PerioChartEditableRowId =
  | 'furcation'
  | 'gingivalMargin'
  | 'probingDepth'
  | 'bleedingOnProbing'
  | 'plaque';

export type PerioChartEditableSurface = 'buccal' | 'lingual';

export type PerioChartEditableCell = {
  toothId: string;
  rowId: PerioChartEditableRowId;
  surface: PerioChartEditableSurface;
  siteIndex?: number;
};

type PerioChartCanvasProps = {
  items: PatientPerioChartModel[];
  chartKind: DentalChartKind;
  selectedToothId?: string;
  onSelectTooth?: (toothId: string) => void;
  onCommentClick?: (toothId: string) => void;
  onCellValueChange?: (cell: PerioChartEditableCell, value: string) => void;
  onBooleanCellToggle?: (cell: PerioChartEditableCell) => void;
  zoom?: number;
  view?: 'full' | 'upper' | 'lower';
  showLegend?: boolean;
  interactive?: boolean;
  editable?: boolean;
};

type ToothCategory = 'molar' | 'premolar' | 'canine' | 'incisor';

type ToothDescriptor = {
  toothNumber: number;
  toothId: string;
  label: string;
  item?: PatientPerioChartModel;
  condition?: PerioChartCondition;
  category: ToothCategory;
};

type ArchDescriptor = {
  id: 'upper' | 'lower';
  label: string;
  topSurfaceLabel: string;
  bottomSurfaceLabel: string;
  teeth: ToothDescriptor[];
};

type ArchTemplate = Omit<ArchDescriptor, 'teeth'>;

type CellBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ActiveEditorState = PerioChartEditableCell & {
  bounds: CellBounds;
};

type MeasurementBlockProps = {
  y: number;
  sectionY: number;
  title: string;
  teeth: ToothDescriptor[];
  toothWidth: number;
  includeFurcation: boolean;
  teethStartX: number;
  selectedToothId?: string;
  hoveredToothId?: string;
  hoveredCellKey?: string;
  activeCellKey?: string;
  surface: PerioChartEditableSurface;
  interactive: boolean;
  editable: boolean;
  onToothHover: (toothId?: string) => void;
  onCellHover: (cellKey?: string) => void;
  onSelectTooth?: (toothId: string) => void;
  onCommentClick?: (toothId: string) => void;
  onBooleanCellToggle?: (cell: PerioChartEditableCell) => void;
  onOpenEditor: (cell: PerioChartEditableCell, bounds: CellBounds) => void;
};

const ADULT_UPPER_SEQUENCE = Array.from({ length: 16 }, (_, index) => index + 1);
const ADULT_LOWER_SEQUENCE = Array.from({ length: 16 }, (_, index) => 32 - index);
const CHILD_UPPER_SEQUENCE = Array.from({ length: 10 }, (_, index) => index + 1);
const CHILD_LOWER_SEQUENCE = Array.from({ length: 10 }, (_, index) => 20 - index);

const FURCATION_OPTIONS = ['', '0', 'I', 'II', 'III', 'IV'];

const PAPER_FILL = '#f9e0e2';
const PAPER_STROKE = '#dfb3b8';
const GRID_LABEL_FILL = '#f4cfd4';
const GRID_STROKE = '#b88993';
const TEXT_PRIMARY = '#4f3340';
const TOOTH_STROKE = '#3a2d33';
const GINGIVA_LINE = '#e34e6d';
const PROBING_LINE = '#3458cc';
const SELECTED_STROKE = '#1769aa';
const HOVER_STROKE = '#5492c4';
const MIDLINE_STROKE = '#87505c';
const ADULT_TOOTH_WIDTH = 92;
const CHILD_TOOTH_WIDTH = 120;
const LABEL_WIDTH = 132;
const HORIZONTAL_PADDING = 28;
const TITLE_HEIGHT = 32;
const COMMENT_ICON_ROW_HEIGHT = 20;
const FURCATION_ROW_HEIGHT = 26;
const MEASUREMENT_ROW_HEIGHT = 26;
const BOOLEAN_ROW_HEIGHT = 22;
const TOP_TOOTH_LABEL_HEIGHT = 38;
const TOOTH_AREA_HEIGHT = 184;
const ARCH_GAP = 36;
const SECTION_PADDING = 24;
const MIN_ZOOM = 0.78;
const UPPER_ARCH_VISUAL_OFFSET = 56;
const COMMENT_ICON_SIZE = 14;
const COMMENT_ICON_ACTIVE = '#2e7d32';
const COMMENT_ICON_INACTIVE = '#9aa5b1';

const Group = KonvaGroup as unknown as ComponentType<Record<string, unknown>>;
const Layer = KonvaLayer as unknown as ComponentType<Record<string, unknown>>;
const Line = KonvaLine as unknown as ComponentType<Record<string, unknown>>;
const Rect = KonvaRect as unknown as ComponentType<Record<string, unknown>>;
const Stage = KonvaStage as unknown as ComponentType<Record<string, unknown>>;
const Text = KonvaText as unknown as ComponentType<Record<string, unknown>>;

const toRgba = (hex: string, alpha: number): string => {
  const normalizedHex = hex.replace('#', '');
  const fullHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split('')
          .map((segment) => `${segment}${segment}`)
          .join('')
      : normalizedHex;

  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const getToothWidth = (chartKind: DentalChartKind): number =>
  chartKind === 'child' ? CHILD_TOOTH_WIDTH : ADULT_TOOTH_WIDTH;

const getSequence = (chartKind: DentalChartKind): ArchDescriptor[] => {
  const upperSequence = chartKind === 'child' ? CHILD_UPPER_SEQUENCE : ADULT_UPPER_SEQUENCE;
  const lowerSequence = chartKind === 'child' ? CHILD_LOWER_SEQUENCE : ADULT_LOWER_SEQUENCE;
  const archTemplates: ArchTemplate[] = [
    {
      id: 'upper',
      label: 'Upper Arch',
      topSurfaceLabel: 'Buccal',
      bottomSurfaceLabel: 'Lingual',
    },
    {
      id: 'lower',
      label: 'Lower Arch',
      topSurfaceLabel: 'Lingual',
      bottomSurfaceLabel: 'Buccal',
    },
  ];

  return archTemplates.map(
    (arch, archIndex): ArchDescriptor => ({
      ...arch,
      teeth: (archIndex === 0 ? upperSequence : lowerSequence).map(
        (toothNumber, toothIndex, toothList) => ({
          toothNumber,
          toothId: getToothIdFromToothNumber(toothNumber, chartKind) || `tooth-${toothNumber}`,
          label:
            chartKind === 'child'
              ? PRIMARY_TOOTH_LABEL_MAP[toothNumber] || String(toothNumber)
              : UNIVERSAL_TO_FDI_MAP[toothNumber] || String(toothNumber),
          category: resolveToothCategory(toothIndex, toothList.length, chartKind),
        })
      ),
    })
  );
};

const resolveToothCategory = (
  index: number,
  total: number,
  chartKind: DentalChartKind
): ToothCategory => {
  const mirroredIndex = index < total / 2 ? index : total - index - 1;

  if (chartKind === 'child') {
    if (mirroredIndex <= 1) {
      return 'molar';
    }

    if (mirroredIndex === 2) {
      return 'canine';
    }

    return 'incisor';
  }

  if (mirroredIndex <= 2) {
    return 'molar';
  }

  if (mirroredIndex <= 4) {
    return 'premolar';
  }

  if (mirroredIndex === 5) {
    return 'canine';
  }

  return 'incisor';
};

const getToothPoints = (category: ToothCategory, width: number, height: number): number[] => {
  if (category === 'molar') {
    return [
      -width * 0.52,
      0,
      -width * 0.58,
      height * 0.1,
      -width * 0.56,
      height * 0.28,
      -width * 0.38,
      height * 0.42,
      -width * 0.26,
      height * 0.92,
      -width * 0.08,
      height * 0.64,
      0,
      height,
      width * 0.08,
      height * 0.64,
      width * 0.26,
      height * 0.92,
      width * 0.38,
      height * 0.42,
      width * 0.56,
      height * 0.28,
      width * 0.58,
      height * 0.1,
      width * 0.52,
      0,
      width * 0.22,
      -height * 0.18,
      -width * 0.22,
      -height * 0.18,
    ];
  }

  if (category === 'premolar') {
    return [
      -width * 0.42,
      0,
      -width * 0.48,
      height * 0.08,
      -width * 0.44,
      height * 0.24,
      -width * 0.24,
      height * 0.48,
      -width * 0.1,
      height * 0.94,
      0,
      height,
      width * 0.1,
      height * 0.94,
      width * 0.24,
      height * 0.48,
      width * 0.44,
      height * 0.24,
      width * 0.48,
      height * 0.08,
      width * 0.42,
      0,
      width * 0.16,
      -height * 0.14,
      -width * 0.16,
      -height * 0.14,
    ];
  }

  if (category === 'canine') {
    return [
      -width * 0.28,
      0,
      -width * 0.34,
      height * 0.1,
      -width * 0.26,
      height * 0.32,
      -width * 0.12,
      height * 0.62,
      0,
      height,
      width * 0.12,
      height * 0.62,
      width * 0.26,
      height * 0.32,
      width * 0.34,
      height * 0.1,
      width * 0.28,
      0,
      0,
      -height * 0.26,
    ];
  }

  return [
    -width * 0.28,
    0,
    -width * 0.34,
    height * 0.1,
    -width * 0.28,
    height * 0.32,
    -width * 0.12,
    height * 0.68,
    0,
    height,
    width * 0.12,
    height * 0.68,
    width * 0.28,
    height * 0.32,
    width * 0.34,
    height * 0.1,
    width * 0.28,
    0,
    width * 0.1,
    -height * 0.18,
    -width * 0.1,
    -height * 0.18,
  ];
};

const renderBooleanMark = (enabled: boolean, width: number, height: number): JSX.Element | null => {
  if (!enabled) {
    return null;
  }

  return (
    <Line
      points={[
        width * 0.18,
        height * 0.7,
        width * 0.42,
        height * 0.35,
        width * 0.82,
        height * 0.82,
      ]}
      stroke={TEXT_PRIMARY}
      strokeWidth={1.9}
      tension={0.15}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
  );
};

const getArchVisualOffset = (archId: ArchDescriptor['id']): number =>
  archId === 'upper' ? UPPER_ARCH_VISUAL_OFFSET : 0;

const getMaxColumnHeight = (visualOffset: number = 0): number =>
  TITLE_HEIGHT +
  COMMENT_ICON_ROW_HEIGHT +
  FURCATION_ROW_HEIGHT +
  MEASUREMENT_ROW_HEIGHT * 2 +
  BOOLEAN_ROW_HEIGHT * 2 +
  TOP_TOOTH_LABEL_HEIGHT +
  TOOTH_AREA_HEIGHT +
  MEASUREMENT_ROW_HEIGHT * 2 +
  BOOLEAN_ROW_HEIGHT * 2 +
  SECTION_PADDING * 2 +
  visualOffset;

const buildProfilePoints = (
  teeth: ToothDescriptor[],
  toothWidth: number,
  startX: number,
  baseY: number,
  valuesSelector: (item?: PatientPerioChartModel) => Array<number | null>,
  direction: 1 | -1
): number[] =>
  teeth.flatMap((tooth, toothIndex) => {
    const values = valuesSelector(tooth.item);

    return Array.from({ length: 3 }, (_, siteIndex) => {
      const siteValue = values[siteIndex] ?? 0;
      const x = startX + toothIndex * toothWidth + (siteIndex + 0.5) * (toothWidth / 3);
      const y = baseY + siteValue * 6 * direction;
      return [x, y];
    }).flat();
  });

const getColumnTint = (condition?: PerioChartCondition): string =>
  condition ? toRgba(perioChartConditionColors[condition].fill, 0.55) : '#fff8f9';

const getCellKey = (cell: PerioChartEditableCell): string =>
  [
    cell.toothId,
    cell.surface,
    cell.rowId,
    typeof cell.siteIndex === 'number' ? cell.siteIndex : 'all',
  ].join(':');

const isBooleanRow = (rowId: PerioChartEditableRowId): boolean =>
  rowId === 'bleedingOnProbing' || rowId === 'plaque';

const hasToothComment = (item?: PatientPerioChartModel): boolean => Boolean(item?.notes?.trim());

const renderCommentIcon = (color: string): JSX.Element => (
  <>
    <Rect
      x={0}
      y={0}
      width={COMMENT_ICON_SIZE}
      height={COMMENT_ICON_SIZE - 3}
      cornerRadius={3.5}
      fill={toRgba(color, 0.16)}
      stroke={color}
      strokeWidth={1.1}
      listening={false}
    />
    <Line
      points={[
        COMMENT_ICON_SIZE * 0.34,
        COMMENT_ICON_SIZE - 3,
        COMMENT_ICON_SIZE * 0.5,
        COMMENT_ICON_SIZE,
        COMMENT_ICON_SIZE * 0.62,
        COMMENT_ICON_SIZE - 3,
      ]}
      stroke={color}
      strokeWidth={1.1}
      lineCap="round"
      lineJoin="round"
      listening={false}
    />
    <Line
      points={[
        COMMENT_ICON_SIZE * 0.24,
        COMMENT_ICON_SIZE * 0.34,
        COMMENT_ICON_SIZE * 0.76,
        COMMENT_ICON_SIZE * 0.34,
      ]}
      stroke={color}
      strokeWidth={1.1}
      lineCap="round"
      listening={false}
    />
    <Line
      points={[
        COMMENT_ICON_SIZE * 0.24,
        COMMENT_ICON_SIZE * 0.56,
        COMMENT_ICON_SIZE * 0.62,
        COMMENT_ICON_SIZE * 0.56,
      ]}
      stroke={color}
      strokeWidth={1.1}
      lineCap="round"
      listening={false}
    />
  </>
);

const getNumericValues = (
  item: PatientPerioChartModel | undefined,
  rowId: 'gingivalMargin' | 'probingDepth',
  surface: PerioChartEditableSurface
): Array<number | null> => {
  if (rowId === 'gingivalMargin') {
    return surface === 'buccal'
      ? item?.buccalGingivalMargin || []
      : item?.lingualGingivalMargin || [];
  }

  return surface === 'buccal' ? item?.buccalProbingDepth || [] : item?.lingualProbingDepth || [];
};

const getBooleanValues = (
  item: PatientPerioChartModel | undefined,
  rowId: 'bleedingOnProbing' | 'plaque',
  surface: PerioChartEditableSurface
): boolean[] => {
  if (rowId === 'bleedingOnProbing') {
    return surface === 'buccal'
      ? item?.buccalBleedingOnProbing || []
      : item?.lingualBleedingOnProbing || [];
  }

  return surface === 'buccal' ? item?.buccalPlaque || [] : item?.lingualPlaque || [];
};

const getCellDisplayValue = (
  item: PatientPerioChartModel | undefined,
  cell: PerioChartEditableCell
): string => {
  if (cell.rowId === 'furcation') {
    return item?.furcation?.trim() || '';
  }

  if (cell.rowId === 'gingivalMargin' || cell.rowId === 'probingDepth') {
    const value = getNumericValues(item, cell.rowId, cell.surface)[cell.siteIndex ?? -1];
    return typeof value === 'number' ? String(value) : '';
  }

  const enabled = getBooleanValues(item, cell.rowId, cell.surface)[cell.siteIndex ?? -1];
  return enabled ? 'true' : 'false';
};

const getCellFill = (
  condition: PerioChartCondition | undefined,
  isSelected: boolean,
  isHoveredTooth: boolean,
  isHoveredCell: boolean,
  isActiveCell: boolean
): string => {
  if (isActiveCell) {
    return toRgba(SELECTED_STROKE, 0.24);
  }

  if (isHoveredCell) {
    return toRgba(SELECTED_STROKE, 0.16);
  }

  if (isSelected) {
    return toRgba(SELECTED_STROKE, 0.08);
  }

  if (isHoveredTooth) {
    return toRgba(HOVER_STROKE, 0.12);
  }

  return getColumnTint(condition);
};

const getCellStroke = (
  isSelected: boolean,
  isHoveredTooth: boolean,
  isHoveredCell: boolean,
  isActiveCell: boolean
): string => {
  if (isActiveCell || isHoveredCell || isSelected) {
    return SELECTED_STROKE;
  }

  if (isHoveredTooth) {
    return HOVER_STROKE;
  }

  return GRID_STROKE;
};

const setStageCursor = (event: unknown, cursor: string): void => {
  const stage = (
    event as { target?: { getStage?: () => { container?: () => HTMLDivElement } } }
  )?.target?.getStage?.();
  const container = stage?.container?.();

  if (container) {
    container.style.cursor = cursor;
  }
};

const MeasurementBlock = (props: MeasurementBlockProps): JSX.Element => {
  const {
    y,
    sectionY,
    title,
    teeth,
    toothWidth,
    includeFurcation,
    teethStartX,
    selectedToothId,
    hoveredToothId,
    hoveredCellKey,
    activeCellKey,
    surface,
    interactive,
    editable,
    onToothHover,
    onCellHover,
    onSelectTooth,
    onCommentClick,
    onBooleanCellToggle,
    onOpenEditor,
  } = props;
  const rows: Array<{ id: PerioChartEditableRowId; label: string; height: number }> = [
    ...(includeFurcation
      ? [{ id: 'furcation' as const, label: 'Furcation', height: FURCATION_ROW_HEIGHT }]
      : []),
    { id: 'gingivalMargin', label: 'Gingival Margin', height: MEASUREMENT_ROW_HEIGHT },
    { id: 'probingDepth', label: 'Probing Depth', height: MEASUREMENT_ROW_HEIGHT },
    { id: 'bleedingOnProbing', label: 'BOP', height: BOOLEAN_ROW_HEIGHT },
    { id: 'plaque', label: 'P', height: BOOLEAN_ROW_HEIGHT },
  ];

  const showCommentIcons = includeFurcation && Boolean(onCommentClick);
  let currentY = 22 + (showCommentIcons ? COMMENT_ICON_ROW_HEIGHT : 0);

  return (
    <Group y={y}>
      <Text
        x={LABEL_WIDTH + HORIZONTAL_PADDING}
        y={0}
        width={teeth.length * toothWidth}
        align="center"
        text={title}
        fontSize={12}
        fontStyle="bold"
        fill={TEXT_PRIMARY}
        letterSpacing={2}
        listening={false}
      />
      {showCommentIcons ? (
        <Group y={20}>
          {teeth.map((tooth, toothIndex) => {
            const toothX = teethStartX + toothIndex * toothWidth;
            const hasComment = hasToothComment(tooth.item);
            const iconColor = hasComment ? COMMENT_ICON_ACTIVE : COMMENT_ICON_INACTIVE;
            const iconX = toothX + toothWidth / 2 - COMMENT_ICON_SIZE / 2;

            return (
              <Group key={`${title}-${tooth.toothId}-comment-icon`}>
                <Rect
                  x={iconX - 5}
                  y={-2}
                  width={COMMENT_ICON_SIZE + 10}
                  height={COMMENT_ICON_ROW_HEIGHT}
                  fill="transparent"
                  onMouseEnter={(event: unknown) => {
                    if (!interactive) {
                      return;
                    }

                    onToothHover(tooth.toothId);
                    setStageCursor(event, 'pointer');
                  }}
                  onMouseLeave={(event: unknown) => {
                    onToothHover(undefined);
                    setStageCursor(event, 'default');
                  }}
                  onClick={() => {
                    if (!interactive) {
                      return;
                    }

                    onCommentClick?.(tooth.toothId);
                  }}
                />
                <Group
                  x={iconX}
                  y={1}
                  opacity={tooth.toothId === selectedToothId || tooth.toothId === hoveredToothId ? 1 : 0.9}
                  listening={false}
                >
                  {renderCommentIcon(iconColor)}
                </Group>
              </Group>
            );
          })}
        </Group>
      ) : null}
      {rows.map((row) => {
        const rowY = currentY;
        currentY += row.height;

        return (
          <Group key={`${title}-${row.id}`} y={rowY}>
            <Rect
              x={HORIZONTAL_PADDING}
              y={0}
              width={LABEL_WIDTH - 6}
              height={row.height}
              fill={GRID_LABEL_FILL}
              stroke={GRID_STROKE}
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
            <Text
              x={HORIZONTAL_PADDING + 8}
              y={row.height / 2 - 7}
              width={LABEL_WIDTH - 22}
              text={row.label}
              fontSize={10.8}
              fontStyle="bold"
              fill={TEXT_PRIMARY}
              listening={false}
            />

            {teeth.map((tooth, toothIndex) => {
              const toothX = teethStartX + toothIndex * toothWidth;
              const isSelected = tooth.toothId === selectedToothId;
              const isHoveredTooth = tooth.toothId === hoveredToothId;

              if (row.id === 'furcation') {
                const descriptor: PerioChartEditableCell = {
                  toothId: tooth.toothId,
                  rowId: row.id,
                  surface,
                };
                const cellKey = getCellKey(descriptor);
                const isHoveredCell = cellKey === hoveredCellKey;
                const isActiveCell = cellKey === activeCellKey;
                const bounds: CellBounds = {
                  x: toothX,
                  y: sectionY + y + rowY,
                  width: toothWidth,
                  height: row.height,
                };

                return (
                  <Group key={`${tooth.toothId}-${row.id}`}>
                    <Rect
                      x={toothX}
                      y={0}
                      width={toothWidth}
                      height={row.height}
                      fill={getCellFill(
                        tooth.condition,
                        isSelected,
                        isHoveredTooth,
                        isHoveredCell,
                        isActiveCell
                      )}
                      stroke={getCellStroke(
                        isSelected,
                        isHoveredTooth,
                        isHoveredCell,
                        isActiveCell
                      )}
                      strokeWidth={isActiveCell ? 1.7 : isHoveredCell || isSelected ? 1.45 : 1}
                      onMouseEnter={(event: unknown) => {
                        if (!interactive) {
                          return;
                        }

                        onToothHover(tooth.toothId);
                        onCellHover(cellKey);
                        setStageCursor(event, editable ? 'text' : 'pointer');
                      }}
                      onMouseLeave={(event: unknown) => {
                        onCellHover(undefined);
                        onToothHover(undefined);
                        setStageCursor(event, 'default');
                      }}
                      onClick={() => {
                        if (!interactive) {
                          return;
                        }

                        onSelectTooth?.(tooth.toothId);

                        if (editable) {
                          onOpenEditor(descriptor, bounds);
                        }
                      }}
                    />
                    <Text
                      x={toothX}
                      y={row.height / 2 - 6}
                      width={toothWidth}
                      align="center"
                      text={tooth.item?.furcation?.trim() || '--'}
                      fontSize={10.5}
                      fontStyle="bold"
                      fill={TEXT_PRIMARY}
                      listening={false}
                    />
                  </Group>
                );
              }

              const rawValues =
                row.id === 'gingivalMargin' || row.id === 'probingDepth'
                  ? getNumericValues(tooth.item, row.id, surface)
                  : getBooleanValues(tooth.item, row.id, surface);

              return (
                <Group key={`${tooth.toothId}-${row.id}`}>
                  {Array.from({ length: 3 }, (_, siteIndex) => {
                    const cellX = toothX + siteIndex * (toothWidth / 3);
                    const descriptor: PerioChartEditableCell = {
                      toothId: tooth.toothId,
                      rowId: row.id,
                      surface,
                      siteIndex,
                    };
                    const cellKey = getCellKey(descriptor);
                    const isHoveredCell = cellKey === hoveredCellKey;
                    const isActiveCell = cellKey === activeCellKey;
                    const siteValue = rawValues[siteIndex];
                    const bounds: CellBounds = {
                      x: cellX,
                      y: sectionY + y + rowY,
                      width: toothWidth / 3,
                      height: row.height,
                    };

                    return (
                      <Group key={`${tooth.toothId}-${row.id}-${siteIndex}`}>
                        <Rect
                          x={cellX}
                          y={0}
                          width={toothWidth / 3}
                          height={row.height}
                          fill={getCellFill(
                            tooth.condition,
                            isSelected,
                            isHoveredTooth,
                            isHoveredCell,
                            isActiveCell
                          )}
                          stroke={getCellStroke(
                            isSelected,
                            isHoveredTooth,
                            isHoveredCell,
                            isActiveCell
                          )}
                          strokeWidth={
                            isActiveCell ? 1.6 : isHoveredCell || isSelected ? 1.25 : 0.95
                          }
                          onMouseEnter={(event: unknown) => {
                            if (!interactive) {
                              return;
                            }

                            onToothHover(tooth.toothId);
                            onCellHover(cellKey);
                            setStageCursor(
                              event,
                              editable ? (isBooleanRow(row.id) ? 'pointer' : 'text') : 'pointer'
                            );
                          }}
                          onMouseLeave={(event: unknown) => {
                            onCellHover(undefined);
                            onToothHover(undefined);
                            setStageCursor(event, 'default');
                          }}
                          onClick={() => {
                            if (!interactive) {
                              return;
                            }

                            onSelectTooth?.(tooth.toothId);

                            if (!editable) {
                              return;
                            }

                            if (isBooleanRow(row.id)) {
                              onBooleanCellToggle?.(descriptor);
                              return;
                            }

                            onOpenEditor(descriptor, bounds);
                          }}
                        />
                        {typeof siteValue === 'boolean' ? (
                          <Group x={cellX} y={0} listening={false}>
                            {renderBooleanMark(siteValue, toothWidth / 3, row.height)}
                          </Group>
                        ) : (
                          <Text
                            x={cellX}
                            y={row.height / 2 - 6}
                            width={toothWidth / 3}
                            align="center"
                            text={typeof siteValue === 'number' ? String(siteValue) : '--'}
                            fontSize={10.2}
                            fill={TEXT_PRIMARY}
                            listening={false}
                          />
                        )}
                      </Group>
                    );
                  })}
                </Group>
              );
            })}
          </Group>
        );
      })}
    </Group>
  );
};

const PerioChartCanvas: FunctionComponent<PerioChartCanvasProps> = (
  props: PerioChartCanvasProps
): JSX.Element => {
  const {
    items,
    chartKind,
    selectedToothId,
    onSelectTooth,
    onCommentClick,
    onCellValueChange,
    onBooleanCellToggle,
    zoom = 1,
    view = 'upper',
    showLegend = true,
    interactive = true,
    editable = false,
  } = props;
  const [hoveredToothId, setHoveredToothId] = useState<string | undefined>(undefined);
  const [hoveredCellKey, setHoveredCellKey] = useState<string | undefined>(undefined);
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState | null>(null);
  const editorRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.toothNumber, item] as const)),
    [items]
  );
  const arches = useMemo(
    () =>
      getSequence(chartKind).map((arch) => ({
        ...arch,
        teeth: arch.teeth.map((tooth) => {
          const item = itemMap.get(tooth.toothNumber);
          return {
            ...tooth,
            item,
            condition: item ? getPerioChartCondition(item) : undefined,
          };
        }),
      })),
    [chartKind, itemMap]
  );
  const toothMap = useMemo(
    () =>
      new Map(arches.flatMap((arch) => arch.teeth.map((tooth) => [tooth.toothId, tooth] as const))),
    [arches]
  );

  useEffect(() => {
    if (!editable && activeEditor) {
      setActiveEditor(null);
    }
  }, [activeEditor, editable]);

  useEffect(() => {
    setActiveEditor(null);
    setHoveredToothId(undefined);
    setHoveredCellKey(undefined);
  }, [view]);

  useEffect(() => {
    if (!activeEditor) {
      return;
    }

    editorRef.current?.focus();

    if (editorRef.current instanceof HTMLInputElement) {
      editorRef.current.select();
    }
  }, [activeEditor]);

  const visibleArches = arches.filter((arch) => view === 'full' || arch.id === view);
  const archHeights = visibleArches.map((arch) => getMaxColumnHeight(getArchVisualOffset(arch.id)));
  const toothWidth = getToothWidth(chartKind);
  const chartWidth =
    LABEL_WIDTH +
    HORIZONTAL_PADDING * 2 +
    visibleArches[0].teeth.length * toothWidth +
    SECTION_PADDING * 2;
  const chartHeight =
    archHeights.reduce((totalHeight, archHeight) => totalHeight + archHeight, SECTION_PADDING) +
    (visibleArches.length - 1) * ARCH_GAP;
  const effectiveZoom = Math.max(MIN_ZOOM, zoom);
  const activeEditorKey = activeEditor ? getCellKey(activeEditor) : undefined;
  const activeEditorValue = activeEditor
    ? getCellDisplayValue(toothMap.get(activeEditor.toothId)?.item, activeEditor)
    : '';

  const handleOpenEditor = (cell: PerioChartEditableCell, bounds: CellBounds): void => {
    if (!editable) {
      return;
    }

    setActiveEditor({
      ...cell,
      bounds,
    });
  };

  const handleCommentClick = (toothId: string): void => {
    setActiveEditor(null);
    onCommentClick?.(toothId);
  };

  const handleEditorValueChange = (value: string): void => {
    if (!activeEditor) {
      return;
    }

    onCellValueChange?.(activeEditor, value);
  };

  const handleEditorKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  const hintText = editable
    ? 'Hover a column to highlight it. Click numeric cells to type values, click the comment icon for notes, or click BOP / P to toggle marks.'
    : interactive
    ? 'Click a tooth column to select or edit it.'
    : 'Perio measurements are shown in a real-chart style canvas.';

  return (
    <div className={localStyles.konvaShell}>
      {showLegend ? (
        <div className={localStyles.chartLegend}>
          {Object.values(PerioChartCondition).map((condition) => (
            <div key={condition} className={localStyles.chartLegendItem}>
              <span
                className={localStyles.chartLegendSwatch}
                style={{
                  background: perioChartConditionColors[condition].fill,
                  borderColor: perioChartConditionColors[condition].stroke,
                }}
              />
              <span className={localStyles.chartLegendLabel}>
                {getPerioChartConditionLabel(condition)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <div className={localStyles.konvaScrollArea}>
        <div className={localStyles.konvaHint}>{hintText}</div>
        <div
          className={localStyles.konvaStageWrap}
          style={{
            width: chartWidth * effectiveZoom,
            height: chartHeight * effectiveZoom,
          }}
        >
          <Stage width={chartWidth * effectiveZoom} height={chartHeight * effectiveZoom}>
            <Layer scaleX={effectiveZoom} scaleY={effectiveZoom}>
              <Rect
                x={0}
                y={0}
                width={chartWidth}
                height={chartHeight}
                fill={PAPER_FILL}
                stroke={PAPER_STROKE}
                strokeWidth={1.5}
                cornerRadius={18}
                shadowColor="#b57b87"
                shadowBlur={12}
                shadowOpacity={0.18}
                shadowOffsetX={0}
                shadowOffsetY={4}
              />
              {visibleArches.map((arch, archIndex) => {
                const archHeight = archHeights[archIndex];
                const archVisualOffset = getArchVisualOffset(arch.id);
                const sectionY =
                  SECTION_PADDING +
                  archHeights
                    .slice(0, archIndex)
                    .reduce((totalHeight, currentHeight) => totalHeight + currentHeight, 0) +
                  archIndex * ARCH_GAP;
                const teethStartX = LABEL_WIDTH + HORIZONTAL_PADDING;
                const toothLabelY =
                  sectionY +
                  TITLE_HEIGHT +
                  COMMENT_ICON_ROW_HEIGHT +
                  FURCATION_ROW_HEIGHT +
                  MEASUREMENT_ROW_HEIGHT * 2 +
                  BOOLEAN_ROW_HEIGHT * 2 +
                  10;
                const toothBaseY = toothLabelY + TOP_TOOTH_LABEL_HEIGHT + 8 + archVisualOffset;
                const topProfileBaseY = toothBaseY + 20;
                const bottomProfileBaseY = toothBaseY + TOOTH_AREA_HEIGHT - 22;
                const midlineX = teethStartX + toothWidth * (chartKind === 'child' ? 5 : 8);
                const topGingivalPoints = buildProfilePoints(
                  arch.teeth,
                  toothWidth,
                  teethStartX,
                  topProfileBaseY,
                  arch.id === 'upper'
                    ? (item) => item?.buccalGingivalMargin || []
                    : (item) => item?.lingualGingivalMargin || [],
                  1
                );
                const topProbingPoints = buildProfilePoints(
                  arch.teeth,
                  toothWidth,
                  teethStartX,
                  topProfileBaseY,
                  arch.id === 'upper'
                    ? (item) =>
                        (item?.buccalGingivalMargin || []).map((value, index) => {
                          const gm = value ?? 0;
                          const pd = item?.buccalProbingDepth?.[index] ?? 0;
                          return gm + pd;
                        })
                    : (item) =>
                        (item?.lingualGingivalMargin || []).map((value, index) => {
                          const gm = value ?? 0;
                          const pd = item?.lingualProbingDepth?.[index] ?? 0;
                          return gm + pd;
                        }),
                  1
                );
                const bottomGingivalPoints = buildProfilePoints(
                  arch.teeth,
                  toothWidth,
                  teethStartX,
                  bottomProfileBaseY,
                  arch.id === 'upper'
                    ? (item) => item?.lingualGingivalMargin || []
                    : (item) => item?.buccalGingivalMargin || [],
                  -1
                );
                const bottomProbingPoints = buildProfilePoints(
                  arch.teeth,
                  toothWidth,
                  teethStartX,
                  bottomProfileBaseY,
                  arch.id === 'upper'
                    ? (item) =>
                        (item?.lingualGingivalMargin || []).map((value, index) => {
                          const gm = value ?? 0;
                          const pd = item?.lingualProbingDepth?.[index] ?? 0;
                          return gm + pd;
                        })
                    : (item) =>
                        (item?.buccalGingivalMargin || []).map((value, index) => {
                          const gm = value ?? 0;
                          const pd = item?.buccalProbingDepth?.[index] ?? 0;
                          return gm + pd;
                        }),
                  -1
                );

                return (
                  <Group key={arch.id} y={sectionY}>
                    <Text
                      x={LABEL_WIDTH + HORIZONTAL_PADDING}
                      y={0}
                      width={arch.teeth.length * toothWidth}
                      align="center"
                      text={`${arch.label}  |  ${arch.topSurfaceLabel} / ${arch.bottomSurfaceLabel}`}
                      fontSize={15}
                      fontStyle="bold"
                      fill={TEXT_PRIMARY}
                      letterSpacing={0.4}
                      listening={false}
                    />
                    <Line
                      points={[
                        midlineX,
                        TITLE_HEIGHT + 6,
                        midlineX,
                        archHeight - SECTION_PADDING - 12,
                      ]}
                      stroke={MIDLINE_STROKE}
                      strokeWidth={2.3}
                      dash={[6, 5]}
                      opacity={0.55}
                      listening={false}
                    />

                    <MeasurementBlock
                      y={TITLE_HEIGHT + 4}
                      sectionY={sectionY}
                      title={arch.topSurfaceLabel.toUpperCase()}
                      teeth={arch.teeth}
                      toothWidth={toothWidth}
                      includeFurcation
                      teethStartX={teethStartX}
                      selectedToothId={selectedToothId}
                      hoveredToothId={hoveredToothId}
                      hoveredCellKey={hoveredCellKey}
                      activeCellKey={activeEditorKey}
                      surface={arch.id === 'upper' ? 'buccal' : 'lingual'}
                      interactive={interactive}
                      editable={editable}
                      onToothHover={setHoveredToothId}
                      onCellHover={setHoveredCellKey}
                      onSelectTooth={onSelectTooth}
                      onCommentClick={handleCommentClick}
                      onBooleanCellToggle={onBooleanCellToggle}
                      onOpenEditor={handleOpenEditor}
                    />

                    <Group y={toothLabelY}>
                      {arch.teeth.map((tooth, toothIndex) => {
                        const toothX = teethStartX + toothIndex * toothWidth;
                        const isSelected = tooth.toothId === selectedToothId;
                        const isHovered = tooth.toothId === hoveredToothId;

                        return (
                          <Group key={`${arch.id}-${tooth.toothId}`}>
                            <Rect
                              x={toothX + 4}
                              y={0}
                              width={toothWidth - 8}
                              height={TOP_TOOTH_LABEL_HEIGHT + TOOTH_AREA_HEIGHT + 6}
                              fill={
                                isSelected
                                  ? toRgba(SELECTED_STROKE, 0.1)
                                  : isHovered
                                  ? toRgba(HOVER_STROKE, 0.08)
                                  : 'transparent'
                              }
                              stroke={
                                isSelected
                                  ? SELECTED_STROKE
                                  : isHovered
                                  ? HOVER_STROKE
                                  : toRgba('#8b6370', 0.3)
                              }
                              strokeWidth={isSelected ? 2.1 : isHovered ? 1.4 : 0.8}
                              cornerRadius={16}
                              listening={false}
                            />
                            <Text
                              x={toothX}
                              y={4}
                              width={toothWidth}
                              align="center"
                              text={tooth.label}
                              fontSize={15}
                              fontStyle="bold"
                              fill={TEXT_PRIMARY}
                              listening={false}
                            />
                            <Text
                              x={toothX}
                              y={20}
                              width={toothWidth}
                              align="center"
                              text={`M ${tooth.item?.mobility?.trim() || '--'}  |  F ${
                                tooth.item?.furcation?.trim() || '--'
                              }`}
                              fontSize={9}
                              fill="#7c5b67"
                              listening={false}
                            />
                            <Group
                              x={toothX + toothWidth / 2}
                              y={TOOTH_AREA_HEIGHT + 10 + archVisualOffset}
                              offsetY={arch.id === 'lower' ? 0 : TOOTH_AREA_HEIGHT}
                              scaleY={arch.id === 'lower' ? -1 : 1}
                              listening={false}
                            >
                              <Line
                                points={getToothPoints(
                                  tooth.category,
                                  toothWidth * 0.55,
                                  TOOTH_AREA_HEIGHT * 0.82
                                )}
                                closed
                                fill={
                                  isSelected
                                    ? toRgba(SELECTED_STROKE, 0.18)
                                    : isHovered
                                    ? toRgba(HOVER_STROKE, 0.12)
                                    : getColumnTint(tooth.condition)
                                }
                                stroke={isSelected ? SELECTED_STROKE : TOOTH_STROKE}
                                strokeWidth={isSelected ? 2.6 : 1.5}
                                tension={0.36}
                                lineJoin="round"
                                shadowColor={isSelected ? SELECTED_STROKE : '#c59aa4'}
                                shadowOpacity={isSelected ? 0.22 : 0.1}
                                shadowBlur={isSelected ? 8 : 4}
                                listening={false}
                              />
                              {tooth.category === 'molar' ? (
                                <>
                                  <Line
                                    points={[
                                      -toothWidth * 0.08,
                                      TOOTH_AREA_HEIGHT * 0.18,
                                      -toothWidth * 0.14,
                                      TOOTH_AREA_HEIGHT * 0.7,
                                    ]}
                                    stroke={isSelected ? SELECTED_STROKE : TOOTH_STROKE}
                                    strokeWidth={1.1}
                                    lineCap="round"
                                    listening={false}
                                  />
                                  <Line
                                    points={[
                                      toothWidth * 0.08,
                                      TOOTH_AREA_HEIGHT * 0.18,
                                      toothWidth * 0.14,
                                      TOOTH_AREA_HEIGHT * 0.7,
                                    ]}
                                    stroke={isSelected ? SELECTED_STROKE : TOOTH_STROKE}
                                    strokeWidth={1.1}
                                    lineCap="round"
                                    listening={false}
                                  />
                                </>
                              ) : tooth.category === 'premolar' ? (
                                <Line
                                  points={[
                                    0,
                                    TOOTH_AREA_HEIGHT * 0.12,
                                    0,
                                    TOOTH_AREA_HEIGHT * 0.72,
                                  ]}
                                  stroke={isSelected ? SELECTED_STROKE : TOOTH_STROKE}
                                  strokeWidth={1.05}
                                  lineCap="round"
                                  listening={false}
                                />
                              ) : null}
                            </Group>
                            <Rect
                              x={toothX}
                              y={0}
                              width={toothWidth}
                              height={TOP_TOOTH_LABEL_HEIGHT + TOOTH_AREA_HEIGHT + 6}
                              fill="transparent"
                              onMouseEnter={(event: unknown) => {
                                if (!interactive) {
                                  return;
                                }

                                setHoveredToothId(tooth.toothId);
                                setStageCursor(event, 'pointer');
                              }}
                              onMouseLeave={(event: unknown) => {
                                setHoveredToothId(undefined);
                                setStageCursor(event, 'default');
                              }}
                              onClick={() => {
                                if (interactive && tooth.toothId) {
                                  setActiveEditor(null);
                                  onSelectTooth?.(tooth.toothId);
                                }
                              }}
                            />
                          </Group>
                        );
                      })}
                    </Group>

                    <Line
                      points={topGingivalPoints}
                      stroke={GINGIVA_LINE}
                      strokeWidth={2}
                      lineJoin="round"
                      lineCap="round"
                      tension={0.18}
                      listening={false}
                    />
                    <Line
                      points={topProbingPoints}
                      stroke={PROBING_LINE}
                      strokeWidth={2}
                      lineJoin="round"
                      lineCap="round"
                      tension={0.18}
                      listening={false}
                    />
                    <Line
                      points={bottomGingivalPoints}
                      stroke={GINGIVA_LINE}
                      strokeWidth={2}
                      lineJoin="round"
                      lineCap="round"
                      tension={0.18}
                      listening={false}
                    />
                    <Line
                      points={bottomProbingPoints}
                      stroke={PROBING_LINE}
                      strokeWidth={2}
                      lineJoin="round"
                      lineCap="round"
                      tension={0.18}
                      listening={false}
                    />

                    <MeasurementBlock
                      y={
                        TITLE_HEIGHT +
                        COMMENT_ICON_ROW_HEIGHT +
                        FURCATION_ROW_HEIGHT +
                        MEASUREMENT_ROW_HEIGHT * 2 +
                        BOOLEAN_ROW_HEIGHT * 2 +
                        TOP_TOOTH_LABEL_HEIGHT +
                        TOOTH_AREA_HEIGHT +
                        18 +
                        archVisualOffset
                      }
                      sectionY={sectionY}
                      title={arch.bottomSurfaceLabel.toUpperCase()}
                      teeth={arch.teeth}
                      toothWidth={toothWidth}
                      includeFurcation={false}
                      teethStartX={teethStartX}
                      selectedToothId={selectedToothId}
                      hoveredToothId={hoveredToothId}
                      hoveredCellKey={hoveredCellKey}
                      activeCellKey={activeEditorKey}
                      surface={arch.id === 'upper' ? 'lingual' : 'buccal'}
                      interactive={interactive}
                      editable={editable}
                      onToothHover={setHoveredToothId}
                      onCellHover={setHoveredCellKey}
                      onSelectTooth={onSelectTooth}
                      onBooleanCellToggle={onBooleanCellToggle}
                      onOpenEditor={handleOpenEditor}
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>

          {editable && activeEditor ? (
            <div
              className={localStyles.konvaEditorOverlay}
              style={{
                left: activeEditor.bounds.x * effectiveZoom,
                top: activeEditor.bounds.y * effectiveZoom,
                width: activeEditor.bounds.width * effectiveZoom,
                height: activeEditor.bounds.height * effectiveZoom,
              }}
            >
              {activeEditor.rowId === 'furcation' ? (
                <select
                  ref={(element) => {
                    editorRef.current = element;
                  }}
                  className={localStyles.konvaEditorInput}
                  value={activeEditorValue}
                  onChange={(event) => handleEditorValueChange(event.target.value)}
                  onBlur={() => setActiveEditor(null)}
                  onKeyDown={handleEditorKeyDown}
                >
                  {FURCATION_OPTIONS.map((option) => (
                    <option key={`furcation-editor-${option || 'empty'}`} value={option}>
                      {option || '--'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  ref={(element) => {
                    editorRef.current = element;
                  }}
                  className={localStyles.konvaEditorInput}
                  type="number"
                  step={1}
                  value={activeEditorValue}
                  onChange={(event) => handleEditorValueChange(event.target.value)}
                  onBlur={() => setActiveEditor(null)}
                  onKeyDown={handleEditorKeyDown}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PerioChartCanvas;
