import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import styles from './styles.scss.module.scss';
import { useAuthStore } from '../../common/store/authStore';
import { isBasicSubscription } from '../../common/utils/subscription';
import {
  PatientProfileMobileReloadConfig,
  PatientProfileProps,
  PatientStateModel,
} from './api/types';
import { HandleGetPatientProfile } from './api/handlers';
import { Dialog, useMediaQuery, useTheme } from '@mui/material';
import PatientProfileDeleteModal from './modal/modal';
import PatientProfileEmailModal from './modal/email-modal';
import NotFoundPage from '../../common/errors/page-not-found';
import PatientProfileForm from './index-content/patient-profile-form';
import {
  isProtectedStoragePath,
  loadProtectedAssetObjectUrl,
  resolveApiAssetUrl,
} from '../../common/services/api-client';
import { toValidDateDisplay } from '../../common/helpers/toValidateDateDisplay';
import PatientProfileHeader from './index-content/patient-profile-header';
import PatientProgressNotes from '../patient-profile-modules/progress-note';
import PatientMedicalHistory from '../patient-profile-modules/medical-history';
import PatientDentalChart from '../patient-profile-modules/dental-chart';
import PatientDentalPhoto from '../patient-profile-modules/photos';
import PatientForms from '../patient-profile-modules/patient-forms';

const resolveProfilePictureSrc = (profilePicture?: string): string => {
  if (!profilePicture?.trim()) {
    return '';
  }

  return resolveApiAssetUrl(profilePicture);
};

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const formatDateValue = (value?: string | Date): string =>
  toValidDateDisplay(value, 'MMM DD, YYYY');

