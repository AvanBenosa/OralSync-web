import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import localStyles from '../style.scss.module.scss';
import {
  createEmptyPerioBooleanSites,
  createEmptyPerioNumericSites,
  DentalChartKind,
  getDentalChartKind,
  getPerioChartViewByToothId,
  getToothDisplayLabel,
  getToothIdFromToothNumber,
  getToothNumberFromToothId,
  PatientPerioChartModel,
  PatientPerioChartStateProps,
} from '../api/types';
import PerioChartCanvas, { PerioChartEditableCell } from './perio-chart-canvas';
import { CreatePatientPerioChartItem, UpdatePatientPerioChartItem } from '../api/api';

type PatientPerioChartFormProps = PatientPerioChartStateProps;

type PatientPerioChartFormValues = {
  id: string;
  toothId: string;
  furcation: string;
  buccalGingivalMargin: string[];
  buccalProbingDepth: string[];
  buccalBleedingOnProbing: boolean[];
  buccalPlaque: boolean[];
  lingualGingivalMargin: string[];
  lingualProbingDepth: string[];
  lingualBleedingOnProbing: boolean[];
  lingualPlaque: boolean[];
  mobility: string;
  notes: string;
  remarks: string;
};

const numericSitesToFieldValues = (values?: Array<number | null>): string[] =>
  createEmptyPerioNumericSites().map((_, index) => {
    const value = values?.[index];
    return typeof value === 'number' ? String(value) : '';
  });

const booleanSitesToFieldValues = (values?: boolean[]): boolean[] =>
  createEmptyPerioBooleanSites().map((_, index) => Boolean(values?.[index]));

