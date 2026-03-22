import * as XLSX from 'xlsx';
import { DataConverterColumnMapping, DataConverterPreviewRow } from './types';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];
const PREVIEW_ROW_LIMIT = 5;

export type ActiveDataConverterColumnMapping<TField extends string> = DataConverterColumnMapping<TField> & {
  targetField: TField;
};

const csvEscape = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const normalizeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

export const isSupportedConverterFile = (file: File): boolean => {
  const normalizedName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

export const parseWorkbookPreview = async (
  file: File
): Promise<{
  headers: string[];
  rows: DataConverterPreviewRow[];
  previewRows: DataConverterPreviewRow[];
}> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheetName = workbook.SheetNames[0];

  if (!worksheetName) {
    throw new Error('The uploaded file does not contain any worksheet data.');
  }

  const worksheet = workbook.Sheets[worksheetName];
  const sheetRows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (!sheetRows.length) {
    throw new Error('The uploaded file is empty.');
  }

  const headers = (sheetRows[0] || [])
    .map((value) => normalizeCellValue(value))
    .filter((value) => value !== '');

  if (!headers.length) {
    throw new Error('The uploaded file does not contain any header row.');
  }

  const rows = sheetRows.slice(1).map((row) => {
    const item: DataConverterPreviewRow = {};

    headers.forEach((header, index) => {
      item[header] = normalizeCellValue(row[index]);
    });

    return item;
  });

  const previewRows = rows.slice(0, PREVIEW_ROW_LIMIT);

  return { headers, rows, previewRows };
};

type DownloadConvertedCsvOptions<TField extends string> = {
  fileName: string;
  rows: DataConverterPreviewRow[];
  mappings: DataConverterColumnMapping<TField>[];
  buildHeaders: (activeMappings: ActiveDataConverterColumnMapping<TField>[]) => string[];
  buildRow: (
    row: DataConverterPreviewRow,
    activeMappings: ActiveDataConverterColumnMapping<TField>[]
  ) => Record<string, string>;
};

export const downloadConvertedCsv = <TField extends string>({
  fileName,
  rows,
  mappings,
  buildHeaders,
  buildRow,
}: DownloadConvertedCsvOptions<TField>): void => {
  const activeMappings = mappings.filter(
    (item): item is ActiveDataConverterColumnMapping<TField> => Boolean(item.targetField)
  );
  const orderedHeaders = buildHeaders(activeMappings);
  const remappedRows = rows.map((row) => buildRow(row, activeMappings));
  const csvLines = [
    orderedHeaders.map(csvEscape).join(','),
    ...remappedRows.map((row) =>
      orderedHeaders.map((header) => csvEscape(row[header] || '')).join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const normalizedName = fileName.replace(/\.[^/.]+$/, '');

  link.href = url;
  link.download = `${normalizedName}-converted.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
