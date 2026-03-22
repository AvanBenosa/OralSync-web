import { ChangeEvent, FunctionComponent, JSX, useMemo, useState } from 'react';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
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
  DataConverterFieldOption,
  DataConverterPreviewRow,
  PatientProgressNoteDataConverterTargetField,
} from '../data-converter/api/types';
import {
  downloadConvertedCsv,
  isSupportedConverterFile,
  parseWorkbookPreview,
} from '../data-converter/api/utils';
import styles from '../style.scss.module.scss';

const suffixTokens = new Set(['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV', 'V']);

const normalizeCombinedPatientName = (value: string): string =>
  value.replace(/^\([^)]*\)\s*/, '').trim();

const preferredExportHeaders = [
  'FirstName',
  'LastName',
  'MiddleName',
  'Date',
  'Category',
  'Procedure',
  'Remarks',
  'AssignedDoctor',
  'Amount',
  'Discount',
  'AmountPaid',
  'TotalAmountDue',
  'Balance',
];

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

const targetFieldOptions: DataConverterFieldOption<PatientProgressNoteDataConverterTargetField>[] =
  [
    {
      field: 'SplitPatientName',
      label: 'Patient Name Split',
      helper: 'Splits `LastName, FirstName Middle` into separate name fields',
    },
    { field: 'AssignedDoctor', label: 'Assigned Doctor', helper: 'Dentist or doctor name' },
    { field: 'Date', label: 'Date', helper: 'Progress note date, YYYY-MM-DD or Excel date' },
    { field: 'Procedure', label: 'Procedure', helper: 'Treatment or procedure name' },
    { field: 'Category', label: 'Category', helper: 'Procedure category or grouping' },
    { field: 'Remarks', label: 'Remarks', helper: 'General note remarks' },
    {
      field: 'ClinicalFinding',
      label: 'Clinical Finding',
      helper: 'Observed clinical findings for the note',
    },
    { field: 'Assessment', label: 'Assessment', helper: 'Assessment or diagnosis summary' },
    {
      field: 'ToothNumber',
      label: 'Tooth Number',
      helper: 'Tooth identifier for the progress note entry',
    },
    { field: 'NextVisit', label: 'Next Visit', helper: 'Follow-up date for the treatment plan' },
    { field: 'Account', label: 'Account', helper: 'Payment account or mode' },
    { field: 'Amount', label: 'Amount', helper: 'Base treatment amount' },
    { field: 'Discount', label: 'Discount', helper: 'Discount amount' },
    {
      field: 'TotalAmountDue',
      label: 'Total Amount Due',
      helper: 'Total amount due from the uploaded data',
    },
    { field: 'AmountPaid', label: 'Amount Paid', helper: 'Amount already paid' },
    {
      field: 'Balance',
      label: 'Balance',
      helper: 'Balance value from the uploaded data',
    },
  ];

const requiredTargetFields: PatientProgressNoteDataConverterTargetField[] = [];

const PatientProgressNoteDataConverter: FunctionComponent = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<
    DataConverterColumnMapping<PatientProgressNoteDataConverterTargetField>[]
  >([]);
  const [allRows, setAllRows] = useState<DataConverterPreviewRow[]>([]);
  const [previewRows, setPreviewRows] = useState<DataConverterPreviewRow[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedTargetFields = useMemo(
    () =>
      mappings
        .map((item) => item.targetField)
        .filter((targetField): targetField is PatientProgressNoteDataConverterTargetField =>
          Boolean(targetField)
        ),
    [mappings]
  );

  const missingRequiredFields = useMemo(
    () => requiredTargetFields.filter((field) => !selectedTargetFields.includes(field)),
    [selectedTargetFields]
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isSupportedConverterFile(file)) {
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
    const nextTargetField = event.target.value as PatientProgressNoteDataConverterTargetField | '';

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
        `Map the required progress note fields first: ${missingRequiredFields.join(', ')}.`
      );
      return;
    }

    const duplicateTargets = mappings
      .filter((item) => item.targetField)
      .map((item) => item.targetField)
      .filter((field, index, array) => array.indexOf(field) !== index);

    if (duplicateTargets.length) {
      setErrorMessage(
        `Each progress note field can only be mapped once. Duplicate: ${duplicateTargets[0]}.`
      );
      return;
    }

    setErrorMessage('');
    downloadConvertedCsv({
      fileName: selectedFile.name,
      rows: allRows,
      mappings,
      buildHeaders: (activeMappings) => {
        const hasSplitPatientName = activeMappings.some(
          (item) => item.targetField === 'SplitPatientName'
        );
        const mappedHeaders = [
          ...(hasSplitPatientName ? ['FirstName', 'LastName', 'MiddleName'] : []),
          ...activeMappings
            .filter((item) => item.targetField !== 'SplitPatientName')
            .map((item) => item.targetField),
        ].filter((header, index, array) => array.indexOf(header) === index);

        return [
          ...preferredExportHeaders.filter((header) => mappedHeaders.includes(header)),
          ...mappedHeaders.filter((header) => !preferredExportHeaders.includes(header)),
        ].filter((header, index, array) => array.indexOf(header) === index);
      },
      buildRow: (row, activeMappings) => {
        const nextRow: Record<string, string> = {};

        activeMappings.forEach((mapping) => {
          if (mapping.targetField === 'SplitPatientName') {
            const splitName = splitCombinedPatientName(row[mapping.sourceHeader] || '');
            nextRow.FirstName = splitName.firstName;
            nextRow.LastName = splitName.lastName;
            nextRow.MiddleName = splitName.middleName;
            return;
          }

          nextRow[mapping.targetField] = row[mapping.sourceHeader] || '';
        });

        return nextRow;
      },
    });
    setStatusMessage('Converted CSV downloaded successfully.');
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={styles.converterSurface}>
        <section className={styles.converterHeroCard}>
          <div>
            <h4 className={styles.converterHeroTitle}>Import And Align Progress Note Data</h4>
            <p className={styles.converterHeroText}>
              Upload a CSV or XLSX file, map each source column to the correct
              `PatientProgressNotes` field, remove the columns you do not need, then download the
              converted CSV locally for review or future import.
            </p>
          </div>
          <Button component="label" variant="contained" startIcon={<CloudUploadOutlinedIcon />}>
            Upload CSV / XLSX
            <input hidden type="file" accept=".xlsx,.csv,text/csv" onChange={handleFileChange} />
          </Button>
        </section>

        <section className={styles.converterFieldPanel}>
          <Box className={styles.formPanelHeader}>
            <div className={styles.formPanelIcon} aria-hidden="true">
              <DescriptionRoundedIcon />
            </div>
            <div>
              <h3 className={styles.formPanelTitle}>PatientProgressNote Target Fields</h3>
              <p className={styles.formPanelDescription}>
                These are the `PatientProgressNote` fields from your database that the uploaded
                clinic file can be mapped to.
              </p>
            </div>
          </Box>

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
          Map Uploaded Columns To PatientProgressNote
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
            ) : requiredTargetFields.length ? (
              <Alert severity="success">
                Required progress note fields are mapped. You can proceed with CSV download.
              </Alert>
            ) : (
              <Alert severity="info">
                Map the progress note columns you want to keep, then download the converted CSV.
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

export default PatientProgressNoteDataConverter;