const calculateAge = (birthDate?: string | Date): string => {
  if (!birthDate) {
    return '--';
  }

  const date = parseDateValue(birthDate);

  if (!date) {
    return '--';
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : '--';
};

export const PatientProfileModule: FunctionComponent<PatientProfileProps> = (
  props: PatientProfileProps
): JSX.Element => {
  void props;
  const navigate = useNavigate();
  const { patientId: patientIdParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = patientIdParam?.trim() || undefined;
  const validTabs = [
    // 'overview',
    'progress-notes',
    'medical-history',
    'photos',
    'dental-chart',
    'forms',
    'lab-cases',
    'appointments',
  ];
  const defaultTab = 'progress-notes';
  const tabFromQuery = searchParams.get('tab') || '';
  const activeTab = validTabs.includes(tabFromQuery) ? tabFromQuery : defaultTab;
  const tabLabels: Record<string, string> = {
    // overview: 'Overview',
    'progress-notes': 'Progress Notes',
    'medical-history': 'Medical History',
    photos: 'Photos',
    'dental-chart': 'Dental Chart',
    forms: 'Forms',
    'lab-cases': 'Lab Cases',
    appointments: 'Appointments',
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const subscriptionType = useAuthStore((store) => store.user?.subscriptionType ?? '');
  const isBasicPlan = isBasicSubscription(subscriptionType);
  const lastLoadedPatientIdRef = useRef<string | undefined>(undefined);
  const [profilePictureObjectUrl, setProfilePictureObjectUrl] = useState<string>('');
  const [state, setState] = useState<PatientStateModel>({
    load: true,
    profile: null,
    notFound: false,
    patientId,
    openModal: false,
    isDelete: false,
    isUpdate: false,
    isEmail: false,
    tabItemType: activeTab,
  });
  const [mobileReload, setMobileReload] = useState<PatientProfileMobileReloadConfig | undefined>();

  const loadPatientProfile = async (
    shouldSetLoadingState: boolean = true,
    forceRefresh: boolean = false
  ): Promise<void> => {
    if (!patientId) {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        profile: null,
      }));
      return;
    }

    if (shouldSetLoadingState) {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: true,
        notFound: false,
        patientId,
      }));
    }

    try {
      const profile = await HandleGetPatientProfile(setState, patientId, undefined, forceRefresh);
      const hasProfileData = Boolean(
        profile && (profile.id || profile.patientNumber || profile.firstName)
      );

      if (!hasProfileData) {
        setState((prev: PatientStateModel) => ({
          ...prev,
          load: false,
          notFound: true,
          profile: null,
        }));
      }
    } catch {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        profile: null,
      }));
    }
  };

  useEffect((): void => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      patientId,
    }));

    if (!patientId) {
      setState((prev: PatientStateModel) => ({
        ...prev,
        load: false,
        notFound: true,
        profile: null,
      }));
      return;
    }

    if (lastLoadedPatientIdRef.current === patientId) {
      return;
    }

    lastLoadedPatientIdRef.current = patientId;

    void loadPatientProfile(false, false);
    // Fetch when patient route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    let isActive = true;
    const profilePicture = state.profile?.profilePicture;

    if (!profilePicture?.trim() || !isProtectedStoragePath(profilePicture)) {
      setProfilePictureObjectUrl((previousValue) => {
        if (previousValue?.startsWith('blob:')) {
          URL.revokeObjectURL(previousValue);
        }

        return '';
      });
      return;
    }

    void loadProtectedAssetObjectUrl(profilePicture)
      .then((objectUrl) => {
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setProfilePictureObjectUrl((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return objectUrl;
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setProfilePictureObjectUrl((previousValue) => {
          if (previousValue?.startsWith('blob:')) {
            URL.revokeObjectURL(previousValue);
          }

          return '';
        });
      });

    return () => {
      isActive = false;
    };
  }, [state.profile?.profilePicture]);

  useEffect(() => {
    return () => {
      if (profilePictureObjectUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(profilePictureObjectUrl);
      }
    };
  }, [profilePictureObjectUrl]);

  useEffect(() => {
    if (!isBasicPlan || !state.isEmail) {
      return;
    }

    setState((prev: PatientStateModel) => ({
      ...prev,
      isEmail: false,
      openModal: false,
    }));
  }, [isBasicPlan, state.isEmail]);

  const handleCloseDialog = (): void => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDialogExited = (): void => {
    setState((prev: PatientStateModel) => ({
      ...prev,
      isUpdate: false,
      isDelete: false,
      isEmail: false,
      selectedItem: undefined,
    }));
  };

  if (state.notFound) {
    return <NotFoundPage />;
  }

  const patientDisplayName = [
    state.profile?.firstName?.trim(),
    state.profile?.middleName?.trim(),
    state.profile?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ');
  const patientDisplayLabel =
    patientDisplayName || state.profile?.patientNumber || 'Selected patient';
  const patientInfoLabel = state.profile?.patientNumber
    ? `${state.profile.patientNumber}${patientDisplayName ? ` • ${patientDisplayName}` : ''}`
    : patientDisplayLabel;
  const profilePictureSrc =
    profilePictureObjectUrl ||
    (!isProtectedStoragePath(state.profile?.profilePicture)
      ? resolveProfilePictureSrc(state.profile?.profilePicture)
      : '');
  const handleTabChange = (tabId: string): void => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.bodyWrapper}>
        <div className={styles.listContainer}>
          <PatientProfileHeader
            state={state}
            setState={setState}
            onBack={() => navigate(-1)}
            patientId={patientId}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            mobileReload={mobileReload}
          />
        </div>

        <div className={styles.profileLayout}>
          {!isMobile && (
            <aside className={styles.leftColumn}>
              <section className={styles.profileCard}>
                <div className={styles.profileBanner}></div>
                <div className={styles.avatarWrap}>
                  <div className={styles.avatarCircle}>
                    {profilePictureSrc ? (
                      <img
                        src={profilePictureSrc}
                        alt={state.profile?.firstName || 'Patient'}
                        className={styles.avatarImage}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!profilePictureSrc ? (
                      <PersonRoundedIcon className={styles.avatarIcon} />
                    ) : null}
                  </div>
                </div>
                <div className={styles.profileIdentity}>
                  <h1 className={styles.profileName}>
                    {state.profile?.firstName || 'Patient Profile'}
                  </h1>
                  <p className={styles.profileNumber}>{state.profile?.patientNumber || '--'}</p>
                  <p className={styles.profileRemarks}>
                    {state.profile?.remarks || 'No remarks available'}
                  </p>
                </div>
                <div className={styles.profileActions}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.deleteAction}`}
                    onClick={(): void =>
                      setState({
                        ...state,
                        isUpdate: false,
                        isDelete: true,
                        isEmail: false,
                        openModal: true,
                      })
                    }
                  >
                    <DeleteOutlineRoundedIcon /> Delete
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.editAction}`}
                    onClick={(): void =>
                      setState({
                        ...state,
                        selectedItem: state.profile ?? undefined,
                        isUpdate: true,
                        isDelete: false,
                        isEmail: false,
                        openModal: true,
                      })
                    }
                  >
                    <EditOutlinedIcon /> Edit Profile
                  </button>
                  {!isBasicPlan ? (
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.mailAction}`}
                      onClick={(): void =>
                        setState({
                          ...state,
                          isUpdate: false,
                          isDelete: false,
                          isEmail: true,
                          openModal: true,
                        })
                      }
                    >
                      <MailOutlineRoundedIcon /> Send Message
                    </button>
                  ) : null}
                </div>
              </section>

              <section className={styles.infoCard}>
                <div className={styles.infoGrid}>
                  <div>
                    <label>Age</label>
                    <p>{calculateAge(state.profile?.birthDate)}</p>
                  </div>
                  <div>
                    <label>Birthday</label>
                    <p>{formatDateValue(state.profile?.birthDate)}</p>
                  </div>
                  <div>
                    <label>Gender</label>
                    {/* <p>{state.profile.gender}</p> */}
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <p>{state.profile?.contactNumber || '--'}</p>
                  </div>
                  <div>
                    <label>Email Address</label>
                    <p>{state.profile?.emailAddress || '--'}</p>
                  </div>
                  <div>
                    <label>Civil Status</label>
                    {/* <p>{state.profile.civilStatus}</p> */}
                  </div>
                  <div>
                    <label>Address</label>
                    <p>{state.profile?.address || '--'}</p>
                  </div>
                  <div>
                    <label>Occupation</label>
                    <p>{state.profile?.occupation || '--'}</p>
                  </div>
                  <div>
                    <label>Religion</label>
                    <p>{state.profile?.religion || '--'}</p>
                  </div>
                  <div>
                    <label>Guardian</label>
                    {/* <p>{state.profile.guardian}</p> */}
                  </div>
                  <div>
                    <label>Record Created</label>
                    <p>{formatDateValue(state.profile?.createdAt)}</p>
                  </div>
                </div>
              </section>
            </aside>
          )}

          {/* //activeTab === 'overview' ? (
            <PatientOverView patientId={patientId} onRegisterMobileReload={setMobileReload} />
          ) : */}
          {activeTab === 'progress-notes' ? (
            <PatientProgressNotes
              patientId={patientId}
              onRegisterMobileReload={setMobileReload}
              patientLabel={patientInfoLabel}
            />
          ) : activeTab === 'medical-history' ? (
            <PatientMedicalHistory
              patientId={patientId}
              onRegisterMobileReload={setMobileReload}
              patientLabel={patientInfoLabel}
            />
          ) : activeTab === 'dental-chart' ? (
            <PatientDentalChart
              patientId={patientId}
              onRegisterMobileReload={setMobileReload}
              patientLabel={patientInfoLabel}
              patientProfile={state.profile}
            />
          ) : activeTab === 'photos' ? (
            <PatientDentalPhoto
              patientId={patientId}
              onRegisterMobileReload={setMobileReload}
              patientLabel={patientInfoLabel}
            />
          ) : activeTab === 'forms' ? (
            <PatientForms
              patientId={patientId}
              onRegisterMobileReload={setMobileReload}
              patientLabel={patientInfoLabel}
              patientProfile={state.profile}
            />
          ) : (
            <section className={styles.maintenancePanel}>
              <h2 className={styles.maintenanceTitle}>Under Maintenance</h2>
              <p className={styles.maintenanceText}>
                {tabLabels[activeTab]} is currently under maintenance.
              </p>
            </section>
          )}
        </div>
      </div>
      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        TransitionProps={{ onExited: handleDialogExited }}
        fullWidth
        maxWidth={state.isDelete || state.isEmail ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <PatientProfileDeleteModal state={state} setState={setState} />
        ) : state.isEmail ? (
          <PatientProfileEmailModal state={state} setState={setState} />
        ) : (
          <PatientProfileForm state={state} setState={setState} />
        )}
      </Dialog>
    </div>
  );
};

export default PatientProfileModule;