const parseNumericSiteValue = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const MOBILITY_OPTIONS = [
  { value: '', label: 'Not charted' },
  { value: '0', label: 'Grade 0' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
] as const;

const buildPayloadFromValues = (
  values: PatientPerioChartFormValues,
  chartKind: DentalChartKind,
  patientId?: string
): PatientPerioChartModel => ({
  id: values.id.trim() || undefined,
  patientInfoId: patientId,
  toothNumber: getToothNumberFromToothId(values.toothId, chartKind),
  furcation: values.furcation.trim() || undefined,
  buccalGingivalMargin: values.buccalGingivalMargin.map(parseNumericSiteValue),
  buccalProbingDepth: values.buccalProbingDepth.map(parseNumericSiteValue),
  buccalBleedingOnProbing: values.buccalBleedingOnProbing.map(Boolean),
  buccalPlaque: values.buccalPlaque.map(Boolean),
  lingualGingivalMargin: values.lingualGingivalMargin.map(parseNumericSiteValue),
  lingualProbingDepth: values.lingualProbingDepth.map(parseNumericSiteValue),
  lingualBleedingOnProbing: values.lingualBleedingOnProbing.map(Boolean),
  lingualPlaque: values.lingualPlaque.map(Boolean),
  mobility: values.mobility.trim() || undefined,
  notes: values.notes.trim() || undefined,
  remarks: values.remarks.trim() || undefined,
});

const createInitialValues = (
  selectedItem?: PatientPerioChartModel,
  selectedToothId?: string,
  chartKind: DentalChartKind = 'adult'
): PatientPerioChartFormValues => ({
  id: selectedItem?.id || '',
  toothId: getToothIdFromToothNumber(selectedItem?.toothNumber, chartKind) || selectedToothId || '',
  furcation: selectedItem?.furcation?.trim() || '',
  buccalGingivalMargin: numericSitesToFieldValues(selectedItem?.buccalGingivalMargin),
  buccalProbingDepth: numericSitesToFieldValues(selectedItem?.buccalProbingDepth),
  buccalBleedingOnProbing: booleanSitesToFieldValues(selectedItem?.buccalBleedingOnProbing),
  buccalPlaque: booleanSitesToFieldValues(selectedItem?.buccalPlaque),
  lingualGingivalMargin: numericSitesToFieldValues(selectedItem?.lingualGingivalMargin),
  lingualProbingDepth: numericSitesToFieldValues(selectedItem?.lingualProbingDepth),
  lingualBleedingOnProbing: booleanSitesToFieldValues(selectedItem?.lingualBleedingOnProbing),
  lingualPlaque: booleanSitesToFieldValues(selectedItem?.lingualPlaque),
  mobility: selectedItem?.mobility?.trim() || '',
  notes: selectedItem?.notes?.trim() || '',
  remarks: selectedItem?.remarks?.trim() || '',
});

const mergePreviewItems = (
  items: PatientPerioChartModel[],
  draftItem: PatientPerioChartModel
): PatientPerioChartModel[] => {
  if (!draftItem.toothNumber) {
    return items;
  }

  return [...items.filter((item) => item.toothNumber !== draftItem.toothNumber), draftItem];
};

const getExistingItemByToothId = (
  items: PatientPerioChartModel[],
  toothId: string,
  chartKind: DentalChartKind
): PatientPerioChartModel | undefined =>
  items.find((item) => getToothIdFromToothNumber(item.toothNumber, chartKind) === toothId);

const resolveValuesForTooth = (
  toothId: string,
  currentValues: PatientPerioChartFormValues,
  items: PatientPerioChartModel[],
  chartKind: DentalChartKind
): PatientPerioChartFormValues =>
  currentValues.toothId === toothId
    ? currentValues
    : createInitialValues(getExistingItemByToothId(items, toothId, chartKind), toothId, chartKind);

const updateStringSiteValue = (values: string[], siteIndex: number, nextValue: string): string[] =>
  values.map((value, index) => (index === siteIndex ? nextValue : value));

const toggleBooleanSiteValue = (values: boolean[], siteIndex: number): boolean[] =>
  values.map((value, index) => (index === siteIndex ? !value : value));

const applyEditableCellValue = (
  values: PatientPerioChartFormValues,
  cell: PerioChartEditableCell,
  nextValue: string
): PatientPerioChartFormValues => {
  if (cell.rowId === 'furcation') {
    return {
      ...values,
      furcation: nextValue,
    };
  }

  if (typeof cell.siteIndex !== 'number') {
    return values;
  }

  if (cell.rowId === 'gingivalMargin') {
    const field = cell.surface === 'buccal' ? 'buccalGingivalMargin' : 'lingualGingivalMargin';

    return {
      ...values,
      [field]: updateStringSiteValue(values[field], cell.siteIndex, nextValue),
    };
  }

  const field = cell.surface === 'buccal' ? 'buccalProbingDepth' : 'lingualProbingDepth';

  return {
    ...values,
    [field]: updateStringSiteValue(values[field], cell.siteIndex, nextValue),
  };
};

const applyBooleanCellToggle = (
  values: PatientPerioChartFormValues,
  cell: PerioChartEditableCell
): PatientPerioChartFormValues => {
  if (typeof cell.siteIndex !== 'number') {
    return values;
  }

  if (cell.rowId === 'bleedingOnProbing') {
    const field =
      cell.surface === 'buccal' ? 'buccalBleedingOnProbing' : 'lingualBleedingOnProbing';

    return {
      ...values,
      [field]: toggleBooleanSiteValue(values[field], cell.siteIndex),
    };
  }

  const field = cell.surface === 'buccal' ? 'buccalPlaque' : 'lingualPlaque';

  return {
    ...values,
    [field]: toggleBooleanSiteValue(values[field], cell.siteIndex),
  };
};

type AutosavePhase = 'idle' | 'saving' | 'saved' | 'error';

const hasMeaningfulPerioValues = (values: PatientPerioChartFormValues): boolean =>
  Boolean(
    values.furcation.trim() ||
      values.mobility.trim() ||
      values.notes.trim() ||
      values.remarks.trim() ||
      values.buccalGingivalMargin.some((value) => value.trim() !== '') ||
      values.buccalProbingDepth.some((value) => value.trim() !== '') ||
      values.lingualGingivalMargin.some((value) => value.trim() !== '') ||
      values.lingualProbingDepth.some((value) => value.trim() !== '') ||
      values.buccalBleedingOnProbing.some(Boolean) ||
      values.buccalPlaque.some(Boolean) ||
      values.lingualBleedingOnProbing.some(Boolean) ||
      values.lingualPlaque.some(Boolean)
  );

const buildAutosaveFingerprint = (
  values: PatientPerioChartFormValues,
  chartKind: DentalChartKind,
  patientId?: string,
  includeId: boolean = true
): string => {
  const payload = buildPayloadFromValues(values, chartKind, patientId);

  return JSON.stringify({
    ...payload,
    id: includeId ? payload.id || '' : '',
  });
};

const mergeSavedValues = (
  currentValues: PatientPerioChartFormValues,
  savedItem: PatientPerioChartModel,
  snapshotValues: PatientPerioChartFormValues,
  chartKind: DentalChartKind,
  patientId?: string
): PatientPerioChartFormValues => {
  const savedToothId =
    getToothIdFromToothNumber(savedItem.toothNumber, chartKind) || currentValues.toothId;
  const savedValues = createInitialValues(savedItem, savedToothId, chartKind);
  const currentFingerprint = buildAutosaveFingerprint(currentValues, chartKind, patientId, false);
  const snapshotFingerprint = buildAutosaveFingerprint(snapshotValues, chartKind, patientId, false);

  if (currentValues.toothId === savedToothId && currentFingerprint === snapshotFingerprint) {
    return savedValues;
  }

  if (currentValues.toothId === savedToothId && !currentValues.id.trim() && savedItem.id) {
    return {
      ...currentValues,
      id: savedItem.id,
    };
  }

  return currentValues;
};

const PatientPerioChartForm: FunctionComponent<PatientPerioChartFormProps> = (
  props: PatientPerioChartFormProps
): JSX.Element => {
  const { state, setState, patientProfile } = props;
  const chartKind = getDentalChartKind(patientProfile);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedSaveValuesRef = useRef<PatientPerioChartFormValues | null>(null);
  const currentValuesRef = useRef<PatientPerioChartFormValues | null>(null);
  const setValuesRef = useRef<
    ((values: PatientPerioChartFormValues, shouldValidate?: boolean) => void) | null
  >(null);
  const saveInFlightRef = useRef(false);
  const lastSavedFingerprintRef = useRef('');
  const isMountedRef = useRef(true);
  const [autosavePhase, setAutosavePhase] = useState<AutosavePhase>('idle');
  const [autosaveMessage, setAutosaveMessage] = useState('Changes save automatically.');
  const [commentModalToothId, setCommentModalToothId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentModalError, setCommentModalError] = useState('');
  const [commentModalSaving, setCommentModalSaving] = useState(false);

  const handleClearSelection = (): void => {
    setState((prevState: PatientPerioChartStateProps['state']) => ({
      ...prevState,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
      selectedToothId: undefined,
    }));
    setCommentModalToothId(null);
    setCommentDraft('');
    setCommentModalError('');
  };

  const handleCloseCommentModal = (): void => {
    if (commentModalSaving) {
      return;
    }

    setCommentModalToothId(null);
    setCommentDraft('');
    setCommentModalError('');
  };

  const handleSavedIndicator = (message: string): void => {
    if (!isMountedRef.current) {
      return;
    }

    if (autosaveResetRef.current) {
      clearTimeout(autosaveResetRef.current);
    }

    setAutosavePhase('saved');
    setAutosaveMessage(message);

    autosaveResetRef.current = setTimeout(() => {
      setAutosavePhase('idle');
      setAutosaveMessage('Changes save automatically.');
    }, 1800);
  };

  const upsertSavedItem = (response: PatientPerioChartModel): void => {
    const savedToothId = getToothIdFromToothNumber(response.toothNumber, chartKind);

    setState((prev: PatientPerioChartStateProps['state']) => ({
      ...prev,
      items: [
        ...prev.items.filter(
          (item) => item.id !== response.id && item.toothNumber !== response.toothNumber
        ),
        response,
      ].sort((left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)),
      selectedItem: prev.selectedToothId === savedToothId ? response : prev.selectedItem,
      selectedToothId: prev.selectedToothId === savedToothId ? savedToothId : prev.selectedToothId,
      isUpdate: prev.selectedToothId === savedToothId ? true : prev.isUpdate,
    }));
  };

  const persistValues = async (
    values: PatientPerioChartFormValues,
    force: boolean = false
  ): Promise<void> => {
    queuedSaveValuesRef.current = values;

    if (saveInFlightRef.current) {
      return;
    }

    saveInFlightRef.current = true;

    try {
      while (queuedSaveValuesRef.current) {
        const snapshotValues: PatientPerioChartFormValues = queuedSaveValuesRef.current;
        queuedSaveValuesRef.current = null;
        const payload = buildPayloadFromValues(snapshotValues, chartKind, state.patientId);

        if (!payload.toothNumber) {
          continue;
        }

        if (!payload.id?.trim() && !hasMeaningfulPerioValues(snapshotValues)) {
          continue;
        }

        const snapshotFingerprint = buildAutosaveFingerprint(
          snapshotValues,
          chartKind,
          state.patientId
        );

        if (!force && snapshotFingerprint === lastSavedFingerprintRef.current) {
          continue;
        }

        if (isMountedRef.current) {
          setAutosavePhase('saving');
          setAutosaveMessage('Saving changes...');
        }

        const response = payload.id?.trim()
          ? await UpdatePatientPerioChartItem(payload, false)
          : await CreatePatientPerioChartItem(payload, false);

        const savedToothId =
          getToothIdFromToothNumber(response.toothNumber, chartKind) || snapshotValues.toothId;
        const savedValues = createInitialValues(response, savedToothId, chartKind);
        lastSavedFingerprintRef.current = buildAutosaveFingerprint(
          savedValues,
          chartKind,
          state.patientId
        );

        const queuedValues = queuedSaveValuesRef.current as PatientPerioChartFormValues | null;

        if (
          queuedValues &&
          savedToothId &&
          queuedValues.toothId === savedToothId &&
          !queuedValues.id.trim() &&
          response.id
        ) {
          queuedSaveValuesRef.current = {
            ...queuedValues,
            id: response.id,
          };
        }

        upsertSavedItem(response);

        if (isMountedRef.current && currentValuesRef.current && setValuesRef.current) {
          const mergedValues = mergeSavedValues(
            currentValuesRef.current,
            response,
            snapshotValues,
            chartKind,
            state.patientId
          );

          currentValuesRef.current = mergedValues;
          setValuesRef.current(mergedValues, false);
        }

        handleSavedIndicator(
          `${getToothDisplayLabel(response.toothNumber, chartKind)} saved automatically.`
        );
      }
    } catch (error) {
      if (isMountedRef.current) {
        setAutosavePhase('error');
        setAutosaveMessage('Auto-save failed. Keep editing and try again.');
      }
      throw error;
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const scheduleAutosave = (values: PatientPerioChartFormValues): void => {
    currentValuesRef.current = values;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      void persistValues(values).catch(() => undefined);
    }, 650);
  };

  const flushAutosave = async (values?: PatientPerioChartFormValues): Promise<void> => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const pendingValues = values || currentValuesRef.current;

    if (!pendingValues) {
      return;
    }

    await persistValues(pendingValues);
  };

  const handleSubmit = async (values: PatientPerioChartFormValues): Promise<void> => {
    const payload = buildPayloadFromValues(values, chartKind, state.patientId);

    if (!payload.toothNumber) {
      throw new Error('Please select a tooth from the perio chart.');
    }

    await flushAutosave(values);
  };

  useEffect(() => {
    if (autosaveResetRef.current) {
      clearTimeout(autosaveResetRef.current);
    }

    setAutosavePhase('idle');
    setAutosaveMessage('Changes save automatically.');
  }, [state.selectedItem?.id, state.selectedToothId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      setValuesRef.current = null;

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      if (autosaveResetRef.current) {
        clearTimeout(autosaveResetRef.current);
      }
    };
  }, []);

  return (
    <Formik
      enableReinitialize
      validateOnChange={false}
      initialValues={createInitialValues(state.selectedItem, state.selectedToothId, chartKind)}
      onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
        setStatus(undefined);

        try {
          await handleSubmit(values);
        } catch (error) {
          if (isAxiosError(error)) {
            setStatus(
              typeof error.response?.data === 'string' ? error.response.data : error.message
            );
          } else if (error instanceof Error) {
            setStatus(error.message);
          } else {
            setStatus('Unable to save perio chart entry.');
          }
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, handleSubmit, status, setValues }): JSX.Element => {
        currentValuesRef.current = values;
        setValuesRef.current = setValues;
        const draftPayload = buildPayloadFromValues(values, chartKind, state.patientId);
        const isEditingExistingEntry = Boolean(values.id.trim());
        const canvasView =
          getPerioChartViewByToothId(values.toothId, chartKind) || state.circleHalf;
        const canvasViewLabel = canvasView === 'upper' ? 'upper' : 'lower';
        const resolvedToothLabel = getToothDisplayLabel(
          getToothNumberFromToothId(values.toothId, chartKind),
          chartKind
        );
        const selectedToothLabel = values.toothId ? resolvedToothLabel : 'No tooth selected';
        const mobilitySummaryValue = values.mobility.trim() || '--';
        const furcationSummaryValue = values.furcation.trim() || '--';
        const commentSummaryValue = values.notes.trim() ? 'Saved' : 'None';
        const hasPendingAutosave =
          Boolean(autosaveTimeoutRef.current) ||
          Boolean(queuedSaveValuesRef.current) ||
          saveInFlightRef.current;

        const handleCanvasToothSelect = (toothId: string): void => {
          void (async () => {
            try {
              if (hasPendingAutosave) {
                await flushAutosave(values);
              }
            } catch {
              return;
            }

            const selectedItem = getExistingItemByToothId(state.items, toothId, chartKind);
            const selectedView = getPerioChartViewByToothId(toothId, chartKind) || state.circleHalf;
            const nextValues = resolveValuesForTooth(toothId, values, state.items, chartKind);

            setState((prevState: PatientPerioChartStateProps['state']) => ({
              ...prevState,
              circleHalf: selectedView,
              selectedItem,
              selectedToothId: toothId,
              isUpdate: Boolean(selectedItem),
              isDelete: false,
            }));

            if (nextValues !== values) {
              setValues(nextValues, false);
              currentValuesRef.current = nextValues;
            }
          })();
        };

        const handleCanvasCellValueChange = (
          cell: PerioChartEditableCell,
          nextValue: string
        ): void => {
          const baseValues = resolveValuesForTooth(cell.toothId, values, state.items, chartKind);
          const nextValues = applyEditableCellValue(baseValues, cell, nextValue);
          setValues(nextValues, false);
          scheduleAutosave(nextValues);
        };

        const handleCanvasBooleanToggle = (cell: PerioChartEditableCell): void => {
          const baseValues = resolveValuesForTooth(cell.toothId, values, state.items, chartKind);
          const nextValues = applyBooleanCellToggle(baseValues, cell);
          setValues(nextValues, false);
          scheduleAutosave(nextValues);
        };

        const handleCommentIconClick = (toothId: string): void => {
          void (async () => {
            try {
              if (hasPendingAutosave) {
                await flushAutosave(values);
              }
            } catch {
              return;
            }

            const selectedItem = getExistingItemByToothId(state.items, toothId, chartKind);
            const selectedView = getPerioChartViewByToothId(toothId, chartKind) || state.circleHalf;
            const nextValues = resolveValuesForTooth(toothId, values, state.items, chartKind);

            setState((prevState: PatientPerioChartStateProps['state']) => ({
              ...prevState,
              circleHalf: selectedView,
              selectedItem,
              selectedToothId: toothId,
              isUpdate: Boolean(selectedItem),
              isDelete: false,
            }));

            if (nextValues !== values) {
              setValues(nextValues, false);
              currentValuesRef.current = nextValues;
            }

            setCommentModalError('');
            setCommentDraft(nextValues.notes);
            setCommentModalToothId(toothId);
          })();
        };

        const handleMobilityChange = (nextMobility: string): void => {
          const nextValues = {
            ...values,
            mobility: nextMobility,
          };

          setValues(nextValues, false);
          scheduleAutosave(nextValues);
        };

        const handleCommentSave = (): void => {
          void (async () => {
            if (!commentModalToothId) {
              return;
            }

            setCommentModalSaving(true);
            setCommentModalError('');

            const baseValues = resolveValuesForTooth(
              commentModalToothId,
              currentValuesRef.current || values,
              state.items,
              chartKind
            );
            const nextValues = {
              ...baseValues,
              toothId: commentModalToothId,
              notes: commentDraft,
            };

            setValues(nextValues, false);
            currentValuesRef.current = nextValues;

            try {
              await persistValues(nextValues, true);
              setCommentModalToothId(null);
              setCommentDraft('');
            } catch (error) {
              if (isAxiosError(error)) {
                setCommentModalError(
                  typeof error.response?.data === 'string' ? error.response.data : error.message
                );
              } else if (error instanceof Error) {
                setCommentModalError(error.message);
              } else {
                setCommentModalError('Unable to save comment.');
              }
            } finally {
              setCommentModalSaving(false);
            }
          })();
        };

        const commentToothLabel = commentModalToothId
          ? getToothDisplayLabel(
              getToothNumberFromToothId(commentModalToothId, chartKind),
              chartKind
            )
          : 'Selected tooth';

        return (
          <>
            <Box component="form" onSubmit={handleSubmit} className={localStyles.editorShell}>
              <div className={localStyles.editorHeader}>
                <div>
                  <h3 className={localStyles.editorTitle}>Perio Chart Editor</h3>
                  <p className={localStyles.editorText}>
                    Select a tooth and edit it directly on this page. Use the chart for site
                    measurements, the mobility control below for grade, and the comment icon above
                    each column for per-tooth notes.
                  </p>
                </div>
                <span className={localStyles.toothPickerValue}>{selectedToothLabel}</span>
              </div>

              {status ? (
                <Alert severity="error" sx={{ mb: 0 }}>
                  {status}
                </Alert>
              ) : null}

              <div className={localStyles.formSection}>
                <div className={localStyles.toothPickerCard}>
                  <div className={localStyles.toothPickerHeader}>
                    <div>
                      <h4 className={localStyles.toothPickerTitle}>Tooth Picker</h4>
                      <p className={localStyles.toothPickerText}>
                        {`Click inside the ${canvasViewLabel} arch sheet to select a tooth, type numeric values directly in the table, toggle BOP or plaque marks, then use the mobility control below or the comment icon above the column for extra details.`}
                      </p>
                    </div>
                    <span className={localStyles.toothPickerValue}>{selectedToothLabel}</span>
                  </div>
                  <div className={localStyles.toothPickerChart}>
                    <PerioChartCanvas
                      items={mergePreviewItems(state.items, draftPayload)}
                      chartKind={chartKind}
                      selectedToothId={values.toothId || undefined}
                      onSelectTooth={handleCanvasToothSelect}
                      onCommentClick={handleCommentIconClick}
                      onCellValueChange={handleCanvasCellValueChange}
                      onBooleanCellToggle={handleCanvasBooleanToggle}
                      zoom={chartKind === 'child' ? 1.18 : 1.1}
                      view={canvasView}
                      showLegend={false}
                      editable
                    />
                  </div>
                </div>

                <div className={localStyles.toothDetailsCard}>
                  <div className={localStyles.toothDetailsHeader}>
                    <div>
                      <h4 className={localStyles.toothDetailsTitle}>Tooth Details</h4>
                      <p className={localStyles.toothDetailsText}>
                        Set the mobility grade for the selected tooth. It saves with the rest of the
                        perio entry and appears in the tooth summary.
                      </p>
                    </div>
                    <span className={localStyles.toothPickerValue}>{selectedToothLabel}</span>
                  </div>

                  <div className={localStyles.summaryStrip}>
                    <span className={localStyles.summaryChip}>
                      {`Mobility: ${mobilitySummaryValue}`}
                    </span>
                    <span className={localStyles.summaryChip}>
                      {`Furcation: ${furcationSummaryValue}`}
                    </span>
                    <span className={localStyles.summaryChip}>
                      {`Comment: ${commentSummaryValue}`}
                    </span>
                  </div>

                  <div className={localStyles.toothDetailsGrid}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Mobility"
                      value={values.mobility}
                      onChange={(event) => handleMobilityChange(event.target.value)}
                      disabled={!values.toothId}
                      helperText={
                        values.toothId
                          ? 'Choose the mobility grade for this tooth. Leave it as Not charted if it was not assessed.'
                          : 'Select a tooth first to set mobility.'
                      }
                    >
                      {MOBILITY_OPTIONS.map((option) => (
                        <MenuItem key={`mobility-option-${option.label}`} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </div>
                </div>
              </div>

              <div className={localStyles.editorActions}>
                <div
                  className={`${localStyles.autosaveStatus} ${
                    localStyles[
                      `autosaveStatus${autosavePhase.charAt(0).toUpperCase()}${autosavePhase.slice(
                        1
                      )}`
                    ]
                  }`}
                >
                  {autosaveMessage}
                </div>
                <div className={localStyles.editorActionButtons}>
                  {isEditingExistingEntry ? (
                    <Button
                      color="error"
                      onClick={() => {
                        void (async () => {
                          try {
                            if (hasPendingAutosave) {
                              await flushAutosave(values);
                            }

                            setState((prevState: PatientPerioChartStateProps['state']) => ({
                              ...prevState,
                              isUpdate: false,
                              isDelete: true,
                              selectedToothId: values.toothId || prevState.selectedToothId,
                              selectedItem:
                                getExistingItemByToothId(
                                  prevState.items,
                                  values.toothId,
                                  chartKind
                                ) || prevState.selectedItem,
                            }));
                          } catch {
                            return;
                          }
                        })();
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => {
                      void (async () => {
                        try {
                          if (hasPendingAutosave) {
                            await flushAutosave(values);
                          }

                          handleClearSelection();
                        } catch {
                          return;
                        }
                      })();
                    }}
                    color="inherit"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Box>

            <Dialog
              open={Boolean(commentModalToothId)}
              onClose={handleCloseCommentModal}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
                {`Comment for ${commentToothLabel}`}
              </DialogTitle>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                {commentModalError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {commentModalError}
                  </Alert>
                ) : null}
                <TextField
                  label="Comment"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={5}
                  placeholder="Add per-tooth comment, observations, treatment context, or reminders."
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                  onClick={handleCloseCommentModal}
                  color="inherit"
                  disabled={commentModalSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCommentSave}
                  variant="contained"
                  disabled={commentModalSaving}
                >
                  Save Comment
                </Button>
              </DialogActions>
            </Dialog>
          </>
        );
      }}
    </Formik>
  );
};

export default PatientPerioChartForm;
