import React from 'react';
import { matchPath, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { MenuItem, TextField, useMediaQuery, useTheme } from '@mui/material';
import SideNav from './common/sideNav/sideNav';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  acceptClinicDataPrivacy,
  acceptClinicContractPolicy,
  acceptClinicBetaTesting,
  getClinicDataPrivacyStatus,
  getRegistrationStatus,
} from './common/services/auth-api';
import { toastSuccess } from './common/api/responses';
import { useAuthStore } from './common/store/authStore';
import { isPendingClinicStatus, isPremiumSubscription } from './common/utils/subscription';
import ClinicLockedDialog from './features/login/clinic-locked-dialog';
import DataPrivacyConsentDialog from './features/login/data-privacy-consent-dialog';
import ContractPolicyDialog from './features/login/contract-policy-dialog';
import BetaTestingDialog from './features/login/beta-testing-dialog';
import PostLoginBootScreen, { usePostLoginBoot } from './common/loading/post-login-boot';
import AiAssistant from './common/components/AiAssistant';
import { GetCurrentClinicProfile } from './features/settings/clinic-profile/api/api';
import { GetClinicBranches } from './features/settings/clinic-branch/api/api';
import type { ClinicBranchModel } from './features/settings/clinic-branch/api/types';
import { isClinicWideRole } from './common/utils/branch-access';
// import RegisterBootstrapModal from './features/register';

