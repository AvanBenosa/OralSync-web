import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import { Dispatch, FunctionComponent, JSX, SetStateAction, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import EmployeeManagement from '../employee';
import type { EmployeeStateModel } from '../employee/api';
import LabProviderManagement from '../lab-provider';
import { LabProviderStateModel } from '../lab-provider/api/types';
import styles from '../style.scss.module.scss';
import TemplateFormManagement from '../template-form';
import { TemplateFormStateModel, TemplateType } from '../template-form/api/types';

type BuildUpTabId =
  | 'form-template'
  | 'email-template'
  | 'sms-template'
  | 'lab-providers'
  | 'employee';

type BuildUpProps = {
  templateFormState: TemplateFormStateModel;
  setTemplateFormState: Dispatch<SetStateAction<TemplateFormStateModel>>;
  labProviderState: LabProviderStateModel;
  setLabProviderState: Dispatch<SetStateAction<LabProviderStateModel>>;
  employeeState: EmployeeStateModel;
  setEmployeeState: Dispatch<SetStateAction<EmployeeStateModel>>;
};

const BuildUp: FunctionComponent<BuildUpProps> = (props: BuildUpProps): JSX.Element => {
  const {
    templateFormState,
    setTemplateFormState,
    labProviderState,
    setLabProviderState,
    employeeState,
    setEmployeeState,
  } = props;
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = useMemo(
    () => [
      {
        id: 'form-template' as const,
        label: 'Form Template',
        icon: <ArticleRoundedIcon />,
      },
      {
        id: 'email-template' as const,
        label: 'Email Template',
        icon: <EmailRoundedIcon />,
      },
      {
        id: 'sms-template' as const,
        label: 'SMS Template',
        icon: <SmsRoundedIcon />,
      },
      {
        id: 'lab-providers' as const,
        label: 'Lab Providers',
        icon: <BiotechRoundedIcon />,
      },
      {
        id: 'employee' as const,
        label: 'Employee',
        icon: <BadgeRoundedIcon />,
      },
    ],
    []
  );

  const validTabs = tabs.map((tab) => tab.id);
  const defaultTab: BuildUpTabId = 'form-template';
  const tabFromQuery = searchParams.get('buildUpTab') || '';
  const activeTab = validTabs.includes(tabFromQuery as BuildUpTabId)
    ? (tabFromQuery as BuildUpTabId)
    : defaultTab;

  const handleTabChange = (tabId: BuildUpTabId): void => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('buildUpTab', tabId);
    setSearchParams(nextParams);
  };

  return (
    <>
      <section className={styles.converterTabsSection}>
        <div className={styles.tabList} role="tablist" aria-label="Build up sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.tabButtonActive : ''
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className={styles.tabButtonIcon} aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'form-template' ? (
        <TemplateFormManagement
          state={templateFormState}
          setState={setTemplateFormState}
          templateType={TemplateType.Form}
        />
      ) : null}

      {activeTab === 'email-template' ? (
        <TemplateFormManagement
          state={templateFormState}
          setState={setTemplateFormState}
          templateType={TemplateType.Email}
        />
      ) : null}

      {activeTab === 'sms-template' ? (
        <TemplateFormManagement
          state={templateFormState}
          setState={setTemplateFormState}
          templateType={TemplateType.Sms}
        />
      ) : null}

      {activeTab === 'lab-providers' ? (
        <LabProviderManagement state={labProviderState} setState={setLabProviderState} />
      ) : null}

      {activeTab === 'employee' ? (
        <EmployeeManagement state={employeeState} setState={setEmployeeState} />
      ) : null}
    </>
  );
};

export default BuildUp;
