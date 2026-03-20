import { ChangeEvent, FunctionComponent, JSX, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import DatasetLinkedRoundedIcon from '@mui/icons-material/DatasetLinkedRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  DataConverterColumnMapping,
  DataConverterPreviewRow,
  DataConverterTargetField,
} from '../data-converter/api/types';
import styles from '../style.scss.module.scss';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];
const PREVIEW_ROW_LIMIT = 5;

const targetFieldOptions: Array<{
  field: DataConverterTargetField;
  label: string;
  helper: string;
}> = [
  {
    field: 'SplitPatientName',
    label: 'Patient Name Split',
    helper: 'Splits `LastName, FirstName Middle` into separate name fields',
  },
  { field: 'FirstName', label: 'First Name', helper: 'Required text' },
  { field: 'LastName', label: 'Last Name', helper: 'Required text' },
  { field: 'MiddleName', label: 'Middle Name', helper: 'Optional text' },
  { field: 'EmailAddress', label: 'Email Address', helper: 'Optional email' },
  { field: 'BirthDate', label: 'Birth Date', helper: 'YYYY-MM-DD or Excel date' },
  { field: 'ContactNumber', label: 'Contact Number', helper: 'Optional text' },
  { field: 'Address', label: 'Address', helper: 'Optional text' },
  { field: 'Suffix', label: 'Suffix', helper: 'Enum value' },
  { field: 'Occupation', label: 'Occupation', helper: 'Optional text' },
  { field: 'Religion', label: 'Religion', helper: 'Optional text' },
  { field: 'BloodType', label: 'Blood Type', helper: 'Enum value' },
  { field: 'CivilStatus', label: 'Civil Status', helper: 'Enum value' },
];

const requiredTargetFields: DataConverterTargetField[] = ['FirstName', 'LastName'];
const csvEscape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
const suffixTokens = new Set(['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V']);

const normalizeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const normalizeCombinedPatientName = (value: string): string =>
  value.replace(/^\([^)]*\)\s*/, '').trim();

const splitCombinedPatientName = (
  rawValue: string
): {
  firstName: string;
  lastName: string;
  middleName: string;
} => {
  const normalizedValue = normalizeCombinedPatientName(rawValue);

  if (!normalizedValue) {
    return {
      firstName: '',
      lastName: '',
      middleName: '',
    };
  }

  if (normalizedValue.includes(',')) {
    const [lastNamePart, remainingPart = ''] = normalizedValue.split(',', 2);
    const remainingTokens = remainingPart.trim().split(/\s+/).filter(Boolean);

    const filteredTokens =
      remainingTokens.length > 1 &&
      suffixTokens.has(remainingTokens[remainingTokens.length - 1].toUpperCase())
        ? remainingTokens.slice(0, -1)
        : remainingTokens;

    return {
      lastName: lastNamePart.trim(),
      firstName: filteredTokens[0] || '',
      middleName: filteredTokens.slice(1).join(' '),
    };
  }

  const tokens = normalizedValue.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return {
      firstName: tokens[0],
      lastName: '',
      middleName: '',
    };
  }

  const filteredTokens =
    tokens.length > 2 && suffixTokens.has(tokens[tokens.length - 1].toUpperCase())
      ? tokens.slice(0, -1)
      : tokens;

  return {
    firstName: filteredTokens[0] || '',
    lastName: filteredTokens[filteredTokens.length - 1] || '',
    middleName: filteredTokens.slice(1, -1).join(' '),
  };
};

