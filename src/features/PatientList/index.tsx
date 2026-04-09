import { FunctionComponent, JSX, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { GetPatients } from '../patient/api/api';
import { PatientModel } from '../patient/api/types';
import HighlightText from '../../common/components/Highlight';
import { useAuthStore } from '../../common/store/authStore';

type PatientListProps = {
  clinicId?: string | null;
  selectedPatientId?: string;
  selectedPatientName?: string;
  onSelect: (patient: PatientModel) => void;
  onClearSelection?: () => void;
  error?: boolean;
  helperText?: string;
};

const buildPatientName = (patient?: PatientModel): string => {
  if (!patient) {
    return '';
  }

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

export const PatientList: FunctionComponent<PatientListProps> = (props): JSX.Element => {
  const {
    clinicId,
    selectedPatientId,
    selectedPatientName,
    onSelect,
    onClearSelection,
    error,
    helperText,
  } = props;
  const activeBranchId = useAuthStore((store) => store.branchId);
  const [items, setItems] = useState<PatientModel[]>([]);
  const [query, setQuery] = useState<string>(selectedPatientName || '');
  const [load, setLoad] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const loadPatients = useCallback(
    async (forceRefresh: boolean = false): Promise<void> => {
      try {
        setLoad(true);
        setLoadError('');

        const response = await GetPatients(
          {
            load: true,
            items: [],
            openModal: false,
            isDelete: false,
            isUpdate: false,
            upload: false,
            search: '',
            initial: 0,
            pageStart: 0,
            pageEnd: 500,
            totalItem: 0,
          },
          clinicId,
          forceRefresh
        );

        setItems(response.items || []);
      } catch {
        setLoadError('Unable to load patient list.');
      } finally {
        setLoad(false);
      }
    },
    [clinicId]
  );

  useEffect(() => {
    setQuery(selectedPatientName || '');
  }, [selectedPatientName]);

  useEffect(() => {
    void loadPatients();
  }, [activeBranchId, loadPatients]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return items
      .filter((item) =>
        [item.patientNumber, item.firstName, item.lastName, item.middleName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      )
      .slice(0, 8);
  }, [items, query]);

  const selectedLabel =
    selectedPatientName ||
    buildPatientName(items.find((item) => String(item.id) === String(selectedPatientId)));
  const hasSearchQuery = query.trim().length > 0;
  const hasSelectedPatient = Boolean(String(selectedPatientId ?? '').trim() || selectedLabel);

  return (
    <Box>
      <TextField
        label="Patient"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;

          setQuery(nextQuery);

          if (
            (selectedPatientId || selectedPatientName) &&
            nextQuery !== (selectedPatientName || '')
          ) {
            onClearSelection?.();
          }
        }}
        fullWidth
        size="small"
        required
        error={error}
        helperText={helperText}
        placeholder="Search patient by name or patient number"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                onClick={() => {
                  void loadPatients(true);
                }}
                disabled={load}
                aria-label="Reload patient list"
                title="Reload patient list"
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 124, 192, 0.28)',
                  background:
                    'linear-gradient(180deg, rgba(50, 123, 196, 0.16), rgba(29, 111, 182, 0.26))',
                  color: '#1d6fb6',
                  boxShadow: '0 8px 16px rgba(39, 92, 145, 0.16)',
                  transition: 'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease',
                  '&:hover': {
                    background:
                      'linear-gradient(180deg, rgba(50, 123, 196, 0.22), rgba(29, 111, 182, 0.34))',
                    boxShadow: '0 10px 18px rgba(39, 92, 145, 0.22)',
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-disabled': {
                    color: '#1d6fb6',
                    opacity: 0.72,
                  },
                }}
              >
                {load ? <CircularProgress size={18} /> : <RefreshRoundedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {selectedLabel ? (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Selected patient: {selectedLabel}
        </Typography>
      ) : null}
      {loadError ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {loadError}
        </Alert>
      ) : null}
      <Paper
        variant="outlined"
        sx={{
          mt: 1.5,
          borderRadius: 2,
          borderColor: error ? 'error.light' : 'divider',
          display: !load && filteredItems.length === 0 && hasSelectedPatient ? 'none' : undefined,
        }}
      >
        {load && hasSearchQuery ? (
          <Box
            sx={{
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : hasSearchQuery && filteredItems.length > 0 ? (
          <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
            <List disablePadding>
              {filteredItems.map((item) => {
                const label = buildPatientName(item);
                const isSelected = String(item.id) === String(selectedPatientId);

                return (
                  <ListItemButton
                    key={item.id ?? item.patientNumber ?? label}
                    selected={isSelected}
                    onClick={() => onSelect(item)}
                    divider
                  >
                    <ListItemText
                      primary={<HighlightText text={label || '--'} query={query} />}
                      secondary={
                        <HighlightText
                          text={item.patientNumber || item.contactNumber || '--'}
                          query={query}
                        />
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, color: '#214868' }}>
              {hasSearchQuery ? 'No patient matched your search.' : 'Create a patient first.'}
            </Typography>
            <Typography sx={{ mt: 0.5, mb: 1.5, color: 'text.secondary' }}>
              {hasSearchQuery
                ? 'Create a new patient record first, then return here to assign the appointment.'
                : 'Search to show matching patients, or create a new patient record in a separate tab.'}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<PersonAddAlt1OutlinedIcon />}
              onClick={() => window.open('/patient', '_blank', 'noopener,noreferrer')}
            >
              Create New Patient
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PatientList;
