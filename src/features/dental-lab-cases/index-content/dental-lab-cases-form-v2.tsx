import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import { Odontogram, ToothConditionGroup } from 'react-odontogram';

import { PatientModel } from '../../patient/api/types';
import PatientList from '../../PatientList';
import { GetClinicUsers } from '../../settings/create-user/api/api';
import { SettingsUserModel } from '../../settings/create-user/api/types';
import { GetLabProviders } from '../../settings/lab-provider/api/api';
import { LabProviderModel } from '../../settings/lab-provider/api/types';
import { RegisterUserRole } from '../../register/api/types';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../../common/services/api-client';
import {
  DentalChartKind,
  PRIMARY_TOOTH_NUMBER_TO_CHART_ID_MAP,
  UNIVERSAL_TO_FDI_MAP,
  getDentalChartMaxTeeth,
  getToothDisplayLabel,
  getToothNumberFromToothId,
} from '../../patient-profile-modules/dental-chart/api/types';
import { HandleCreateDentalLabCase, HandleUpdateDentalLabCase } from '../api/handlers';
import { UploadDentalLabCaseAttachment } from '../api/api';
import {
  DENTAL_LAB_CASE_STATUS_OPTIONS,
  DentalLabCaseAttachmentModel,
  DentalLabCaseModel,
  DentalLabCaseStateProps,
  DentalLabCaseStatus,
  DentalLabCaseToothModel,
  DentalLabWorkType,
  getDentalLabCaseStatusLabel,
  getDentalLabWorkTypeLabel,
} from '../api/types';
import styles from '../style.scss.module.scss';
import DentalLabCaseToothEditorDialog, {
  DentalLabCaseToothOption,
} from './dental-lab-case-tooth-editor-dialog';

type NumericFieldValue = number | '';

type DentalLabCaseFormValues = {
  id: string;
  caseNumber: string;
  patientInfoId: string;
  assignedDentistId: string;
  labProviderId: string;
  dateSent: string;
  dateDue: string;
  dateReceived: string;
  status: DentalLabCaseStatus;
  notes: string;
  totalCost: NumericFieldValue;
  discount: NumericFieldValue;
  paidAmount: NumericFieldValue;
  teeth: DentalLabCaseToothModel[];
  attachments: DentalLabCaseAttachmentModel[];
};

type SelectedPatientMeta = {
  label: string;
  birthDate?: string | Date;
};

type DentistOption = {
  id: string;
  label: string;
};

type ToothDialogState = {
  open: boolean;
  tooth?: DentalLabCaseToothModel;
  previousToothNumber?: string;
};

