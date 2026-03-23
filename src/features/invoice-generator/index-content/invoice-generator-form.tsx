import { FunctionComponent, JSX } from 'react';
import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';

import PatientList from '../../PatientList';
import type { PatientModel } from '../../patient/api/types';
import FormatCurrency from '../../../common/helpers/formatCurrency';
import type { InvoiceGeneratorFormProps } from '../api/types';
import styles from '../style.scss.module.scss';

const formatPatientName = (patient: PatientModel): string => {
  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (lastName && givenNames) {
    return `${lastName}, ${givenNames}`;
  }

  return lastName || givenNames || patient.patientNumber || '';
};

const InvoiceGeneratorForm: FunctionComponent<InvoiceGeneratorFormProps> = (
  props: InvoiceGeneratorFormProps
): JSX.Element => {
  const { state, setState, clinicId, summary } = props;

  return (
    <div className={styles.invoiceFilterCard}>
      <div className={styles.invoiceFilterHeader}>
        <Typography className={styles.invoiceSectionTitle}>Invoice Filters</Typography>
        <Typography className={styles.invoiceSectionText}>
          Choose one patient and one treatment date to load the matching progress notes.
        </Typography>
      </div>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PatientList
          clinicId={clinicId}
          selectedPatientId={state.selectedPatientId}
          selectedPatientName={state.selectedPatientName}
          helperText="Search and choose the patient for this invoice."
          onSelect={(patient: PatientModel) => {
            setState((prevState) => ({
              ...prevState,
              selectedPatientId: String(patient.id ?? ''),
              selectedPatientName: formatPatientName(patient),
              pageStart: 0,
              openModal: false,
            }));
          }}
          onClearSelection={() => {
            setState((prevState) => ({
              ...prevState,
              selectedPatientId: '',
              selectedPatientName: '',
              pageStart: 0,
              openModal: false,
            }));
          }}
        />

        <TextField
          label="Treatment Date"
          type="date"
          value={state.filterDate ?? ''}
          onChange={(event) => {
            const nextDate = event.target.value;

            setState((prevState) => ({
              ...prevState,
              filterDate: nextDate,
              pageStart: 0,
              openModal: false,
            }));
          }}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
          helperText="Only progress notes recorded on this date will be shown."
        />

        <Button
          type="button"
          variant="outlined"
          color="inherit"
          startIcon={<FilterAltOffRoundedIcon />}
          onClick={() => {
            setState((prevState) => ({
              ...prevState,
              selectedPatientId: '',
              selectedPatientName: '',
              filterDate: '',
              pageStart: 0,
              openModal: false,
            }));
          }}
          disabled={!state.selectedPatientId && !state.selectedPatientName && !state.filterDate}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
        >
          Clear Filters
        </Button>
      </Box>

      <div className={styles.invoiceSummaryGrid}>
        <div className={styles.invoiceSummaryTile}>
          <span className={styles.invoiceSummaryLabel}>Total Amount</span>
          <strong className={styles.invoiceSummaryValue}>
            <FormatCurrency value={summary.totalAmount} />
          </strong>
          <span className={styles.invoiceSummaryHint}>Combined total due</span>
        </div>
        <div className={styles.invoiceSummaryTile}>
          <span className={styles.invoiceSummaryLabel}>Paid Amount</span>
          <strong className={styles.invoiceSummaryValue}>
            <FormatCurrency value={summary.amountPaid} />
          </strong>
          <span className={styles.invoiceSummaryHint}>Payments already received</span>
        </div>
        <div className={styles.invoiceSummaryTile}>
          <span className={styles.invoiceSummaryLabel}>Balance</span>
          <strong className={styles.invoiceSummaryValue}>
            <FormatCurrency value={summary.balance} />
          </strong>
          <span className={styles.invoiceSummaryHint}>Remaining collectible amount</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneratorForm;