const MainLayout = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const activeBranchId = useAuthStore((state) => state.branchId);
  const clinicId = user?.clinicId;
  const clinicName = user?.clinicName;
  const clinicStatus = user?.status;
  const isDataPrivacyAccepted = user?.isDataPrivacyAccepted;
  const isContractPolicyAccepted = user?.isContractPolicyAccepted;
  const forBetaTestingAccepted = user?.forBetaTestingAccepted;
  const isLocked = user?.isLocked;
  // const requiresRegistration = useAuthStore((state) => state.requiresRegistration);
  const setRequiresRegistration = useAuthStore((state) => state.setRequiresRegistration);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setBranchId = useAuthStore((state) => state.setBranchId);
  const logout = useAuthStore((state) => state.logout);
  const [showClinicLockedDialog, setShowClinicLockedDialog] = useState(false);
  const [showDataPrivacyDialog, setShowDataPrivacyDialog] = useState(false);
  const [showContractPolicyDialog, setShowContractPolicyDialog] = useState(false);
  const [showBetaTestingDialog, setShowBetaTestingDialog] = useState(false);
  const [isSubmittingDataPrivacy, setIsSubmittingDataPrivacy] = useState(false);
  const [isSubmittingContractPolicy, setIsSubmittingContractPolicy] = useState(false);
  const [isSubmittingBetaTesting, setIsSubmittingBetaTesting] = useState(false);
  const [dataPrivacyError, setDataPrivacyError] = useState('');
  const [contractPolicyError, setContractPolicyError] = useState('');
  const [betaTestingError, setBetaTestingError] = useState('');
  const [branches, setBranches] = useState<ClinicBranchModel[]>([]);
  const lockStatusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showPostLoginBoot = usePostLoginBoot();
  const canSwitchBranches = useMemo(
    () => Boolean(user?.portalType === 'clinic' && isClinicWideRole(user?.role)),
    [user?.portalType, user?.role]
  );
  const hasPremiumSubscription = useMemo(
    () => isPremiumSubscription(user?.subscriptionType),
    [user?.subscriptionType]
  );
  const canLoadBranches = canSwitchBranches && hasPremiumSubscription;
  const shouldShowBranchSelector = canLoadBranches && branches.length > 0;
  const shouldCheckDataPrivacy = useMemo(
    () => Boolean(isLoggedIn && clinicId),
    [clinicId, isLoggedIn]
  );
  const assistantContext = useMemo(() => {
    const patientMatch = matchPath('/patient-profile/:patientId', location.pathname);
    const patientRouteTab = new URLSearchParams(location.search).get('tab') || 'progress-notes';
    const routeLabelMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/patient': 'Patients',
      '/appointment': 'Appointments',
      '/inventory': 'Inventories',
      '/finance-overview': 'Billing and Finance',
      '/invoice-generator': 'Invoice Generator',
      '/settings': 'Settings',
    };

    if (patientMatch?.params.patientId) {
      const patientTabLabel = patientRouteTab
        .split('-')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

      return {
        contextKey: `patient:${patientMatch.params.patientId}:${patientRouteTab}`,
        patientId: patientMatch.params.patientId,
        routeContext: `Patient profile / ${patientTabLabel}`,
        title: 'Patient AI Assistant',
      };
    }

    const matchedStaticRoute = Object.entries(routeLabelMap).find(([path]) =>
      location.pathname.startsWith(path)
    );

    return {
      contextKey: matchedStaticRoute?.[0] || 'general',
      patientId: undefined,
      routeContext: matchedStaticRoute?.[1] || 'Clinic workspace',
      title: 'OralSync AI Assistant',
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isLoggedIn || !isLocked) {
      return;
    }

    if (location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLocked, isLoggedIn, location.pathname, navigate]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    void getRegistrationStatus()
      .then((response) => {
        setRequiresRegistration(response.requiresRegistration);
      })
      .catch(() => undefined);
  }, [isLoggedIn, setRequiresRegistration]);

  useEffect(() => {
    if (!canLoadBranches || !clinicId) {
      setBranches([]);
      setBranchId(null);
      return;
    }

    void GetClinicBranches(clinicId)
      .then((response) => {
        setBranches(response.items || []);
      })
      .catch(() => {
        setBranches([]);
        setBranchId(null);
      });
  }, [canLoadBranches, clinicId, setBranchId]);

  useEffect(() => {
    if (!shouldShowBranchSelector && activeBranchId) {
      setBranchId(null);
    }
  }, [activeBranchId, setBranchId, shouldShowBranchSelector]);

  useEffect(() => {
    if (!shouldCheckDataPrivacy) {
      if (lockStatusIntervalRef.current) {
        clearInterval(lockStatusIntervalRef.current);
        lockStatusIntervalRef.current = null;
      }
      return;
    }

    const syncClinicStatus = async (): Promise<void> => {
      try {
        const response = await getClinicDataPrivacyStatus();
        let clinicProfile = null;

        try {
          clinicProfile = await GetCurrentClinicProfile(clinicId, true);
        } catch {
          clinicProfile = null;
        }

        const currentUser = useAuthStore.getState().user;

        updateUser(
          currentUser
            ? {
                ...currentUser,
                clinicName:
                  response.clinicName ||
                  clinicProfile?.clinicName ||
                  currentUser.clinicName,
                isDataPrivacyAccepted: response.isDataPrivacyAccepted,
                isContractPolicyAccepted:
                  response.isContractPolicyAccepted ?? currentUser.isContractPolicyAccepted,
                forBetaTestingAccepted:
                  response.forBetaTestingAccepted ?? currentUser.forBetaTestingAccepted,
                isLocked: response.isLocked,
                subscriptionType:
                  clinicProfile?.subscriptionType || currentUser.subscriptionType,
                validityDate: clinicProfile?.validityDate || currentUser.validityDate,
                status: clinicProfile?.status || currentUser.status,
              }
            : currentUser
        );
      } catch {
        // Locked responses are handled by the API interceptor.
      }
    };

    void syncClinicStatus();

    const clinicSyncIntervalMs = isPendingClinicStatus(clinicStatus) ? 60000 : 1800000;

    lockStatusIntervalRef.current = setInterval(() => {
      void syncClinicStatus();
    }, clinicSyncIntervalMs);

    return () => {
      if (lockStatusIntervalRef.current) {
        clearInterval(lockStatusIntervalRef.current);
        lockStatusIntervalRef.current = null;
      }
    };
  }, [clinicId, clinicStatus, shouldCheckDataPrivacy, updateUser]);

  useEffect(() => {
    if (!shouldCheckDataPrivacy) {
      setShowClinicLockedDialog(false);
      setShowDataPrivacyDialog(false);
      setShowContractPolicyDialog(false);
      setShowBetaTestingDialog(false);
      setDataPrivacyError('');
      setContractPolicyError('');
      setBetaTestingError('');
      return;
    }

    if (isLocked) {
      setShowClinicLockedDialog(true);
      setShowDataPrivacyDialog(false);
      setShowContractPolicyDialog(false);
      setShowBetaTestingDialog(false);
      setDataPrivacyError('');
      setContractPolicyError('');
      setBetaTestingError('');
      return;
    }

    if (!isDataPrivacyAccepted) {
      setShowClinicLockedDialog(false);
      setShowDataPrivacyDialog(true);
      setShowContractPolicyDialog(false);
      setShowBetaTestingDialog(false);
      return;
    }

    if (!isContractPolicyAccepted) {
      setShowClinicLockedDialog(false);
      setShowDataPrivacyDialog(false);
      setShowContractPolicyDialog(true);
      setShowBetaTestingDialog(false);
      return;
    }

    if (!forBetaTestingAccepted) {
      setShowClinicLockedDialog(false);
      setShowDataPrivacyDialog(false);
      setShowContractPolicyDialog(false);
      setShowBetaTestingDialog(true);
      return;
    }

    void getClinicDataPrivacyStatus()
      .then((response) => {
        const currentUser = useAuthStore.getState().user;
        updateUser(
          currentUser
            ? {
                ...currentUser,
                clinicName: response.clinicName || clinicName || currentUser.clinicName,
                isDataPrivacyAccepted: response.isDataPrivacyAccepted,
                isContractPolicyAccepted: response.isContractPolicyAccepted,
                forBetaTestingAccepted: response.forBetaTestingAccepted,
                isLocked: response.isLocked,
              }
            : currentUser
        );
        setShowClinicLockedDialog(Boolean(response.isLocked));
        setShowDataPrivacyDialog(false);
        setShowContractPolicyDialog(false);
        setShowBetaTestingDialog(false);
        setDataPrivacyError('');
        setContractPolicyError('');
        setBetaTestingError('');
      })
      .catch((error) => {
        setShowClinicLockedDialog(false);
        setShowDataPrivacyDialog(true);
        setDataPrivacyError(
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load consent status.'
        );
      });
  }, [
    clinicName,
    isDataPrivacyAccepted,
    isContractPolicyAccepted,
    forBetaTestingAccepted,
    isLocked,
    shouldCheckDataPrivacy,
    updateUser,
  ]);

  const handleAcceptDataPrivacy = async (): Promise<void> => {
    setIsSubmittingDataPrivacy(true);
    setDataPrivacyError('');

    try {
      const response = await acceptClinicDataPrivacy();
      const currentUser = useAuthStore.getState().user;
      updateUser(
        currentUser
          ? {
              ...currentUser,
              clinicName: response.clinicName || clinicName || currentUser.clinicName,
              isDataPrivacyAccepted: response.isDataPrivacyAccepted,
              isContractPolicyAccepted: response.isContractPolicyAccepted,
              forBetaTestingAccepted: response.forBetaTestingAccepted,
              isLocked: response.isLocked,
            }
          : currentUser
      );
      setShowClinicLockedDialog(Boolean(response.isLocked));
      setShowDataPrivacyDialog(false);
      toastSuccess('Data privacy consent accepted successfully.');
    } catch (error: any) {
      setDataPrivacyError(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to save data privacy consent.'
      );
    } finally {
      setIsSubmittingDataPrivacy(false);
    }
  };

  const handleAcceptContractPolicy = async (): Promise<void> => {
    setIsSubmittingContractPolicy(true);
    setContractPolicyError('');

    try {
      const response = await acceptClinicContractPolicy();
      const currentUser = useAuthStore.getState().user;
      updateUser(
        currentUser
          ? {
              ...currentUser,
              clinicName: response.clinicName || clinicName || currentUser.clinicName,
              isDataPrivacyAccepted: response.isDataPrivacyAccepted,
              isContractPolicyAccepted: response.isContractPolicyAccepted,
              forBetaTestingAccepted: response.forBetaTestingAccepted,
              isLocked: response.isLocked,
            }
          : currentUser
      );
      setShowContractPolicyDialog(false);
      toastSuccess('Contract policy accepted successfully.');
    } catch (error: any) {
      setContractPolicyError(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to save contract policy acceptance.'
      );
    } finally {
      setIsSubmittingContractPolicy(false);
    }
  };

  const handleAcceptBetaTesting = async (): Promise<void> => {
    setIsSubmittingBetaTesting(true);
    setBetaTestingError('');

    try {
      const response = await acceptClinicBetaTesting();
      const currentUser = useAuthStore.getState().user;
      updateUser(
        currentUser
          ? {
              ...currentUser,
              clinicName: response.clinicName || clinicName || currentUser.clinicName,
              isDataPrivacyAccepted: response.isDataPrivacyAccepted,
              isContractPolicyAccepted: response.isContractPolicyAccepted,
              forBetaTestingAccepted: response.forBetaTestingAccepted,
              isLocked: response.isLocked,
            }
          : currentUser
      );
      setShowBetaTestingDialog(false);
      toastSuccess('Beta testing agreement accepted successfully.');
    } catch (error: any) {
      setBetaTestingError(
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to save beta testing acceptance.'
      );
    } finally {
      setIsSubmittingBetaTesting(false);
    }
  };

  if (showPostLoginBoot) {
    return <PostLoginBootScreen clinicName={user?.clinicName} portalLabel="Clinic workspace" />;
  }

  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default">
      <SideNav />
      <Box component="main" flexGrow={1} sx={{ overflowX: 'hidden' }}>
        {shouldShowBranchSelector ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: { xs: 1.5, sm: 2.5 },
              pt: { xs: 1.5, sm: 2 },
              pb: 0.5,
            }}
          >
            <TextField
              select
              size="small"
              label="Active Branch"
              value={activeBranchId ?? ''}
              onChange={(event) => {
                setBranchId(event.target.value || null);
              }}
              sx={{
                minWidth: { xs: '100%', sm: 260 },
                maxWidth: { xs: '100%', sm: 320 },
                bgcolor: 'rgba(255,255,255,0.92)',
              }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name || branch.code || 'Unnamed Branch'}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        ) : null}
        <Box key={location.pathname} sx={{ minHeight: '100vh' }}>
          {outlet}
        </Box>
      </Box>
      {isMobile ? (
        <AiAssistant
          contextKey={assistantContext.contextKey}
          patientId={assistantContext.patientId}
          routeContext={assistantContext.routeContext}
          title={assistantContext.title}
        />
      ) : null}
      <DataPrivacyConsentDialog
        open={showDataPrivacyDialog}
        clinicName={user?.clinicName}
        isSubmitting={isSubmittingDataPrivacy}
        submitError={dataPrivacyError}
        onAccept={handleAcceptDataPrivacy}
      />
      <ContractPolicyDialog
        open={showContractPolicyDialog}
        clinicName={user?.clinicName}
        isSubmitting={isSubmittingContractPolicy}
        submitError={contractPolicyError}
        onAccept={handleAcceptContractPolicy}
      />
      <BetaTestingDialog
        open={showBetaTestingDialog}
        clinicName={user?.clinicName}
        isSubmitting={isSubmittingBetaTesting}
        submitError={betaTestingError}
        onAccept={handleAcceptBetaTesting}
      />
      <ClinicLockedDialog
        open={showClinicLockedDialog}
        clinicName={user?.clinicName}
        onLogout={logout}
      />
      {/* Hidden for now: keep bootstrap modal code available, but do not show it after login. */}
      {/* <RegisterBootstrapModal open={requiresRegistration} /> */}
    </Box>
  );
};

export default MainLayout;
