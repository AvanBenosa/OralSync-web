import type { CSSProperties, FunctionComponent, MutableRefObject, JSX } from 'react';
import { useMemo } from 'react';
import { Odontogram, ToothConditionGroup } from 'react-odontogram';

import {
  DentalChartKind,
  getDentalChartMaxTeeth,
  getToothDisplayLabel,
  getToothNumberFromToothId,
} from '../../patient-profile-modules/dental-chart/api/types';
import {
  DENTAL_LAB_WORK_TYPE_OPTIONS,
  DentalLabCaseModel,
  DentalLabCaseToothModel,
  DentalLabWorkType,
  getDentalLabCaseStatusLabel,
  getDentalLabWorkTypeLabel,
} from '../api/types';

type DentalLabCaseReportPreviewProps = {
  item: DentalLabCaseModel;
  reportRef: MutableRefObject<HTMLDivElement | null>;
};

const mountStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: -10000,
  width: 1120,
  pointerEvents: 'none',
  zIndex: -1,
};

const reportStyle: CSSProperties = {
  width: 1120,
  padding: 32,
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#19324a',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 24,
  paddingBottom: 18,
  borderBottom: '1px solid rgba(180, 198, 214, 0.72)',
};

const eyebrowStyle: CSSProperties = {
  margin: '0 0 8px',
  color: '#2c6ea8',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#173b59',
  fontSize: 28,
  fontWeight: 800,
};

const subtitleStyle: CSSProperties = {
  margin: '8px 0 0',
  maxWidth: 560,
  color: '#58718a',
  fontSize: 13,
  lineHeight: 1.55,
};

const metaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))',
  gap: 10,
  minWidth: 360,
};

const metaCardStyle: CSSProperties = {
  padding: '12px 14px',
  border: '1px solid rgba(203, 217, 229, 0.92)',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #f8fbfe 0%, #eef5fb 100%)',
};

const metaLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#6f879e',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const metaValueStyle: CSSProperties = {
  color: '#183750',
  fontSize: 15,
  fontWeight: 800,
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  marginTop: 18,
};

const summaryCardStyle: CSSProperties = {
  padding: '16px 18px',
  border: '1px solid rgba(203, 217, 229, 0.92)',
  borderRadius: 16,
  background: 'linear-gradient(180deg, #ffffff 0%, #f5f9fc 100%)',
};

const summaryLabelStyle: CSSProperties = {
  display: 'block',
  color: '#6b8298',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const summaryValueStyle: CSSProperties = {
  display: 'block',
  marginTop: 8,
  color: '#163a58',
  fontSize: 24,
  fontWeight: 800,
};

const sectionStyle: CSSProperties = {
  marginTop: 22,
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: '#173b59',
  fontSize: 18,
  fontWeight: 800,
};

const sectionMetaStyle: CSSProperties = {
  color: '#6f879e',
  fontSize: 12,
  fontWeight: 600,
};

const chartShellStyle: CSSProperties = {
  padding: 14,
  border: '1px solid rgba(203, 217, 229, 0.92)',
  borderRadius: 18,
  background: 'linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)',
  display: 'flex',
  justifyContent: 'center',
  overflow: 'hidden',
};

const tableWrapStyle: CSSProperties = {
  overflow: 'hidden',
  border: '1px solid rgba(203, 217, 229, 0.92)',
  borderRadius: 18,
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
};

const cellStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(225, 232, 238, 0.96)',
  textAlign: 'left',
  verticalAlign: 'top',
  fontSize: 12,
  lineHeight: 1.5,
};

