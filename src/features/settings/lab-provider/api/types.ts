import type { Dispatch, SetStateAction } from 'react';

export type LabProviderModel = {
  id?: string;
  clinicProfileId?: string | null;
  labName?: string;
  contactPerson?: string;
  contactNumber?: string;
  emailAddress?: string;
  labType?: string;
};

export type LabProviderResponseModel = {
  items: LabProviderModel[];
  totalCount: number;
};

export type LabProviderFormValues = {
  id?: string;
  labName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress: string;
  labType: string;
};

export type LabProviderStateModel = {
  items: LabProviderModel[];
  selectedItem: LabProviderModel | null;
  load: boolean;
  totalItem: number;
  clinicId?: string | null;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
};

export type LabProviderStateProps = {
  state: LabProviderStateModel;
  setState: Dispatch<SetStateAction<LabProviderStateModel>>;
};

export const getLabProviderItemKey = (item?: LabProviderModel | null): string =>
  item?.id?.trim() || `${item?.labName?.trim() || ''}::${item?.contactPerson?.trim() || ''}`;
