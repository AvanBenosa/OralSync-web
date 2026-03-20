import { PatientUploadResultModel } from '../../../patient/api/types';

export type DataConverterTargetField =
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

export type DataConverterColumnMapping = {
  sourceHeader: string;
  targetField: DataConverterTargetField | '';
};

export type DataConverterPreviewRow = Record<string, string>;

export type DataConverterImportPayload = {
  file: File;
  mappings: DataConverterColumnMapping[];
};

export type DataConverterImportResponse = PatientUploadResultModel;