const toDateInputValue = (value?: string | Date): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const dateOnlyValue = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (dateOnlyValue) {
      return dateOnlyValue;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDatePayloadValue = (value?: string): string | undefined =>
  value?.trim() ? `${value}T00:00:00` : undefined;

const buildPatientName = (patient?: PatientModel | null): string => {
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

const buildDentistLabel = (item?: SettingsUserModel | null): string => {
  if (!item) {
    return '';
  }

  const displayName = [item.firstName, item.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (displayName) {
    return `Dr. ${displayName}`;
  }

  return item.userName || item.emailAddress || 'Unnamed dentist';
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

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < parsedDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 && age < 12 ? 'child' : 'adult';
};

const getToothIdFromStoredValue = (value?: string): string =>
  value?.trim() ? `teeth-${value.trim()}` : '';

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

const getChartOrderFromStoredValue = (
  toothValue: string | undefined,
  chartKind: DentalChartKind
): number => {
  const toothId = getToothIdFromStoredValue(toothValue);
  return getToothNumberFromToothId(toothId, chartKind) ?? Number.MAX_SAFE_INTEGER;
};

const sortTeethByChartOrder = (
  teeth: DentalLabCaseToothModel[],
  chartKind: DentalChartKind
): DentalLabCaseToothModel[] =>
  [...teeth].sort(
    (left, right) =>
      getChartOrderFromStoredValue(left.toothNumber, chartKind) -
      getChartOrderFromStoredValue(right.toothNumber, chartKind)
  );

const parseNumberInput = (value: string): NumericFieldValue => {
  if (!value.trim()) {
    return '';
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? '' : parsedValue;
};

const resolveNumericValue = (value: NumericFieldValue): number => (value === '' ? 0 : value);
const getNumericInitialValue = (value?: number): NumericFieldValue =>
  typeof value === 'number' ? value : '';

const getBalanceValue = (
  totalCost: NumericFieldValue,
  discount: NumericFieldValue,
  paidAmount: NumericFieldValue
): number =>
  resolveNumericValue(totalCost) - resolveNumericValue(discount) - resolveNumericValue(paidAmount);

const cloneToothModel = (tooth?: DentalLabCaseToothModel): DentalLabCaseToothModel => ({
  toothNumber: tooth?.toothNumber || '',
  workType: tooth?.workType || DentalLabWorkType.Crown,
  material: tooth?.material || '',
  shade: tooth?.shade || '',
  remarks: tooth?.remarks || '',
  surfaces: (tooth?.surfaces || []).map((surface) => ({
    surface: surface.surface || '',
  })),
});

const createInitialValues = (selectedItem?: DentalLabCaseModel): DentalLabCaseFormValues => ({
  id: selectedItem?.id || '',
  caseNumber: selectedItem?.caseNumber || '',
  patientInfoId: selectedItem?.patientInfoId || '',
  assignedDentistId: selectedItem?.assignedDentistId || '',
  labProviderId: selectedItem?.labProviderId || '',
  dateSent: toDateInputValue(selectedItem?.dateSent) || toDateInputValue(new Date()),
  dateDue: toDateInputValue(selectedItem?.dateDue),
  dateReceived: toDateInputValue(selectedItem?.dateReceived),
  status: selectedItem?.status || DentalLabCaseStatus.Pending,
  notes: selectedItem?.notes || '',
  totalCost: getNumericInitialValue(selectedItem?.totalCost),
  discount: getNumericInitialValue(selectedItem?.discount),
  paidAmount: getNumericInitialValue(selectedItem?.paidAmount),
  teeth: (selectedItem?.teeth || []).map((tooth) => cloneToothModel(tooth)),
  attachments: [...(selectedItem?.attachments || [])],
});

const createEmptyTooth = (toothNumber: string = ''): DentalLabCaseToothModel => ({
  toothNumber,
  workType: DentalLabWorkType.Crown,
  material: '',
  shade: '',
  remarks: '',
  surfaces: [],
});

const DENTAL_LAB_SHADE_OPTIONS = [
  'A1',
  'A2',
  'A3',
  'A3.5',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'C1',
  'C2',
  'C3',
  'C4',
  'D2',
  'D3',
  'D4',
  'BL1',
  'BL2',
  'BL3',
  'BL4',
];

const DENTAL_LAB_SHADE_COLORS: Record<
  string,
  {
    fill: string;
    stroke: string;
    text: string;
    soft: string;
  }
> = {
  A1: { fill: '#FBF5E6', stroke: '#CCB886', text: '#6C5730', soft: 'rgba(204, 184, 134, 0.12)' },
  A2: { fill: '#F7ECD4', stroke: '#C9AB72', text: '#6C5227', soft: 'rgba(201, 171, 114, 0.12)' },
  A3: { fill: '#EFDDBD', stroke: '#B9915A', text: '#63451D', soft: 'rgba(185, 145, 90, 0.12)' },
  'A3.5': { fill: '#E6CFAB', stroke: '#AA7F47', text: '#573B17', soft: 'rgba(170, 127, 71, 0.12)' },
  A4: { fill: '#D9C09A', stroke: '#976B36', text: '#4C3314', soft: 'rgba(151, 107, 54, 0.12)' },
  B1: { fill: '#FCF1CF', stroke: '#D1B45A', text: '#715917', soft: 'rgba(209, 180, 90, 0.12)' },
  B2: { fill: '#F6E2B2', stroke: '#C49C45', text: '#684C10', soft: 'rgba(196, 156, 69, 0.12)' },
  B3: { fill: '#ECCC91', stroke: '#AE8131', text: '#5A3C0B', soft: 'rgba(174, 129, 49, 0.12)' },
  B4: { fill: '#DDB066', stroke: '#94661C', text: '#4E3006', soft: 'rgba(148, 102, 28, 0.12)' },
  C1: { fill: '#EFE9DF', stroke: '#B8A690', text: '#5C5044', soft: 'rgba(184, 166, 144, 0.12)' },
  C2: { fill: '#E1D5C7', stroke: '#A38D74', text: '#514335', soft: 'rgba(163, 141, 116, 0.12)' },
  C3: { fill: '#D1BEA8', stroke: '#8B735A', text: '#433528', soft: 'rgba(139, 115, 90, 0.12)' },
  C4: { fill: '#B9A188', stroke: '#705942', text: '#35281E', soft: 'rgba(112, 89, 66, 0.12)' },
  D2: { fill: '#F1E3D7', stroke: '#B99174', text: '#654637', soft: 'rgba(185, 145, 116, 0.12)' },
  D3: { fill: '#E2CBB9', stroke: '#A67858', text: '#593723', soft: 'rgba(166, 120, 88, 0.12)' },
  D4: { fill: '#CFAD95', stroke: '#8F5C3E', text: '#492818', soft: 'rgba(143, 92, 62, 0.12)' },
  BL1: { fill: '#F8FCFF', stroke: '#A9CBE3', text: '#456579', soft: 'rgba(169, 203, 227, 0.12)' },
  BL2: { fill: '#EFF8FF', stroke: '#8FB9D8', text: '#385B73', soft: 'rgba(143, 185, 216, 0.12)' },
  BL3: { fill: '#E6F2FC', stroke: '#74A8CB', text: '#2C506C', soft: 'rgba(116, 168, 203, 0.12)' },
  BL4: { fill: '#D9EAF8', stroke: '#5D95BC', text: '#244661', soft: 'rgba(93, 149, 188, 0.12)' },
};

const DENTAL_LAB_WORK_TYPE_COLORS: Record<
  DentalLabWorkType,
  {
    fill: string;
    stroke: string;
    text: string;
    soft: string;
  }
> = {
  [DentalLabWorkType.Crown]: {
    fill: '#E3F2FD',
    stroke: '#1E88E5',
    text: '#0D47A1',
    soft: 'rgba(30, 136, 229, 0.08)',
  },
  [DentalLabWorkType.Bridge]: {
    fill: '#FFF3E0',
    stroke: '#FB8C00',
    text: '#E65100',
    soft: 'rgba(251, 140, 0, 0.08)',
  },
  [DentalLabWorkType.Veneer]: {
    fill: '#E8F5E9',
    stroke: '#43A047',
    text: '#1B5E20',
    soft: 'rgba(67, 160, 71, 0.08)',
  },
  [DentalLabWorkType.Inlay]: {
    fill: '#FCE4EC',
    stroke: '#D81B60',
    text: '#880E4F',
    soft: 'rgba(216, 27, 96, 0.08)',
  },
  [DentalLabWorkType.Onlay]: {
    fill: '#FFF8E1',
    stroke: '#F9A825',
    text: '#F57F17',
    soft: 'rgba(249, 168, 37, 0.08)',
  },
  [DentalLabWorkType.ImplantCrown]: {
    fill: '#E0F7FA',
    stroke: '#00838F',
    text: '#006064',
    soft: 'rgba(0, 131, 143, 0.08)',
  },
  [DentalLabWorkType.PartialDenture]: {
    fill: '#F3E5F5',
    stroke: '#8E24AA',
    text: '#4A148C',
    soft: 'rgba(142, 36, 170, 0.08)',
  },
  [DentalLabWorkType.CompleteDenture]: {
    fill: '#FBE9E7',
    stroke: '#F4511E',
    text: '#BF360C',
    soft: 'rgba(244, 81, 30, 0.08)',
  },
  [DentalLabWorkType.OrthodonticAppliance]: {
    fill: '#E8EAF6',
    stroke: '#3949AB',
    text: '#1A237E',
    soft: 'rgba(57, 73, 171, 0.08)',
  },
};

const getNormalizedShadeKey = (shade?: string): string => shade?.trim().toUpperCase() || 'NO_SHADE';

const getShadeColors = (
  shade?: string
): {
  fill: string;
  stroke: string;
  text: string;
  soft: string;
} =>
  DENTAL_LAB_SHADE_COLORS[getNormalizedShadeKey(shade)] || {
    fill: '#ECEFF1',
    stroke: '#90A4AE',
    text: '#455A64',
    soft: 'rgba(144, 164, 174, 0.12)',
  };

const getWorkTypeColors = (
  workType?: DentalLabWorkType
): {
  fill: string;
  stroke: string;
  text: string;
  soft: string;
} =>
  (workType && DENTAL_LAB_WORK_TYPE_COLORS[workType]) || {
    fill: '#ECEFF1',
    stroke: '#78909C',
    text: '#37474F',
    soft: 'rgba(120, 144, 156, 0.08)',
  };

const buildShadeConditionGroups = (
  teeth: DentalLabCaseToothModel[]
): ToothConditionGroup[] => {
  const groupedTeeth = teeth.reduce<Record<string, string[]>>((result, tooth) => {
    const toothId = getToothIdFromStoredValue(tooth.toothNumber);

    if (!toothId) {
      return result;
    }

    const shadeKey = getNormalizedShadeKey(tooth.shade);
    if (!result[shadeKey]) {
      result[shadeKey] = [];
    }

    result[shadeKey].push(toothId);
    return result;
  }, {});

  return Object.entries(groupedTeeth)
    .sort(([leftShade], [rightShade]) => {
      const leftIndex = [...DENTAL_LAB_SHADE_OPTIONS, 'NO_SHADE'].indexOf(leftShade);
      const rightIndex = [...DENTAL_LAB_SHADE_OPTIONS, 'NO_SHADE'].indexOf(rightShade);
      return leftIndex - rightIndex;
    })
    .map(([shadeKey, selectedTeeth]) => {
      const colors = getShadeColors(shadeKey);
      return {
        label: shadeKey === 'NO_SHADE' ? 'No Shade' : shadeKey,
        teeth: selectedTeeth,
        fillColor: colors.fill,
        outlineColor: colors.stroke,
      };
    });
};

const buildToothOptions = (chartKind: DentalChartKind): DentalLabCaseToothOption[] => {
  if (chartKind === 'child') {
    return Object.entries(PRIMARY_TOOTH_NUMBER_TO_CHART_ID_MAP)
      .map(([toothNumber, chartId]) => ({
        value: chartId.replace('teeth-', ''),
        label: getToothDisplayLabel(Number(toothNumber), chartKind),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  return Object.entries(UNIVERSAL_TO_FDI_MAP)
    .map(([toothNumber, fdi]) => ({
      value: fdi,
      label: getToothDisplayLabel(Number(toothNumber), chartKind),
    }))
    .sort((left, right) => {
      const leftNumber = getChartOrderFromStoredValue(left.value, chartKind);
      const rightNumber = getChartOrderFromStoredValue(right.value, chartKind);
      return leftNumber - rightNumber;
    });
};

const DentalLabCasesFormV2: FunctionComponent<DentalLabCaseStateProps> = (
  props: DentalLabCaseStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [labProviders, setLabProviders] = useState<LabProviderModel[]>([]);
  const [loadProviders, setLoadProviders] = useState<boolean>(true);
  const [providerLoadError, setProviderLoadError] = useState<string>('');
  const [dentists, setDentists] = useState<DentistOption[]>([]);
  const [loadDentists, setLoadDentists] = useState<boolean>(true);
  const [dentistLoadError, setDentistLoadError] = useState<string>('');
  const [selectedPatientMeta, setSelectedPatientMeta] = useState<SelectedPatientMeta>({
    label: state.selectedItem?.patientLabel || '',
    birthDate: state.selectedItem?.patientBirthDate,
  });
  const [imagePreviewMap, setImagePreviewMap] = useState<Record<string, string>>({});
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [toothDialogState, setToothDialogState] = useState<ToothDialogState>({
    open: false,
  });

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Dental Lab Case' : 'Add Dental Lab Case'),
    [state.isUpdate]
  );

  const chartKind = useMemo(
    () => resolveChartKind(selectedPatientMeta.birthDate),
    [selectedPatientMeta.birthDate]
  );

  const toothOptions = useMemo(() => buildToothOptions(chartKind), [chartKind]);

  const mergedLabProviders = useMemo(() => {
    if (
      state.selectedItem?.labProviderId &&
      state.selectedItem?.labProviderName &&
      !labProviders.some((item) => item.id === state.selectedItem?.labProviderId)
    ) {
      return [
        ...labProviders,
        {
          id: state.selectedItem.labProviderId,
          labName: state.selectedItem.labProviderName,
        },
      ];
    }

    return labProviders;
  }, [labProviders, state.selectedItem?.labProviderId, state.selectedItem?.labProviderName]);

  const mergedDentists = useMemo(() => {
    if (
      state.selectedItem?.assignedDentistId &&
      state.selectedItem?.assignedDentistLabel &&
      !dentists.some((item) => item.id === state.selectedItem?.assignedDentistId)
    ) {
      return [
        ...dentists,
        {
          id: state.selectedItem.assignedDentistId,
          label: state.selectedItem.assignedDentistLabel,
        },
      ];
    }

    return dentists;
  }, [
    dentists,
    state.selectedItem?.assignedDentistId,
    state.selectedItem?.assignedDentistLabel,
  ]);

  useEffect(() => {
    void (async () => {
      try {
        setLoadProviders(true);
        setProviderLoadError('');
        const response = await GetLabProviders(state.clinicProfileId);
        setLabProviders(response.items || []);
      } catch {
        setProviderLoadError('Unable to load lab providers.');
      } finally {
        setLoadProviders(false);
      }
    })();
  }, [state.clinicProfileId]);

  useEffect(() => {
    void (async () => {
      try {
        setLoadDentists(true);
        setDentistLoadError('');
        const response = await GetClinicUsers(state.clinicProfileId);
        const dentistItems = (response.items || [])
          .filter(
            (item) => item.id && item.role === RegisterUserRole.Dentist && item.isActive !== false
          )
          .map((item) => ({
            id: item.id || '',
            label: buildDentistLabel(item),
          }))
          .filter((item) => item.id);

        setDentists(dentistItems);
      } catch {
        setDentistLoadError('Unable to load dentist users.');
      } finally {
        setLoadDentists(false);
      }
    })();
  }, [state.clinicProfileId]);

  useEffect(() => {
    setSelectedPatientMeta({
      label: state.selectedItem?.patientLabel || '',
      birthDate: state.selectedItem?.patientBirthDate,
    });
  }, [state.selectedItem?.patientBirthDate, state.selectedItem?.patientLabel]);

  useEffect(() => {
    return () => {
      Object.values(imagePreviewMap).forEach((previewUrl) => {
        if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [imagePreviewMap]);

  useEffect(() => {
    let isActive = true;
    const attachments = state.selectedItem?.attachments || [];

    if (attachments.length === 0) {
      setImagePreviewMap((previousValue) => {
        Object.values(previousValue).forEach((previewUrl) => {
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
        });

        return {};
      });
      return;
    }

    void (async () => {
      const nextPreviewEntries = await Promise.all(
        attachments.map(async (attachment) => {
          const filePath = attachment.filePath?.trim();
          if (!filePath) {
            return undefined;
          }

          if (!isProtectedStoragePath(filePath)) {
            return [filePath, resolveApiAssetUrl(filePath)] as const;
          }

          try {
            const objectUrl = await loadProtectedAssetObjectUrl(filePath);
            return [filePath, objectUrl] as const;
          } catch {
            return [filePath, ''] as const;
          }
        })
      );

      if (!isActive) {
        nextPreviewEntries.forEach((entry) => {
          if (entry?.[1]?.startsWith('blob:')) {
            URL.revokeObjectURL(entry[1]);
          }
        });
        return;
      }

      setImagePreviewMap((previousValue) => {
        Object.values(previousValue).forEach((previewUrl) => {
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
        });

        return nextPreviewEntries
          .filter(Boolean)
          .reduce<Record<string, string>>((result, entry) => {
            result[entry![0]] = entry![1];
            return result;
          }, {});
      });
    })();

    return () => {
      isActive = false;
    };
  }, [state.selectedItem?.attachments]);

  const handleClose = (): void => {
    setSelectedFileName('');
    setUploadError('');
    setToothDialogState({ open: false });
    setImagePreviewMap((previousValue) => {
      Object.values(previousValue).forEach((previewUrl) => {
        if (previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      return {};
    });
    setState((prev) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  const handleSubmitForm = async (values: DentalLabCaseFormValues): Promise<void> => {
    if (!values.patientInfoId.trim()) {
      throw new Error('Please select a patient.');
    }

    if (!values.assignedDentistId.trim()) {
      throw new Error('Please select an assigned dentist.');
    }

    if (!values.labProviderId.trim()) {
      throw new Error('Please select a lab provider.');
    }

    if (values.teeth.length === 0) {
      throw new Error('Please select at least one tooth from the odontogram.');
    }

    if (!values.dateSent.trim()) {
      throw new Error('Date sent is required.');
    }

    const totalCost = resolveNumericValue(values.totalCost);
    const discount = resolveNumericValue(values.discount);
    const paidAmount = resolveNumericValue(values.paidAmount);
    const balance = totalCost - discount - paidAmount;

    if (discount > totalCost) {
      throw new Error('Discount cannot be greater than total cost.');
    }

    if (paidAmount > totalCost - discount) {
      throw new Error('Paid amount cannot be greater than the remaining total.');
    }

    if (balance < 0) {
      throw new Error('Balance cannot be negative.');
    }

    const payload: DentalLabCaseModel = {
      id: values.id.trim() || undefined,
      caseNumber: values.caseNumber.trim(),
      patientInfoId: values.patientInfoId,
      assignedDentistId: values.assignedDentistId,
      labProviderId: values.labProviderId,
      dateSent: toDatePayloadValue(values.dateSent),
      dateDue: toDatePayloadValue(values.dateDue),
      dateReceived: toDatePayloadValue(values.dateReceived),
      status: values.status,
      notes: values.notes.trim(),
      totalCost,
      discount,
      paidAmount,
      teeth: sortTeethByChartOrder(values.teeth, chartKind).map((tooth) => ({
        toothNumber: tooth.toothNumber?.trim() || '',
        workType: tooth.workType,
        material: tooth.material?.trim() || '',
        shade: tooth.shade?.trim() || '',
        remarks: tooth.remarks?.trim() || '',
        surfaces: (tooth.surfaces || [])
          .map((surface) => ({
            surface: surface.surface?.trim() || '',
          }))
          .filter((surface) => surface.surface),
      })),
      attachments: values.attachments.map((attachment) => ({
        fileName: attachment.fileName || '',
        originalFileName: attachment.originalFileName || '',
        filePath: attachment.filePath || '',
        fileType: attachment.fileType || 2,
        fileMediaType: attachment.fileMediaType || '',
        fileExtension: attachment.fileExtension || '',
        remarks: attachment.remarks || '',
      })),
    };

    if (state.isUpdate) {
      await HandleUpdateDentalLabCase(payload, state, setState);
      return;
    }

    await HandleCreateDentalLabCase(payload, state, setState);
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    values: DentalLabCaseFormValues,
    setFieldValue: (field: string, value: DentalLabCaseAttachmentModel[]) => void
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!values.patientInfoId.trim()) {
      setUploadError('Please select a patient before uploading images.');
      event.target.value = '';
      return;
    }

    if (values.attachments.length >= 6) {
      setUploadError('Only up to 6 reference images are allowed per lab case.');
      event.target.value = '';
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);
    setSelectedFileName(file.name);

    try {
      const response = await UploadDentalLabCaseAttachment(file, values.patientInfoId);
      const previewUrl = URL.createObjectURL(file);
      const nextAttachments = [
        ...values.attachments,
        {
          fileName: response.fileName,
          originalFileName: response.originalFileName || file.name,
          filePath: response.filePath,
          fileType: 2,
          fileMediaType: file.type,
          fileExtension: `.${file.name.split('.').pop() || ''}`.replace(/\.$/, ''),
          remarks: '',
        },
      ].slice(0, 6);

      setImagePreviewMap((previousValue) => ({
        ...previousValue,
        [response.filePath]: previewUrl,
      }));
      setUploadError('');
      setFieldValue('attachments', nextAttachments);
    } catch {
      setUploadError('Unable to upload reference image.');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveAttachment = (
    filePath: string | undefined,
    values: DentalLabCaseFormValues,
    setFieldValue: (field: string, value: DentalLabCaseAttachmentModel[]) => void
  ): void => {
    if (!filePath) {
      return;
    }

    setFieldValue(
      'attachments',
      values.attachments.filter((attachment) => attachment.filePath !== filePath)
    );

    setImagePreviewMap((previousValue) => {
      const nextValue = { ...previousValue };
      const previewUrl = nextValue[filePath];
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      delete nextValue[filePath];
      return nextValue;
    });
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmitForm(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else if (error instanceof Error) {
              setStatus(error.message);
            } else {
              setStatus('Unable to save dental lab case.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          handleSubmit,
          status,
          setFieldValue,
          isSubmitting,
          submitCount,
        }): JSX.Element => {
          const sortedTeeth = sortTeethByChartOrder(values.teeth, chartKind);
          const selectedToothIds = sortedTeeth
            .map((tooth) => getToothIdFromStoredValue(tooth.toothNumber))
            .filter(Boolean);
          const shadeConditionGroups = buildShadeConditionGroups(sortedTeeth);
          const selectedShadeKeys = Array.from(
            new Set(sortedTeeth.map((tooth) => getNormalizedShadeKey(tooth.shade)))
          );
          const providerError = submitCount > 0 && !values.labProviderId.trim();
          const patientError = submitCount > 0 && !values.patientInfoId.trim();
          const assignedDentistError = submitCount > 0 && !values.assignedDentistId.trim();
          const occupiedToothNumbers = sortedTeeth
            .map((item) => item.toothNumber || '')
            .filter(Boolean);
          const availableToothOptions = toothOptions.map((option) => ({
            ...option,
            disabled:
              occupiedToothNumbers.includes(option.value) &&
              option.value !== toothDialogState.previousToothNumber,
          }));
          const remainingBalance = getBalanceValue(
            values.totalCost,
            values.discount,
            values.paidAmount
          );

          const openToothDialog = (
            tooth: DentalLabCaseToothModel,
            previousToothNumber?: string
          ): void => {
            setToothDialogState({
              open: true,
              tooth: cloneToothModel(tooth),
              previousToothNumber,
            });
          };

          const handleSaveTooth = (
            nextTooth: DentalLabCaseToothModel,
            previousToothNumber?: string
          ): void => {
            const filteredTeeth = values.teeth.filter(
              (item) =>
                item.toothNumber !== previousToothNumber &&
                item.toothNumber !== nextTooth.toothNumber
            );
            const nextTeeth = sortTeethByChartOrder(
              [...filteredTeeth, cloneToothModel(nextTooth)],
              chartKind
            );

            setFieldValue('teeth', nextTeeth);
            setToothDialogState({ open: false });
          };

          const handleRemoveTooth = (toothNumber?: string): void => {
            setFieldValue(
              'teeth',
              values.teeth.filter((item) => item.toothNumber !== toothNumber)
            );
          };

          return (
            <>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  {status ? <Alert severity="error">{status}</Alert> : null}
                  {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}
                  {providerLoadError ? <Alert severity="warning">{providerLoadError}</Alert> : null}
                  {dentistLoadError ? <Alert severity="warning">{dentistLoadError}</Alert> : null}
                  {!loadProviders && mergedLabProviders.length === 0 ? (
                    <Alert
                      severity="info"
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                          onClick={() => window.open('/settings', '_blank', 'noopener,noreferrer')}
                        >
                          Open Settings
                        </Button>
                      }
                    >
                      No lab providers are available yet. Create them in Settings &gt; Build Up
                      &gt; Lab Providers before saving a lab case.
                    </Alert>
                  ) : null}
                  {!loadDentists && mergedDentists.length === 0 ? (
                    <Alert
                      severity="info"
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                          onClick={() => window.open('/settings', '_blank', 'noopener,noreferrer')}
                        >
                          Open Settings
                        </Button>
                      }
                    >
                      No dentist users are available yet. Create a dentist user in Settings before
                      saving a lab case.
                    </Alert>
                  ) : null}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, lg: 5 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: patientError
                            ? '1px solid rgba(211,47,47,0.45)'
                            : '1px solid rgba(192,210,231,0.9)',
                          bgcolor: '#fbfdff',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>
                          Patient Selection
                        </Typography>
                        <Typography sx={{ mt: 0.5, mb: 1.5, color: '#6c8299', fontSize: '0.88rem' }}>
                          Pick the patient for this lab case.
                        </Typography>
                        <PatientList
                          clinicId={state.clinicProfileId}
                          selectedPatientId={values.patientInfoId}
                          selectedPatientName={selectedPatientMeta.label}
                          onSelect={(patient) => {
                            setSelectedPatientMeta({
                              label: buildPatientName(patient),
                              birthDate: patient.birthDate,
                            });
                            setFieldValue('patientInfoId', patient.id || '');
                            setFieldValue('teeth', []);
                          }}
                          onClearSelection={() => {
                            setSelectedPatientMeta({ label: '', birthDate: undefined });
                            setFieldValue('patientInfoId', '');
                            setFieldValue('teeth', []);
                          }}
                          error={patientError}
                          helperText={patientError ? 'Patient is required.' : undefined}
                        />
                      </Box>

                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid rgba(192,210,231,0.9)',
                          bgcolor: '#fbfdff',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>
                          Payment Details
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: '#6c8299', fontSize: '0.88rem' }}>
                          Track the cost, discount, paid amount, and remaining balance for this
                          lab case.
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 0.2 }}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Total Cost"
                              type="number"
                              value={values.totalCost}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setFieldValue('totalCost', parseNumberInput(event.target.value))
                              }
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              inputProps={{ min: 0, step: '0.01' }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Discount"
                              type="number"
                              value={values.discount}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setFieldValue('discount', parseNumberInput(event.target.value))
                              }
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              inputProps={{ min: 0, step: '0.01' }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Paid Amount"
                              type="number"
                              value={values.paidAmount}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setFieldValue('paidAmount', parseNumberInput(event.target.value))
                              }
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              inputProps={{ min: 0, step: '0.01' }}
                            />
                          </Grid>
                        </Grid>

                        <Box
                          sx={{
                            mt: 1.75,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 1.2,
                          }}
                        >
                          {[
                            {
                              label: 'Net Amount',
                              value:
                                resolveNumericValue(values.totalCost) -
                                resolveNumericValue(values.discount),
                            },
                            { label: 'Balance', value: remainingBalance },
                          ].map((item) => (
                            <Box
                              key={item.label}
                              sx={{
                                p: 1.4,
                                borderRadius: '16px',
                                border: '1px solid rgba(192,210,231,0.9)',
                                bgcolor: '#ffffff',
                              }}
                            >
                              <Typography sx={{ color: '#6c8299', fontSize: '0.78rem' }}>
                                {item.label}
                              </Typography>
                              <Typography sx={{ mt: 0.35, fontWeight: 800, color: '#1f4467' }}>
                                PHP {item.value.toFixed(2)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 7 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid rgba(192,210,231,0.9)',
                          bgcolor: '#fbfdff',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#1f4467', mb: 1.5 }}>
                          Case Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Case Number"
                              name="caseNumber"
                              value={values.caseNumber}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              helperText="Leave blank to auto-generate."
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              label="Lab Provider"
                              name="labProviderId"
                              value={values.labProviderId}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              select
                              fullWidth
                              size="small"
                              error={providerError}
                              helperText={providerError ? 'Lab provider is required.' : undefined}
                            >
                              <MenuItem value="">Select lab provider</MenuItem>
                              {mergedLabProviders.map((provider) => (
                                <MenuItem key={provider.id || provider.labName} value={provider.id || ''}>
                                  {provider.labName || '--'}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Date Sent"
                              name="dateSent"
                              type="date"
                              value={values.dateSent}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              required
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Due Date"
                              name="dateDue"
                              type="date"
                              value={values.dateDue}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Date Received"
                              name="dateReceived"
                              type="date"
                              value={values.dateReceived}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Status"
                              name="status"
                              value={values.status}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              select
                              fullWidth
                              size="small"
                            >
                              {DENTAL_LAB_CASE_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {getDentalLabCaseStatusLabel(option)}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                              label="Assigned Dentist"
                              name="assignedDentistId"
                              value={values.assignedDentistId}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              select
                              fullWidth
                              size="small"
                              error={assignedDentistError}
                              helperText={
                                assignedDentistError ? 'Assigned dentist is required.' : undefined
                              }
                            >
                              <MenuItem value="">Select assigned dentist</MenuItem>
                              {mergedDentists.map((dentist) => (
                                <MenuItem key={dentist.id} value={dentist.id}>
                                  {dentist.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label="Notes"
                              name="notes"
                              value={values.notes}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              fullWidth
                              size="small"
                              multiline
                              minRows={3}
                              placeholder="Example: Upper anterior veneers for shade match review."
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid rgba(192,210,231,0.9)',
                      bgcolor: '#fbfdff',
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, lg: 5 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '22px',
                            border: '1px solid rgba(198,214,234,0.9)',
                            bgcolor: '#fff',
                            height: '100%',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>
                                Odontogram Reference
                              </Typography>
                              <Typography sx={{ mt: 0.45, color: '#6c8299', fontSize: '0.86rem' }}>
                                Click a tooth to open the editor. The tooth is added only after
                                you save it.
                              </Typography>
                            </Box>
                            <Chip
                              label={`Chart: ${chartKind === 'child' ? 'Primary' : 'Adult'}`}
                              color="info"
                              variant="outlined"
                            />
                          </Box>

                          <Box
                            sx={{
                              mt: 2,
                              p: 1.25,
                              borderRadius: '18px',
                              bgcolor: '#fdfefe',
                              border: '1px solid rgba(210,224,239,0.9)',
                              display: 'flex',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                            onClickCapture={(event) => {
                              const target = event.target as Element | null;
                              const toothGroup = target?.closest('g[class*="teeth-"]');
                              const toothClassName = toothGroup?.getAttribute('class') || '';
                              const toothMatch = toothClassName.match(/teeth-(\d+)/);

                              if (!toothMatch) {
                                return;
                              }

                              const clickedToothNumber = toothMatch[1];
                              const existingTooth = sortedTeeth.find(
                                (item) => item.toothNumber === clickedToothNumber
                              );

                              event.preventDefault();
                              event.stopPropagation();
                              openToothDialog(
                                existingTooth
                                  ? cloneToothModel(existingTooth)
                                  : createEmptyTooth(clickedToothNumber),
                                existingTooth?.toothNumber
                              );
                            }}
                          >
                            <Odontogram
                              key={`lab-case-circle-${chartKind}-${selectedToothIds.join('|') || 'empty'}`}
                              notation="Universal"
                              layout="circle"
                              showHalf="full"
                              showLabels
                              teethConditions={shadeConditionGroups}
                              maxTeeth={getDentalChartMaxTeeth(chartKind)}
                              defaultSelected={selectedToothIds}
                              tooltip={{
                                placement: 'top',
                                content: (payload): JSX.Element | null => {
                                  if (!payload) {
                                    return null;
                                  }

                                  const chartNumber = getToothNumberFromToothId(payload.id, chartKind);
                                  const selectedTooth = sortedTeeth.find(
                                    (item) => getToothIdFromStoredValue(item.toothNumber) === payload.id
                                  );

                                  return (
                                    <>
                                      <div>
                                        Tooth:{' '}
                                        {chartNumber
                                          ? getToothDisplayLabel(chartNumber, chartKind)
                                          : payload.id}
                                      </div>
                                      <div>Type: {payload.type}</div>
                                      <div>Shade: {selectedTooth?.shade?.trim() || 'Not set'}</div>
                                      <div>
                                        Work:{' '}
                                        {selectedTooth
                                          ? getDentalLabWorkTypeLabel(selectedTooth.workType)
                                          : 'Not added yet'}
                                      </div>
                                    </>
                                  );
                                },
                              }}
                              styles={{ width: chartKind === 'child' ? 280 : 318 }}
                            />
                          </Box>

                          <Box sx={{ mt: 1.5, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            {selectedShadeKeys.map((shadeKey) => {
                              const colors = getShadeColors(shadeKey);
                              return (
                                <Box
                                  key={`legend-${shadeKey}`}
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.55,
                                    borderRadius: '999px',
                                    border: `1px solid ${colors.stroke}`,
                                    backgroundColor: colors.fill,
                                    color: colors.text,
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {shadeKey === 'NO_SHADE' ? 'No Shade' : shadeKey}
                                </Box>
                              );
                            })}
                          </Box>

                          {sortedTeeth.length === 0 ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              Select one or more teeth from the circle chart.
                            </Alert>
                          ) : null}
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, lg: 7 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '22px',
                            border: '1px solid rgba(198,214,234,0.9)',
                            bgcolor: '#fff',
                            height: '100%',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 1,
                              flexWrap: 'wrap',
                              mb: 1.5,
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>
                                Teeth List
                              </Typography>
                              <Typography sx={{ mt: 0.45, color: '#6c8299', fontSize: '0.86rem' }}>
                                Table view for each selected tooth. Click a row to edit its work,
                                material, shade, and surfaces.
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`${sortedTeeth.length} tooth${sortedTeeth.length === 1 ? '' : 's'} selected`}
                              />
                              <Button
                                variant="outlined"
                                startIcon={<AddRoundedIcon />}
                                onClick={() => openToothDialog(createEmptyTooth())}
                                disabled={availableToothOptions.every((option) => option.disabled)}
                              >
                                Add Tooth
                              </Button>
                            </Box>
                          </Box>

                          {sortedTeeth.length === 0 ? (
                            <Box
                              sx={{
                                minHeight: 320,
                                borderRadius: '18px',
                                border: '1px dashed rgba(196,212,230,0.95)',
                                bgcolor: '#fbfdff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#7c95ac',
                                textAlign: 'center',
                                px: 3,
                              }}
                            >
                              Select teeth on the left odontogram or use the Add Tooth button to
                              create an entry.
                            </Box>
                          ) : (
                            <TableContainer
                              sx={{
                                maxHeight: 540,
                                borderRadius: '18px',
                                border: '1px solid rgba(196,212,230,0.95)',
                              }}
                            >
                              <Table stickyHeader size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Tooth</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Work Type</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Shade</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Surfaces</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right"></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedTeeth.map((tooth, index) => {
                                    const colors = getWorkTypeColors(tooth.workType);
                                    const surfaceLabel = tooth.surfaces
                                      .map((surface) => surface.surface || '')
                                      .filter(Boolean)
                                      .join(', ');

                                    return (
                                      <TableRow
                                        hover
                                        key={tooth.toothNumber || `lab-case-tooth-${index}`}
                                        onClick={() =>
                                          openToothDialog(cloneToothModel(tooth), tooth.toothNumber)
                                        }
                                        sx={{
                                          cursor: 'pointer',
                                          '& td': {
                                            borderBottomColor: 'rgba(226,234,242,0.92)',
                                          },
                                        }}
                                      >
                                        <TableCell>
                                          <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                                            {getToothLabelFromStoredValue(tooth.toothNumber, chartKind)}
                                          </Typography>
                                          <Typography sx={{ color: '#71879c', fontSize: '0.76rem' }}>
                                            Stored tooth: {tooth.toothNumber || '--'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              px: 1,
                                              py: 0.45,
                                              borderRadius: '999px',
                                              border: `1px solid ${colors.stroke}`,
                                              backgroundColor: colors.fill,
                                              color: colors.text,
                                              fontSize: '0.76rem',
                                              fontWeight: 800,
                                            }}
                                          >
                                            {getDentalLabWorkTypeLabel(tooth.workType)}
                                          </Box>
                                        </TableCell>
                                        <TableCell>{tooth.material || '--'}</TableCell>
                                        <TableCell>{tooth.shade || '--'}</TableCell>
                                        <TableCell sx={{ maxWidth: 170 }}>
                                          <Typography sx={{ fontSize: '0.82rem', color: '#415c74' }}>
                                            {surfaceLabel || '--'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                          <Typography
                                            sx={{
                                              fontSize: '0.82rem',
                                              color: '#415c74',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden',
                                            }}
                                          >
                                            {tooth.remarks || '--'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Box
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 0.5,
                                            }}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                            }}
                                          >
                                            <button
                                              type="button"
                                              title="Edit"
                                              aria-label={`Edit ${getToothLabelFromStoredValue(tooth.toothNumber, chartKind)}`}
                                              className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.editButton}`}
                                              onClick={() =>
                                                openToothDialog(
                                                  cloneToothModel(tooth),
                                                  tooth.toothNumber
                                                )
                                              }
                                            >
                                              <EditOutlinedIcon className={styles.iconEdit} />
                                            </button>
                                            <button
                                              type="button"
                                              title="Remove"
                                              aria-label={`Remove ${getToothLabelFromStoredValue(tooth.toothNumber, chartKind)}`}
                                              className={`${styles.buttonItem} ${styles.tableActionButton} ${styles.deleteButton}`}
                                              onClick={() => handleRemoveTooth(tooth.toothNumber)}
                                            >
                                              <DeleteOutlineOutlinedIcon className={styles.iconDelete} />
                                            </button>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid rgba(192,210,231,0.9)',
                      bgcolor: '#fbfdff',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#1f4467' }}>
                          Reference Images
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: '#6c8299', fontSize: '0.88rem' }}>
                          Upload shade photos, prep photos, or lab instructions. Up to 6 images.
                        </Typography>
                      </Box>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadOutlinedIcon />}
                        disabled={isUploadingImage || values.attachments.length >= 6}
                      >
                        Upload Image
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          onChange={async (event) => {
                            await handleImageUpload(
                              event,
                              values,
                              (field, nextValue) => setFieldValue(field, nextValue)
                            );
                          }}
                        />
                      </Button>
                    </Box>

                    <Typography sx={{ mt: 1.25, color: '#6c8299', fontSize: '0.84rem' }}>
                      {isUploadingImage
                        ? 'Uploading image...'
                        : selectedFileName || `${values.attachments.length}/6 images uploaded`}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1.75,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 1.5,
                      }}
                    >
                      {values.attachments.map((attachment, index) => {
                        const previewSrc = attachment.filePath
                          ? imagePreviewMap[attachment.filePath] ||
                            (isProtectedStoragePath(attachment.filePath)
                              ? ''
                              : resolveApiAssetUrl(attachment.filePath))
                          : '';

                        return (
                          <Box
                            key={attachment.filePath || attachment.fileName || `attachment-${index}`}
                            sx={{
                              borderRadius: '18px',
                              overflow: 'hidden',
                              border: '1px solid rgba(192,210,231,0.88)',
                              bgcolor: '#fff',
                            }}
                          >
                            <Box
                              sx={{
                                height: 140,
                                bgcolor: '#eef4fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {previewSrc ? (
                                <img
                                  src={previewSrc}
                                  alt={
                                    attachment.originalFileName ||
                                    attachment.fileName ||
                                    `Attachment ${index + 1}`
                                  }
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Typography sx={{ color: '#6d8298', fontSize: '0.84rem' }}>
                                  Preview
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ p: 1.2 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#1f4467',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {attachment.originalFileName || attachment.fileName || `Image ${index + 1}`}
                              </Typography>
                              <Button
                                color="inherit"
                                size="small"
                                sx={{ mt: 0.8, px: 0 }}
                                startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
                                onClick={() =>
                                  handleRemoveAttachment(
                                    attachment.filePath,
                                    values,
                                    (field, nextValue) => setFieldValue(field, nextValue)
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </Box>
                          </Box>
                        );
                      })}

                      {Array.from({ length: Math.max(0, 6 - values.attachments.length) }).map(
                        (_, index) => (
                          <Box
                            key={`empty-attachment-slot-${index}`}
                            sx={{
                              minHeight: 196,
                              borderRadius: '18px',
                              border: '1px dashed rgba(196,212,230,0.95)',
                              bgcolor: '#fbfdff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8aa0b7',
                              fontSize: '0.86rem',
                            }}
                          >
                            Empty Slot
                          </Box>
                        )
                      )}
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
                  {state.isUpdate ? 'Update' : 'Save'}
                </Button>
              </DialogActions>

              <DentalLabCaseToothEditorDialog
                open={toothDialogState.open}
                chartKind={chartKind}
                tooth={toothDialogState.tooth}
                previousToothNumber={toothDialogState.previousToothNumber}
                toothOptions={availableToothOptions}
                shadeOptions={DENTAL_LAB_SHADE_OPTIONS}
                onClose={() => setToothDialogState({ open: false })}
                onSave={handleSaveTooth}
              />
            </>
          );
        }}
      </Formik>
    </>
  );
};

export default DentalLabCasesFormV2;
