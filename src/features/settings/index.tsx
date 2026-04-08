import { FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { toastConfig } from '../../common/api/responses';
import { useClinicId } from '../../common/components/ClinicId';
import { HandleGetCurrentClinicProfile } from './clinic-profile/api/handlers';
import { ClinicProfileStateModel } from './clinic-profile/api/types';
import { HandleGetClinicUsers } from './create-user/api/handlers';
import { CreateUserStateModel } from './create-user/api/types';
import { HandleGetLabProviders } from './lab-provider/api/handlers';
import { LabProviderStateModel } from './lab-provider/api/types';
import { HandleGetTemplateForms } from './template-form/api/handlers';
import { TemplateFormStateModel } from './template-form/api/types';
import BuildUp from './index-content/build-up';
import ClinicProfileForm from './index-content/clinic-profile-form';
import CreateUserManagement from './index-content/create-user-management';
import DataConverter from './index-content/data-converter';
import ExportData from './index-content/export-data';
import SettingsHeader from './index-content/settings-header';
import Subscriptions from './index-content/subscriptions';
import styles from './style.scss.module.scss';
import { SettingsProps } from './types';

type SettingsTabId =
  | 'clinic-profile'
  | 'create-user'
  | 'build-up'
  | 'data-mapping'
  | 'export-data'
  | 'subscriptions';

const SettingsModule: FunctionComponent<SettingsProps> = (props: SettingsProps): JSX.Element => {
  const { clinicId } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedClinicId = useClinicId(clinicId);
  const lastLoadedClinicProfileIdRef = useRef<string | null | undefined>(undefined);
  const [state, setState] = useState<ClinicProfileStateModel>({
    item: null,
    load: true,
    openModal: false,
    isUpdate: false,
    isDelete: false,
    clinicProfileId: resolvedClinicId,
  });
  const [createUserState, setCreateUserState] = useState<CreateUserStateModel>({
    items: [],
    item: null,
    load: true,
    isUpdate: false,
    isDelete: false,
    search: '',
    totalItem: 0,
    clinicId: resolvedClinicId,
  });
  const [templateFormState, setTemplateFormState] = useState<TemplateFormStateModel>({
    items: [],
    selectedItem: null,
    load: true,
    totalItem: 0,
    clinicId: resolvedClinicId,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
  const [labProviderState, setLabProviderState] = useState<LabProviderStateModel>({
    items: [],
    selectedItem: null,
    load: true,
    totalItem: 0,
    clinicId: resolvedClinicId,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });

  const settingsTabs = useMemo(
    () => [
      {
        id: 'clinic-profile' as const,
        label: 'Clinic Profile',
        icon: <BusinessRoundedIcon />,
        title: 'Clinic Profile',
        description:
          'Manage the clinic identity, branch details, contact information, and profile settings from this section.',
      },
      {
        id: 'create-user' as const,
        label: 'Create user',
        icon: <PersonAddAlt1RoundedIcon />,
        title: 'Create user',
        description:
          'Add and manage dentist or doctor accounts for this clinic from the settings workspace.',
      },
      {
        id: 'build-up' as const,
        label: 'Build Up',
        icon: <ConstructionRoundedIcon />,
        title: 'Build Up',
        description:
          'Use this tab for clinic build up details, setup options, and operational configuration items.',
      },
      {
        id: 'data-mapping' as const,
        label: 'Data Mapping',
        icon: <MapRoundedIcon />,
        title: 'Data Mapping',
        description:
          'Use this tab for clinic build up details, setup options, and operational configuration items.',
      },
      {
        id: 'export-data' as const,
        label: 'Export Data',
        icon: <FileDownloadRoundedIcon />,
        title: 'Export Data',
        description:
          'Download clinic records as CSV files from the tables stored in your database.',
      },
      {
        id: 'subscriptions' as const,
        label: 'Subscriptions',
        icon: <WorkspacePremiumRoundedIcon />,
        title: 'Subscriptions',
        description:
          'Review the clinic subscription type, assigned validity date, and current access status.',
      },
    ],
    []
  );

  const validTabs = settingsTabs.map((tab) => tab.id);
  const defaultTab: SettingsTabId = 'clinic-profile';
  const tabFromQuery = searchParams.get('tab') || '';
  const activeTab = validTabs.includes(tabFromQuery as SettingsTabId)
    ? (tabFromQuery as SettingsTabId)
    : defaultTab;

  const handleTabChange = (tabId: SettingsTabId): void => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams, { replace: true });
  };

  const loadClinicProfile = async (showToast: boolean = false): Promise<void> => {
    const requestState: ClinicProfileStateModel = {
      ...state,
      load: true,
      clinicProfileId: resolvedClinicId,
    };

    if (!resolvedClinicId) {
      setState((prev: ClinicProfileStateModel) => ({
        ...prev,
        load: false,
        clinicProfileId: resolvedClinicId,
      }));
      return;
    }

    try {
      if (showToast) {
        setState((prev: ClinicProfileStateModel) => ({
          ...prev,
          load: true,
          clinicProfileId: resolvedClinicId,
        }));
      }

      await HandleGetCurrentClinicProfile(requestState, setState, resolvedClinicId, showToast);

      if (showToast) {
        toast.info('Clinic profile has been refreshed.', toastConfig);
      }
    } catch {
      setState((prev: ClinicProfileStateModel) => ({
        ...prev,
        load: false,
      }));
    }
  };

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadClinicProfile(true);
    }, 350);
  };

  const loadClinicUsers = async (showToast: boolean = false): Promise<void> => {
    setCreateUserState((prev: CreateUserStateModel) => ({
      ...prev,
      load: true,
    }));

    try {
      await HandleGetClinicUsers(
        {
          ...createUserState,
          load: true,
        },
        setCreateUserState,
        resolvedClinicId
      );

      if (showToast) {
        toast.info('Clinic users have been refreshed.', toastConfig);
      }
    } catch {
      setCreateUserState((prev: CreateUserStateModel) => ({
        ...prev,
        load: false,
      }));
    }
  };

  const loadTemplateForms = async (showToast: boolean = false): Promise<void> => {
    setTemplateFormState((prev: TemplateFormStateModel) => ({
      ...prev,
      load: true,
      clinicId: resolvedClinicId,
    }));

    try {
      await HandleGetTemplateForms(
        {
          ...templateFormState,
          load: true,
          clinicId: resolvedClinicId,
        },
        setTemplateFormState,
        resolvedClinicId
      );

      if (showToast) {
        toast.info('Template forms have been refreshed.', toastConfig);
      }
    } catch {
      setTemplateFormState((prev: TemplateFormStateModel) => ({
        ...prev,
        load: false,
      }));
    }
  };

  const loadLabProviders = async (showToast: boolean = false): Promise<void> => {
    setLabProviderState((prev: LabProviderStateModel) => ({
      ...prev,
      load: true,
      clinicId: resolvedClinicId,
    }));

    try {
      await HandleGetLabProviders(
        {
          ...labProviderState,
          load: true,
          clinicId: resolvedClinicId,
        },
        setLabProviderState,
        resolvedClinicId
      );

      if (showToast) {
        toast.info('Lab providers have been refreshed.', toastConfig);
      }
    } catch {
      setLabProviderState((prev: LabProviderStateModel) => ({
        ...prev,
        load: false,
      }));
    }
  };

  useEffect(() => {
    setState((prev: ClinicProfileStateModel) => ({
      ...prev,
      clinicProfileId: resolvedClinicId,
    }));

    if (activeTab === 'clinic-profile' || activeTab === 'subscriptions') {
      if (!resolvedClinicId) {
        setState((prev: ClinicProfileStateModel) => ({
          ...prev,
          load: false,
        }));
      } else if (lastLoadedClinicProfileIdRef.current !== resolvedClinicId) {
        lastLoadedClinicProfileIdRef.current = resolvedClinicId;
        void loadClinicProfile(false);
      }
    }

    if (activeTab === 'create-user') {
      void loadClinicUsers(false);
    }

    if (activeTab === 'build-up') {
      void loadTemplateForms(false);
      void loadLabProviders(false);
    }

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // Fetch when clinic context or active tab changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, resolvedClinicId]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <SettingsHeader />
          <section className={styles.tabsSection}>
            <div className={styles.tabList} role="tablist" aria-label="Settings sections">
              {settingsTabs.map((tab) => (
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
          <section className={styles.tabPanel} aria-live="polite">
            {activeTab === 'clinic-profile' ? (
              <ClinicProfileForm state={state} setState={setState} onReload={handleReload} />
            ) : null}
            {activeTab === 'create-user' ? (
              <CreateUserManagement state={createUserState} setState={setCreateUserState} />
            ) : null}
            {activeTab === 'build-up' ? (
              <BuildUp
                templateFormState={templateFormState}
                setTemplateFormState={setTemplateFormState}
                labProviderState={labProviderState}
                setLabProviderState={setLabProviderState}
              />
            ) : null}
            {activeTab === 'data-mapping' ? <DataConverter /> : null}
            {activeTab === 'export-data' ? <ExportData /> : null}
            {activeTab === 'subscriptions' ? (
              <Subscriptions state={state} onReload={() => loadClinicProfile(false)} />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