const parseWorkbookPreview = async (
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

const downloadConvertedCsv = (
  fileName: string,
  rows: DataConverterPreviewRow[],
  mappings: DataConverterColumnMapping[]
): void => {
  const activeMappings = mappings.filter((item) => item.targetField);
  const hasSplitPatientName = activeMappings.some(
    (item) => item.targetField === 'SplitPatientName'
  );
  const orderedHeaders = [
    ...(hasSplitPatientName ? ['FirstName', 'LastName', 'MiddleName'] : []),
    ...activeMappings
      .filter((item) => item.targetField !== 'SplitPatientName')
      .map((item) => item.targetField as string),
  ].filter((header, index, array) => array.indexOf(header) === index);

  const remappedRows = rows.map((row) => {
    const nextRow: Record<string, string> = {};

    activeMappings.forEach((mapping) => {
      if (mapping.targetField === 'SplitPatientName') {
        const splitName = splitCombinedPatientName(row[mapping.sourceHeader] || '');
        nextRow.FirstName = splitName.firstName;
        nextRow.LastName = splitName.lastName;
        nextRow.MiddleName = splitName.middleName;
        return;
      }

      nextRow[mapping.targetField as string] = row[mapping.sourceHeader] || '';
    });

    return nextRow;
  });

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

const PatientInfoDataConverter: FunctionComponent = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<DataConverterColumnMapping[]>([]);
  const [allRows, setAllRows] = useState<DataConverterPreviewRow[]>([]);
  const [previewRows, setPreviewRows] = useState<DataConverterPreviewRow[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedTargetFields = useMemo(
    () => mappings.map((item) => item.targetField).filter(Boolean),
    [mappings]
  );

  const missingRequiredFields = useMemo(() => {
    const hasSplitPatientName = selectedTargetFields.includes('SplitPatientName');

    if (hasSplitPatientName) {
      return [];
    }

    return requiredTargetFields.filter((field) => !selectedTargetFields.includes(field));
  }, [selectedTargetFields]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const normalizedName = file.name.toLowerCase();
    const isValidFile = ACCEPTED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));

    if (!isValidFile) {
      setErrorMessage('Only .xlsx and .csv files are allowed.');
      return;
    }

    try {
      const preview = await parseWorkbookPreview(file);
      setSelectedFile(file);
      setMappings(preview.headers.map((header) => ({ sourceHeader: header, targetField: '' })));
      setAllRows(preview.rows);
      setPreviewRows(preview.previewRows);
      setErrorMessage('');
      setStatusMessage('');
      setIsDialogOpen(true);
    } catch (error) {
      setSelectedFile(null);
      setMappings([]);
      setAllRows([]);
      setPreviewRows([]);
      setIsDialogOpen(false);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to read the file.');
    }
  };

  const handleMappingChange = (sourceHeader: string, event: SelectChangeEvent<string>): void => {
    const nextTargetField = event.target.value as DataConverterTargetField | '';

    setMappings((prev) =>
      prev.map((item) =>
        item.sourceHeader === sourceHeader ? { ...item, targetField: nextTargetField } : item
      )
    );
  };

  const handleDeleteColumn = (sourceHeader: string): void => {
    setMappings((prev) => prev.filter((item) => item.sourceHeader !== sourceHeader));
    setAllRows((prev) =>
      prev.map((row) => {
        const nextRow = { ...row };
        delete nextRow[sourceHeader];
        return nextRow;
      })
    );
    setPreviewRows((prev) =>
      prev.map((row) => {
        const nextRow = { ...row };
        delete nextRow[sourceHeader];
        return nextRow;
      })
    );
  };

  const handleCloseDialog = (): void => {
    setIsDialogOpen(false);
  };

  const handleDownload = (): void => {
    if (!selectedFile) {
      setErrorMessage('Select a file first.');
      return;
    }

    if (missingRequiredFields.length) {
      setErrorMessage(
        `Map the required patient fields first: ${missingRequiredFields.join(', ')}.`
      );
      return;
    }

    const duplicateTargets = mappings
      .filter((item) => item.targetField)
      .map((item) => item.targetField)
      .filter((field, index, array) => array.indexOf(field) !== index);

    if (duplicateTargets.length) {
      setErrorMessage(
        `Each patient field can only be mapped once. Duplicate: ${duplicateTargets[0]}.`
      );
      return;
    }

    setErrorMessage('');
    downloadConvertedCsv(selectedFile.name, allRows, mappings);
    setStatusMessage('Converted CSV downloaded successfully.');
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={styles.converterSurface}>
        <section className={styles.converterHeroCard}>
          <div>
            <h4 className={styles.converterHeroTitle}>Import And Align Patient Data</h4>
            <p className={styles.converterHeroText}>
              Upload a CSV or XLSX file, review its columns in a modal, map each source column to
              the correct `PatientInfos` field, remove columns you do not want, then download the
              converted CSV locally.
            </p>
          </div>
          <Button component="label" variant="contained" startIcon={<CloudUploadOutlinedIcon />}>
            Upload CSV / XLSX
            <input hidden type="file" accept=".xlsx,.csv,text/csv" onChange={handleFileChange} />
          </Button>
        </section>

        <section className={styles.converterFieldPanel}>
          <div className={styles.formPanelHeader}>
            <div className={styles.formPanelIcon} aria-hidden="true">
              <DatasetLinkedRoundedIcon />
            </div>
            <div>
              <h3 className={styles.formPanelTitle}>PatientInfo Target Fields</h3>
              <p className={styles.formPanelDescription}>
                These are the system fields available for mapping from the uploaded clinic file.
              </p>
            </div>
          </div>

          <Grid container spacing={1.5}>
            {targetFieldOptions.map((item) => (
              <Grid key={item.field} size={{ xs: 12, sm: 6, xl: 4 }}>
                <Box className={styles.converterTargetFieldCard}>
                  <Typography className={styles.converterTargetFieldTitle}>{item.label}</Typography>
                  <Typography className={styles.converterTargetFieldMeta}>{item.helper}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </section>

        {statusMessage ? <Alert severity="success">{statusMessage}</Alert> : null}
        {errorMessage && !isDialogOpen ? <Alert severity="warning">{errorMessage}</Alert> : null}
      </div>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#16324f' }}>
          Map Uploaded Columns To PatientInfo
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedFile ? (
              <Alert severity="info">
                File: <strong>{selectedFile.name}</strong>
              </Alert>
            ) : null}

            {missingRequiredFields.length ? (
              <Alert severity="warning">
                Required fields still missing: {missingRequiredFields.join(', ')}
              </Alert>
            ) : (
              <Alert severity="success">
                Required patient fields are mapped. You can proceed with CSV download.
              </Alert>
            )}

            <Box className={styles.converterMappingGrid}>
              {mappings.map((mapping) => (
                <Box key={mapping.sourceHeader} className={styles.converterMappingCard}>
                  <Box className={styles.converterMappingHeader}>
                    <div>
                      <Typography className={styles.converterMappingSourceTitle}>
                        {mapping.sourceHeader}
                      </Typography>
                      <Typography className={styles.converterMappingSourceMeta}>
                        Uploaded column
                      </Typography>
                    </div>
                    <Button
                      type="button"
                      color="inherit"
                      size="small"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={() => handleDeleteColumn(mapping.sourceHeader)}
                    >
                      Delete
                    </Button>
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Map To</InputLabel>
                    <Select
                      value={mapping.targetField}
                      label="Map To"
                      onChange={(event) => handleMappingChange(mapping.sourceHeader, event)}
                    >
                      <MenuItem value="">Ignore This Column</MenuItem>
                      {targetFieldOptions.map((item) => (
                        <MenuItem
                          key={item.field}
                          value={item.field}
                          disabled={
                            Boolean(item.field !== mapping.targetField) &&
                            selectedTargetFields.includes(item.field)
                          }
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box className={styles.converterPreviewList}>
                    {previewRows.length ? (
                      previewRows.map((row, index) => (
                        <Chip
                          key={`${mapping.sourceHeader}-${index}`}
                          label={row[mapping.sourceHeader] || '--'}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography className={styles.converterMappingSourceMeta}>
                        No sample rows
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            {previewRows.length ? (
              <Box className={styles.converterPreviewTableWrapper}>
                <Typography className={styles.converterPreviewTitle}>
                  Preview Rows From Uploaded File
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {mappings.map((mapping) => (
                        <TableCell key={mapping.sourceHeader}>{mapping.sourceHeader}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((row, rowIndex) => (
                      <TableRow key={`preview-row-${rowIndex}`}>
                        {mappings.map((mapping) => (
                          <TableCell key={`${mapping.sourceHeader}-${rowIndex}`}>
                            {row[mapping.sourceHeader] || '--'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : null}

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDownload}>
            Download Converted CSV
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PatientInfoDataConverter;
