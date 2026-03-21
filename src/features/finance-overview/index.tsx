import { FunctionComponent, JSX, useState } from 'react';

import type { FinanceOverviewProps, FinanceViewTab } from './api/types';
import FinanceOverviewExpenses from './expenses';
import FinanceOverviewIncome from './income';

export const FinanceOverview: FunctionComponent<FinanceOverviewProps> = (
  props: FinanceOverviewProps
): JSX.Element => {
  const { clinicId } = props;
  const [activeTab, setActiveTab] = useState<FinanceViewTab>('income');

  return (
    <>
      <div style={{ display: activeTab === 'income' ? 'block' : 'none' }}>
        <FinanceOverviewIncome
          clinicId={clinicId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      <div style={{ display: activeTab === 'expenses' ? 'block' : 'none' }}>
        <FinanceOverviewExpenses
          clinicId={clinicId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </>
  );
};

export default FinanceOverview;
