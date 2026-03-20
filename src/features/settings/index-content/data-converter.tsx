import { FunctionComponent, JSX, useMemo, useState } from 'react';
import DatasetLinkedRoundedIcon from '@mui/icons-material/DatasetLinkedRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import styles from '../style.scss.module.scss';
import PatientInfoDataConverter from './data-converter-patient-info';
import PatientProgressNoteDataConverter from './data-converter-progress-note';

type DataConverterTabId = 'patient-info' | 'patient-progress-note';

const DataConverter: FunctionComponent = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<DataConverterTabId>('patient-info');

  const tabs = useMemo(
    () => [
      {
        id: 'patient-info' as const,
        label: 'PatientInfo',
        icon: <DatasetLinkedRoundedIcon />,
      },
      {
        id: 'patient-progress-note' as const,
        label: 'Patient Progress Note',
        icon: <DescriptionRoundedIcon />,
      },
    ],
    []
  );

  return (
    <>
      <section className={styles.converterTabsSection}>
        <div className={styles.tabList} role="tablist" aria-label="Data converter sections">
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

      {activeTab === 'patient-info' ? <PatientInfoDataConverter /> : null}
      {activeTab === 'patient-progress-note' ? <PatientProgressNoteDataConverter /> : null}
    </>
  );
};

export default DataConverter;
