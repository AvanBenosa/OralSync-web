import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../../mainLayout';
import AdminLayout from '../../adminLayout';
import NotFoundPage from '../errors/page-not-found';
import { AdminRoute, ClinicRoute, PublicRoute } from './route-guards';
import UserIndexPage from '../../features/dashboard';
import Login from '../../features/login/login';
import LogoutThankYou from '../../features/login/logout-thank-you';
import PatientModule from '../../features/patient';
import PatientProfileModule from '../../features/patient-profile';
import AppointmentModule from '../../features/appointment/appointment-request';
import InventoryModule from '../../features/inventory';
import DentalLabCasesModule from '../../features/dental-lab-cases';
import FinanceOverview from '../../features/finance-overview';
import InvoiceGeneratorModule from '../../features/invoice-generator';
import SettingsModule from '../../features/settings';
import SubscriptionModule from '../../features/subscription';
import AdminDashboard from '../../features/admin-portal/dashboard';
import ClinicLockModule from '../../features/admin-portal/clinic-locks';
import PaymentRequestsModule from '../../features/admin-portal/payment-requests';
import SetupModule from '../../features/admin-portal/setup';
import PublicRegistrationPage from '../../features/public-registration';
import { useAuthStore } from '../store/authStore';
import { canAccessSettingsModule } from '../utils/branch-access';
import { isBasicSubscription } from '../utils/subscription';

const AppRoutes = () => {
  const user = useAuthStore((state) => state.user);
  const hideInventoryModule = isBasicSubscription(user?.subscriptionType);

  return (
    <Routes>
      <Route path="/register-appointment" element={<PublicRegistrationPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/logout-success" element={<LogoutThankYou />} />
        {/* <Route path="/register" element={<Register />} /> */}
      </Route>

      <Route element={<ClinicRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={<UserIndexPage clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/patient"
            element={<PatientModule clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/appointment"
            element={<AppointmentModule clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/inventory"
            element={
              hideInventoryModule ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <InventoryModule clinicId={user?.clinicId ?? undefined} />
              )
            }
          />
          <Route
            path="/dental-lab-cases"
            element={<DentalLabCasesModule clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/finance-overview"
            element={<FinanceOverview clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/invoice-generator"
            element={<InvoiceGeneratorModule clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/settings"
            element={
              canAccessSettingsModule(user?.role) ? (
                <SettingsModule clinicId={user?.clinicId ?? undefined} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/subscription"
            element={<SubscriptionModule clinicId={user?.clinicId ?? undefined} />}
          />
          <Route
            path="/patient-profile/:patientId"
            element={<PatientProfileModule clinicId={user?.clinicId ?? undefined} />}
          />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard currentUser={user} />} />
          <Route path="/admin/clinic-locks" element={<ClinicLockModule />} />
          <Route path="/admin/payment-requests" element={<PaymentRequestsModule />} />
          <Route path="/admin/setup" element={<SetupModule />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