const headCellStyle: CSSProperties = {
  ...cellStyle,
  background: '#f3f8fc',
  color: '#173b59',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const notesCardStyle: CSSProperties = {
  padding: '16px 18px',
  border: '1px solid rgba(203, 217, 229, 0.92)',
  borderRadius: 18,
  background: 'linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)',
  color: '#38546e',
  fontSize: 13,
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
};

const legendWrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
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

const formatCurrency = (value?: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof value === 'number' ? value : 0);

const createSafeFileSegment = (value?: string): string =>
  (value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildPatientName = (item: DentalLabCaseModel): string =>
  item.patientLabel?.trim() || item.patientNumber?.trim() || 'Patient';

export const buildDentalLabCasePdfFileName = (item: DentalLabCaseModel): string => {
  const patientName = createSafeFileSegment(buildPatientName(item));
  const caseNumber = createSafeFileSegment(item.caseNumber || 'Lab Case');
  const fileName = [patientName, caseNumber, 'Lab Case Summary'].filter(Boolean).join(' - ');

  return `${fileName || 'Lab Case Summary'}.pdf`;
};

const resolveChartKind = (birthDate?: string | Date): DentalChartKind => {
  if (!birthDate) {
    return 'adult';
  }

  const parsedDate = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'adult';
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const monthDifference = today.getMonth() - parsedDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < parsedDate.getDate())) {
    age -= 1;
  }

  return age >= 0 && age < 12 ? 'child' : 'adult';
};

const getToothIdFromStoredValue = (value?: string): string =>
  value?.trim() ? `teeth-${value.trim()}` : '';

const workTypeColors: Record<
  DentalLabWorkType,
  {
    fill: string;
    stroke: string;
    text: string;
  }
> = {
  [DentalLabWorkType.Crown]: {
    fill: '#E3F2FD',
    stroke: '#1E88E5',
    text: '#0D47A1',
  },
  [DentalLabWorkType.Bridge]: {
    fill: '#FFF3E0',
    stroke: '#FB8C00',
    text: '#E65100',
  },
  [DentalLabWorkType.Veneer]: {
    fill: '#E8F5E9',
    stroke: '#43A047',
    text: '#1B5E20',
  },
  [DentalLabWorkType.Inlay]: {
    fill: '#FCE4EC',
    stroke: '#D81B60',
    text: '#880E4F',
  },
  [DentalLabWorkType.Onlay]: {
    fill: '#FFF8E1',
    stroke: '#F9A825',
    text: '#F57F17',
  },
  [DentalLabWorkType.ImplantCrown]: {
    fill: '#E0F7FA',
    stroke: '#00838F',
    text: '#006064',
  },
  [DentalLabWorkType.PartialDenture]: {
    fill: '#F3E5F5',
    stroke: '#8E24AA',
    text: '#4A148C',
  },
  [DentalLabWorkType.CompleteDenture]: {
    fill: '#FBE9E7',
    stroke: '#F4511E',
    text: '#BF360C',
  },
  [DentalLabWorkType.OrthodonticAppliance]: {
    fill: '#E8EAF6',
    stroke: '#3949AB',
    text: '#1A237E',
  },
};

const getWorkTypeColors = (
  workType?: DentalLabWorkType
): {
  fill: string;
  stroke: string;
  text: string;
} =>
  (workType ? workTypeColors[workType] : undefined) || {
    fill: '#ECEFF1',
    stroke: '#78909C',
    text: '#37474F',
  };

const buildWorkTypeConditionGroups = (
  teeth: DentalLabCaseToothModel[],
  chartKind: DentalChartKind
): ToothConditionGroup[] =>
  DENTAL_LAB_WORK_TYPE_OPTIONS.map((workType) => {
    const selectedTeeth = teeth
      .filter((tooth) => tooth.workType === workType && tooth.toothNumber?.trim())
      .map((tooth) => getToothIdFromStoredValue(tooth.toothNumber))
      .filter(Boolean) as string[];

    if (selectedTeeth.length === 0) {
      return undefined;
    }

    const colors = getWorkTypeColors(workType);
    return {
      label: getDentalLabWorkTypeLabel(workType),
      teeth: selectedTeeth,
      fillColor: colors.fill,
      outlineColor: colors.stroke,
    };
  }).filter(Boolean) as ToothConditionGroup[];

