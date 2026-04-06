import { FunctionComponent, JSX, useMemo } from 'react';
import type { MutableRefObject } from 'react';

import type { PatientProfileModel } from '../../../patient-profile/api/types';
import localStyles from '../style.scss.module.scss';
import {
  countPositiveSites,
  DentalChartKind,
  getMaxPerioProbingDepth,
  getPerioChartCondition,
  getPerioChartConditionLabel,
  getToothDisplayLabel,
  PatientPerioChartModel,
} from '../api/types';
import PerioChartCanvas from './perio-chart-canvas';

type PatientPerioChartReportPreviewProps = {
  items: PatientPerioChartModel[];
  chartKind: DentalChartKind;
  patientProfile?: PatientProfileModel | null;
  patientLabel?: string;
  reportRef: MutableRefObject<HTMLDivElement | null>;
};

const createSafeFileSegment = (value?: string): string =>
  (value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildPerioChartPatientName = (
  patientProfile?: PatientProfileModel | null,
  patientLabel?: string
): string => {
  const firstName = patientProfile?.firstName?.trim();
  const middleName = patientProfile?.middleName?.trim();
  const lastName = patientProfile?.lastName?.trim();
  const givenNames = [firstName, middleName].filter(Boolean).join(' ');
  const fullName = [lastName, givenNames].filter(Boolean).join(', ');

  if (fullName) {
    return fullName;
  }

  return patientLabel?.trim() || patientProfile?.patientNumber?.trim() || 'Patient';
};

export const buildPerioChartPdfFileName = (
  patientProfile?: PatientProfileModel | null,
  patientLabel?: string
): string => {
  const patientName = createSafeFileSegment(buildPerioChartPatientName(patientProfile, patientLabel));
  const fileName = [patientName, 'Perio Chart Summary'].filter(Boolean).join(' - ');

  return `${fileName || 'Perio Chart Summary'}.pdf`;
};

const formatDisplayDate = (value?: string | Date): string => {
  if (!value) {
    return '--';
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolvedDate.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(resolvedDate);
};

const getChartZoom = (chartKind: DentalChartKind): number => (chartKind === 'child' ? 0.66 : 0.56);

const PatientPerioChartReportPreview: FunctionComponent<PatientPerioChartReportPreviewProps> = (
  props: PatientPerioChartReportPreviewProps
): JSX.Element => {
  const { items, chartKind, patientProfile, patientLabel, reportRef } = props;
  const sortedItems = useMemo(
    () => [...items].sort((left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)),
    [items]
  );
  const patientName = buildPerioChartPatientName(patientProfile, patientLabel);
  const chartDate = sortedItems.find((item) => item.chartDate)?.chartDate;
  const generatedDate = formatDisplayDate(new Date());
  const notesCount = sortedItems.filter((item) => item.notes?.trim()).length;
  const maxProbingDepth = sortedItems.length
    ? Math.max(...sortedItems.map((item) => getMaxPerioProbingDepth(item)))
    : 0;

  return (
    <div className={localStyles.pdfReportMount} aria-hidden="true">
      <div ref={reportRef} className={localStyles.pdfReport}>
        <div className={localStyles.pdfHeader}>
          <div>
            <p className={localStyles.pdfEyebrow}>Periodontal Summary</p>
            <h2 className={localStyles.pdfTitle}>Perio Chart Report</h2>
            <p className={localStyles.pdfSubtitle}>
              A printable snapshot of the chart, tooth status summary, and per-tooth notes.
            </p>
          </div>
          <div className={localStyles.pdfMetaGrid}>
            <div className={localStyles.pdfMetaCard}>
              <span className={localStyles.pdfMetaLabel}>Patient</span>
              <strong className={localStyles.pdfMetaValue}>{patientName}</strong>
            </div>
            <div className={localStyles.pdfMetaCard}>
              <span className={localStyles.pdfMetaLabel}>Patient No.</span>
              <strong className={localStyles.pdfMetaValue}>
                {patientProfile?.patientNumber?.trim() || '--'}
              </strong>
            </div>
            <div className={localStyles.pdfMetaCard}>
              <span className={localStyles.pdfMetaLabel}>Chart Date</span>
              <strong className={localStyles.pdfMetaValue}>{formatDisplayDate(chartDate)}</strong>
            </div>
            <div className={localStyles.pdfMetaCard}>
              <span className={localStyles.pdfMetaLabel}>Generated</span>
              <strong className={localStyles.pdfMetaValue}>{generatedDate}</strong>
            </div>
          </div>
        </div>

        <div className={localStyles.pdfSummaryGrid}>
          <div className={localStyles.pdfSummaryCard}>
            <span className={localStyles.pdfSummaryLabel}>Recorded Teeth</span>
            <strong className={localStyles.pdfSummaryValue}>{sortedItems.length}</strong>
          </div>
          <div className={localStyles.pdfSummaryCard}>
            <span className={localStyles.pdfSummaryLabel}>Teeth With Notes</span>
            <strong className={localStyles.pdfSummaryValue}>{notesCount}</strong>
          </div>
          <div className={localStyles.pdfSummaryCard}>
            <span className={localStyles.pdfSummaryLabel}>Highest Probing Depth</span>
            <strong className={localStyles.pdfSummaryValue}>{`${maxProbingDepth} mm`}</strong>
          </div>
        </div>

        <section className={localStyles.pdfSection}>
          <div className={localStyles.pdfSectionHeader}>
            <h3 className={localStyles.pdfSectionTitle}>Upper Arch</h3>
            <span className={localStyles.pdfSectionMeta}>Buccal / Lingual chart view</span>
          </div>
          <div className={localStyles.pdfChartShell}>
            <PerioChartCanvas
              items={sortedItems}
              chartKind={chartKind}
              view="upper"
              zoom={getChartZoom(chartKind)}
              minZoom={0.5}
              showLegend={false}
              showHint={false}
              interactive={false}
            />
          </div>
        </section>

        <section className={localStyles.pdfSection}>
          <div className={localStyles.pdfSectionHeader}>
            <h3 className={localStyles.pdfSectionTitle}>Lower Arch</h3>
            <span className={localStyles.pdfSectionMeta}>Lingual / Buccal chart view</span>
          </div>
          <div className={localStyles.pdfChartShell}>
            <PerioChartCanvas
              items={sortedItems}
              chartKind={chartKind}
              view="lower"
              zoom={getChartZoom(chartKind)}
              minZoom={0.5}
              showLegend={false}
              showHint={false}
              interactive={false}
            />
          </div>
        </section>

        <section className={localStyles.pdfSection}>
          <div className={localStyles.pdfSectionHeader}>
            <h3 className={localStyles.pdfSectionTitle}>Tooth Summary</h3>
            <span className={localStyles.pdfSectionMeta}>
              Includes mobility, furcation, site counts, and notes
            </span>
          </div>

          {sortedItems.length ? (
            <div className={localStyles.pdfTableWrap}>
              <table className={localStyles.pdfTable}>
                <thead>
                  <tr>
                    <th>Tooth</th>
                    <th>Condition</th>
                    <th>Mobility</th>
                    <th>Furcation</th>
                    <th>Max PD</th>
                    <th>BOP</th>
                    <th>P</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => {
                    const toothNumber = item.toothNumber;
                    const bopCount =
                      countPositiveSites(item.buccalBleedingOnProbing) +
                      countPositiveSites(item.lingualBleedingOnProbing);
                    const plaqueCount =
                      countPositiveSites(item.buccalPlaque) + countPositiveSites(item.lingualPlaque);

                    return (
                      <tr key={`perio-report-row-${item.id || toothNumber || 'unknown'}`}>
                        <td>{getToothDisplayLabel(toothNumber, chartKind)}</td>
                        <td>{getPerioChartConditionLabel(getPerioChartCondition(item))}</td>
                        <td>{item.mobility?.trim() || '--'}</td>
                        <td>{item.furcation?.trim() || '--'}</td>
                        <td>{`${getMaxPerioProbingDepth(item)} mm`}</td>
                        <td>{bopCount}</td>
                        <td>{plaqueCount}</td>
                        <td className={localStyles.pdfNotesCell}>{item.notes?.trim() || '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={localStyles.pdfEmptyState}>
              No teeth have been charted yet. The PDF still includes a clean upper and lower chart
              layout for review.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientPerioChartReportPreview;
