import { PatientUploadResultModel } from '../../../patient/api/types';

export type PatientInfoDataConverterTargetField =
  | 'FirstName'
  | 'LastName'
  | 'MiddleName'
  | 'SplitPatientName'
  | 'EmailAddress'
  | 'BirthDate'
  | 'ContactNumber'
  | 'Address'
  | 'Suffix'
  | 'Occupation'
  | 'Religion'
  | 'BloodType'
  | 'CivilStatus';

export type PatientProgressNoteDataConverterTargetField =
  | 'SplitPatientName'
  | 'AssignedDoctor'
  | 'Date'
  | 'Procedure'
  | 'Category'
  | 'Remarks'
  | 'ClinicalFinding'
  | 'Assessment'
  | 'ToothNumber'
  | 'NextVisit'
  | 'Balance'
  | 'Account'
  | 'Amount'
  | 'Discount'
  | 'TotalAmountDue'
  | 'AmountPaid';

export type DataConverterTargetField =
  | PatientInfoDataConverterTargetField
  | PatientProgressNoteDataConverterTargetField;

export type DataConverterFieldOption<TField extends string = DataConverterTargetField> = {
  field: TField;
  label: string;
  helper: string;
};

export type DataConverterColumnMapping<TField extends string = DataConverterTargetField> = {
  sourceHeader: string;
  targetField: TField | '';
};

export type DataConverterPreviewRow = Record<string, string>;

export type DataConverterImportPayload = {
  file: File;
  mappings: DataConverterColumnMapping[];
};

export type DataConverterImportResponse = PatientUploadResultModel;
