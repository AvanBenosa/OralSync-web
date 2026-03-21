import { FunctionComponent, JSX, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { Odontogram, ToothConditionGroup, ToothDetail } from 'react-odontogram';

import sharedStyles from '../../styles.module.scss';
import localStyles from '../style.scss.module.scss';
import {
  DentalChartCondition,
  PatientDentalChartModel,
  PatientDentalChartStateProps,
  getDentalChartConditionLabel,
  getToothDisplayLabel,
  getToothIdFromToothNumber,
  toothConditionColors,
} from '../api/types';
import TableLoadingSkeleton from '../../../../common/components/TableLoadingSkeleton';

const getSurfaceSummary = (item: PatientDentalChartModel): string =>
  item.surfaces
    .map((surface) => surface.teethSurfaceName || surface.surface)
    .filter(Boolean)
    .join(', ') || '--';

const getTooltipRemarks = (remarks?: string): string => {
  const value = remarks?.trim();
  return value ? value : '--';
};

const buildConditionGroups = (items: PatientDentalChartModel[]): ToothConditionGroup[] =>
  Object.values(DentalChartCondition)
    .map((condition) => {
      const teeth = items
        .filter((item) => item.condition === condition)
        .map((item) => getToothIdFromToothNumber(item.toothNumber))
        .filter(Boolean) as string[];

      if (teeth.length === 0) {
        return undefined;
      }

      return {
        label: getDentalChartConditionLabel(condition),
        teeth,
        fillColor: toothConditionColors[condition].fill,
        outlineColor: toothConditionColors[condition].stroke,
      };
    })
    .filter(Boolean) as ToothConditionGroup[];

const renderConditionBadge = (condition?: DentalChartCondition): JSX.Element | string => {
  if (!condition) {
    return '--';
  }

  const colors = toothConditionColors[condition];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 28,
        padding: '0 10px',
        borderRadius: 999,
        background: colors.fill,
        border: `1px solid ${colors.stroke}`,
        color: colors.text,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {getDentalChartConditionLabel(condition)}
    </span>
  );
};

const getChartStyles = (
  chartLayout: PatientDentalChartStateProps['state']['chartLayout'],
  circleHalf: PatientDentalChartStateProps['state']['circleHalf'],
  circleZoom: PatientDentalChartStateProps['state']['circleZoom']
): Record<string, string | number> =>
  chartLayout === 'circle'
    ? circleHalf === 'full'
      ? { width: `${Math.round(420 * circleZoom)}px` }
      : { width: 'clamp(280px, 74%, 520px)' }
    : { minWidth: 940 };

