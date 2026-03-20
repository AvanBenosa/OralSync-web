import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import { FunctionComponent, JSX, useMemo, useState } from 'react';

import styles from '../style.scss.module.scss';
import TemplateFormManagement from '../template-form';
import { TemplateFormStateProps, TemplateType } from '../template-form/api/types';

type BuildUpTabId = 'form-template' | 'email-template' | 'sms-template';

const BuildUp: FunctionComponent<TemplateFormStateProps> = (
  props: TemplateFormStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [activeTab, setActiveTab] = useState<BuildUpTabId>('form-template');

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
    ],
    []
  );

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
              onClick={() => setActiveTab(tab.id)}
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
          state={state}
          setState={setState}
          templateType={TemplateType.Form}
        />
      ) : null}

      {activeTab === 'email-template' ? (
        <TemplateFormManagement
          state={state}
          setState={setState}
          templateType={TemplateType.Email}
        />
      ) : null}

      {activeTab === 'sms-template' ? (
        <TemplateFormManagement state={state} setState={setState} templateType={TemplateType.Sms} />
      ) : null}
    </>
  );
};

export default BuildUp;