const getToothLabelFromStoredValue = (
  toothValue: string | undefined,
  chartKind: DentalChartKind
): string => {
  if (!toothValue?.trim()) {
    return '--';
  }

  const toothId = getToothIdFromStoredValue(toothValue);
  const chartNumber = getToothNumberFromToothId(toothId, chartKind);
  return chartNumber ? getToothDisplayLabel(chartNumber, chartKind) : `Tooth ${toothValue}`;
};

const DentalLabCaseReportPreview: FunctionComponent<DentalLabCaseReportPreviewProps> = (
  props: DentalLabCaseReportPreviewProps
): JSX.Element => {
  const { item, reportRef } = props;
  const chartKind = useMemo(() => resolveChartKind(item.patientBirthDate), [item.patientBirthDate]);
  const sortedTeeth = useMemo(
    () =>
      [...(item.teeth || [])].sort((left, right) =>
        String(left.toothNumber || '').localeCompare(String(right.toothNumber || ''), undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      ),
    [item.teeth]
  );
  const selectedToothIds = useMemo(
    () => sortedTeeth.map((tooth) => getToothIdFromStoredValue(tooth.toothNumber)).filter(Boolean),
    [sortedTeeth]
  );
  const workTypeConditionGroups = useMemo(
    () => buildWorkTypeConditionGroups(sortedTeeth, chartKind),
    [chartKind, sortedTeeth]
  );
  const generatedDate = useMemo(() => formatDisplayDate(new Date()), []);
  const presentWorkTypes = useMemo(
    () =>
      DENTAL_LAB_WORK_TYPE_OPTIONS.filter((option) =>
        sortedTeeth.some((tooth) => tooth.workType === option)
      ),
    [sortedTeeth]
  );

  return (
    <div style={mountStyle} aria-hidden="true">
      <div ref={reportRef} style={reportStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Dental Lab Summary</p>
            <h2 style={titleStyle}>Dental Lab Case Report</h2>
            <p style={subtitleStyle}>
              Printable case summary with selected teeth, work details, and the odontogram reference
              used by the clinic.
            </p>
          </div>
          <div style={metaGridStyle}>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Patient</span>
              <strong style={metaValueStyle}>{buildPatientName(item)}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Patient No.</span>
              <strong style={metaValueStyle}>{item.patientNumber?.trim() || '--'}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Case Number</span>
              <strong style={metaValueStyle}>{item.caseNumber?.trim() || '--'}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Lab Provider</span>
              <strong style={metaValueStyle}>{item.labProviderName?.trim() || '--'}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Status</span>
              <strong style={metaValueStyle}>{getDentalLabCaseStatusLabel(item.status)}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Assigned Dentist</span>
              <strong style={metaValueStyle}>{item.assignedDentistLabel?.trim() || '--'}</strong>
            </div>
            <div style={metaCardStyle}>
              <span style={metaLabelStyle}>Generated</span>
              <strong style={metaValueStyle}>{generatedDate}</strong>
            </div>
          </div>
        </div>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Selected Teeth</span>
            <strong style={summaryValueStyle}>{sortedTeeth.length}</strong>
          </div>
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Work Types</span>
            <strong style={summaryValueStyle}>{presentWorkTypes.length}</strong>
          </div>
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Reference Images</span>
            <strong style={summaryValueStyle}>{item.attachments?.length || 0}</strong>
          </div>
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Balance</span>
            <strong style={summaryValueStyle}>
              {formatCurrency(
                (item.totalCost || 0) - (item.discount || 0) - (item.paidAmount || 0)
              )}
            </strong>
          </div>
        </div>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Case Timeline</h3>
            <span style={sectionMetaStyle}>
              Sent {formatDisplayDate(item.dateSent)} | Due {formatDisplayDate(item.dateDue)}
            </span>
          </div>
          <div style={summaryGridStyle}>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Date Sent</span>
              <strong style={summaryValueStyle}>{formatDisplayDate(item.dateSent)}</strong>
            </div>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Due Date</span>
              <strong style={summaryValueStyle}>{formatDisplayDate(item.dateDue)}</strong>
            </div>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Date Received</span>
              <strong style={summaryValueStyle}>{formatDisplayDate(item.dateReceived)}</strong>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Payment Summary</h3>
            <span style={sectionMetaStyle}>Cost tracking for this lab case</span>
          </div>
          <div style={summaryGridStyle}>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Total Cost</span>
              <strong style={summaryValueStyle}>{formatCurrency(item.totalCost)}</strong>
            </div>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Discount</span>
              <strong style={summaryValueStyle}>{formatCurrency(item.discount)}</strong>
            </div>
            <div style={summaryCardStyle}>
              <span style={summaryLabelStyle}>Paid Amount</span>
              <strong style={summaryValueStyle}>{formatCurrency(item.paidAmount)}</strong>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Odontogram Reference</h3>
            <span style={sectionMetaStyle}>
              {chartKind === 'child' ? 'Primary chart' : 'Adult chart'} with work-type colors
            </span>
          </div>
          <div style={chartShellStyle}>
            <Odontogram
              notation="Universal"
              layout="circle"
              showHalf="full"
              showLabels
              readOnly
              teethConditions={workTypeConditionGroups}
              maxTeeth={getDentalChartMaxTeeth(chartKind)}
              defaultSelected={selectedToothIds}
              showTooltip={false}
              styles={{ width: chartKind === 'child' ? 420 : 560 }}
            />
          </div>
          {presentWorkTypes.length ? (
            <div style={legendWrapStyle}>
              {presentWorkTypes.map((workType) => {
                const colors = getWorkTypeColors(workType);
                return (
                  <div
                    key={`pdf-legend-${workType}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderRadius: 999,
                      border: `1px solid ${colors.stroke}`,
                      backgroundColor: colors.fill,
                      color: colors.text,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {getDentalLabWorkTypeLabel(workType)}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Tooth Work Summary</h3>
            <span style={sectionMetaStyle}>Material, shade, surfaces, and technician notes</span>
          </div>

          {sortedTeeth.length ? (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={headCellStyle}>Tooth</th>
                    <th style={headCellStyle}>Work Type</th>
                    <th style={headCellStyle}>Material</th>
                    <th style={headCellStyle}>Shade</th>
                    <th style={headCellStyle}>Surfaces</th>
                    <th style={headCellStyle}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeeth.map((tooth, index) => (
                    <tr key={`lab-case-pdf-row-${tooth.toothNumber || index}`}>
                      <td style={cellStyle}>
                        {getToothLabelFromStoredValue(tooth.toothNumber, chartKind)}
                      </td>
                      <td style={cellStyle}>{getDentalLabWorkTypeLabel(tooth.workType)}</td>
                      <td style={cellStyle}>{tooth.material?.trim() || '--'}</td>
                      <td style={cellStyle}>{tooth.shade?.trim() || '--'}</td>
                      <td style={cellStyle}>
                        {tooth.surfaces?.length
                          ? tooth.surfaces
                              .map((surface) => surface.surface?.trim())
                              .filter(Boolean)
                              .join(', ')
                          : '--'}
                      </td>
                      <td style={cellStyle}>{tooth.remarks?.trim() || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={notesCardStyle}>No teeth have been selected for this lab case.</div>
          )}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Case Notes</h3>
            <span style={sectionMetaStyle}>Clinic instructions and remarks</span>
          </div>
          <div style={notesCardStyle}>{item.notes?.trim() || 'No case notes added.'}</div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h3 style={sectionTitleStyle}>Reference Images</h3>
            <span style={sectionMetaStyle}>
              {item.attachments?.length || 0} file{item.attachments?.length === 1 ? '' : 's'}
            </span>
          </div>
          <div style={notesCardStyle}>
            {item.attachments?.length
              ? item.attachments
                  .map(
                    (attachment) => attachment.originalFileName || attachment.fileName || 'Image'
                  )
                  .join('\n')
              : 'No reference images uploaded.'}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DentalLabCaseReportPreview;
