import type { Dispatch, SetStateAction } from 'react';

import { GetInvoiceGeneratorItems } from './api';
import type { InvoiceGeneratorStateModel } from './types';

export const HandleGetInvoiceGeneratorItems = async (
  state: InvoiceGeneratorStateModel,
  setState: Dispatch<SetStateAction<InvoiceGeneratorStateModel>>,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetInvoiceGeneratorItems(
    {
      clinicId: state.clinicId,
      patientInfoId: state.selectedPatientId,
      date: state.filterDate,
    },
    forceRefresh
  );

  setState((prevState: InvoiceGeneratorStateModel) => {
    const nextTotalItem = response.length;
    const pageSize = Math.max(prevState.pageEnd, 1);
    const maxPageStart =
      nextTotalItem > 0 ? Math.floor((nextTotalItem - 1) / pageSize) * pageSize : 0;

    return {
      ...prevState,
      load: false,
      items: response,
      totalItem: nextTotalItem,
      pageStart: Math.min(prevState.pageStart, maxPageStart),
    };
  });
};