const PatientDentalChartTable: FunctionComponent<PatientDentalChartStateProps> = (
  props: PatientDentalChartStateProps
): JSX.Element => {
  const { state, setState } = props;
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const showRemarksColumn = state.chartLayout !== 'circle';
  const columnCount = isCompact ? 1 : showRemarksColumn ? 5 : 4;

  const conditionGroups = useMemo(() => buildConditionGroups(state.items), [state.items]);
  const itemByToothId = useMemo(
    () =>
      new Map(
        state.items
          .map((item) => [getToothIdFromToothNumber(item.toothNumber), item] as const)
          .filter(([toothId]) => Boolean(toothId))
      ),
    [state.items]
  );

  const handleChartSelect = (selectedTeeth: ToothDetail[]): void => {
    const selectedTooth = selectedTeeth[selectedTeeth.length - 1];
    const selectedToothId = selectedTooth?.id;

    if (!selectedToothId) {
      return;
    }

    const selectedItem = state.items.find(
      (item) => getToothIdFromToothNumber(item.toothNumber) === selectedToothId
    );

    setState({
      ...state,
      selectedItem,
      selectedToothId,
      isUpdate: Boolean(selectedItem),
      isDelete: false,
      openModal: true,
    });
  };

  const renderActionButtons = (item: PatientDentalChartModel): JSX.Element => (
    <div className={`${sharedStyles.buttonContainer} ${sharedStyles.tableButtonContainer}`}>
      <button
        type="button"
        title="Edit"
        aria-label="Edit tooth chart"
        className={`${sharedStyles.buttonItem} ${sharedStyles.tableActionButton} ${sharedStyles.editButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: true,
            isDelete: false,
            openModal: true,
          })
        }
      >
        <EditOutlinedIcon className={sharedStyles.iconEdit} />
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete tooth chart"
        className={`${sharedStyles.buttonItem} ${sharedStyles.tableActionButton} ${sharedStyles.deleteButton}`}
        onClick={(): void =>
          setState({
            ...state,
            selectedItem: item,
            isUpdate: false,
            isDelete: true,
            openModal: true,
          })
        }
      >
        <DeleteOutlineOutlinedIcon className={sharedStyles.iconDelete} />
      </button>
    </div>
  );

  const chartPanel = (
    <div className={localStyles.chartPanel}>
      <div className={localStyles.chartPanelHeader}>
        <div>
          <h4 className={localStyles.chartPanelTitle}>Chart Overview</h4>
          <p className={localStyles.chartPanelText}>
            Selected conditions are color-coded on the odontogram preview.
          </p>
        </div>
      </div>
      <div className={localStyles.chartPreview}>
        <Odontogram
          key={`dental-chart-preview-${state.chartLayout}-${state.circleHalf}-${state.openModal ? 'open' : 'closed'}-${state.selectedToothId || 'none'}`}
          notation="Universal"
          teethConditions={conditionGroups}
          showLabels
          layout={state.chartLayout}
          showHalf={state.chartLayout === 'circle' ? state.circleHalf : 'full'}
          tooltip={{
            placement: 'top',
            content: (payload): JSX.Element | null => {
              if (!payload) {
                return null;
              }

              const item = itemByToothId.get(payload.id);

              return (
                <>
                  <div>Tooth: {payload.notations.universal}</div>
                  <div>Type: {payload.type}</div>
                  <div>
                    Universal: {payload.notations.universal}, Palmer: {payload.notations.palmer}
                  </div>
                  <div>Remarks: {getTooltipRemarks(item?.remarks)}</div>
                </>
              );
            },
          }}
          onChange={handleChartSelect}
          styles={getChartStyles(state.chartLayout, state.circleHalf, state.circleZoom)}
        />
      </div>
    </div>
  );

  const tablePanel = (
    <div className={localStyles.tableWrap}>
      <TableContainer
        className={sharedStyles.tableSurface}
        component={Paper}
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: '20px',
        }}
      >
        <Table stickyHeader aria-label="Dental chart table">
          <TableHead>
            <TableRow>
              <TableCell className={sharedStyles.tableHeaderCell}>Tooth</TableCell>
              {!isCompact ? (
                <>
                  <TableCell className={sharedStyles.tableHeaderCell}>Condition</TableCell>
                  <TableCell className={sharedStyles.tableHeaderCell}>Surfaces</TableCell>
                  {showRemarksColumn ? (
                    <TableCell className={sharedStyles.tableHeaderCell}>Remarks</TableCell>
                  ) : null}
                  <TableCell className={sharedStyles.tableHeaderCell} align="right" />
                </>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {state.load ? (
              <TableLoadingSkeleton
                rowCount={isCompact ? 4 : 5}
                isMobile={isCompact}
                cellClassName={sharedStyles.tableBodyCell}
                rowClassName={sharedStyles.noHoverRow}
                desktopCells={[
                  { width: '46%' },
                  { width: '34%' },
                  { width: '52%' },
                  { width: '74%' },
                  { kind: 'actions', align: 'right' },
                ]}
                mobileConfig={{
                  primaryWidth: '68%',
                  secondaryWidth: 120,
                  secondaryHeight: 18,
                  badgeWidth: 96,
                  badgeHeight: 24,
                  actionCount: 2,
                  actionSize: 34,
                }}
              />
            ) : state.items.length === 0 ? (
              <TableRow className={sharedStyles.noHoverRow}>
                <TableCell
                  colSpan={columnCount}
                  align="center"
                  sx={{ borderBottom: 0, px: isCompact ? 1.5 : 3, py: 9 }}
                >
                  <Box className={sharedStyles.emptyState}>
                    <div className={sharedStyles.emptyStateIcon}>
                      <PersonSearchOutlinedIcon className={sharedStyles.emptyStateGlyph} />
                    </div>
                    <Typography className={sharedStyles.emptyStateTitle}>
                      No charted teeth yet
                    </Typography>
                    <Typography className={sharedStyles.emptyStateText}>
                      Dental chart entries will appear here once teeth are recorded for this
                      patient.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              state.items.map((item, index) => (
                <TableRow hover key={item.id ?? `dental-chart-row-${index}`}>
                  <TableCell className={sharedStyles.tableBodyCell}>
                    {isCompact ? (
                      <div className={sharedStyles.mobileRowInline}>
                        <div className={sharedStyles.mobileMain}>
                          <Typography component="span" className={sharedStyles.mobileName}>
                            {getToothDisplayLabel(item.toothNumber)}
                          </Typography>
                          <div className={sharedStyles.mobileMeta}>
                            <Typography component="span" className={sharedStyles.mobileContact}>
                              {item.condition ? renderConditionBadge(item.condition) : '--'}
                            </Typography>
                            <Typography component="span" className={sharedStyles.mobileContact}>
                              {getSurfaceSummary(item)}
                            </Typography>
                          </div>
                        </div>
                        <div className={sharedStyles.mobileActions}>{renderActionButtons(item)}</div>
                      </div>
                    ) : (
                      getToothDisplayLabel(item.toothNumber)
                    )}
                  </TableCell>
                  {!isCompact ? (
                    <>
                      <TableCell className={sharedStyles.tableBodyCell}>
                        {renderConditionBadge(item.condition)}
                      </TableCell>
                      <TableCell className={sharedStyles.tableBodyCell}>
                        {getSurfaceSummary(item)}
                      </TableCell>
                      {showRemarksColumn ? (
                        <TableCell className={sharedStyles.tableBodyCell}>
                          {item.remarks || '--'}
                        </TableCell>
                      ) : null}
                      <TableCell className={sharedStyles.tableBodyCell} align="right">
                        {renderActionButtons(item)}
                      </TableCell>
                    </>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );

  return (
    state.chartLayout === 'circle' && !isCompact ? (
      <div className={localStyles.circlePageLayout}>
        <div className={localStyles.circlePageChartPane}>{chartPanel}</div>
        <div className={localStyles.circlePageTablePane}>{tablePanel}</div>
      </div>
    ) : (
      <>
        {chartPanel}
        {tablePanel}
      </>
    )
  );
};

export default PatientDentalChartTable;
