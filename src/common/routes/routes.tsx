import { Route, Routes } from 'react-router-dom';
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
import FinanceOverview from '../../features/finance-overview';
import SettingsModule from '../../features/settings';
import AdminDashboard from '../../features/admin-portal/dashboard';
import ClinicLockModule from '../../features/admin-portal/clinic-locks';
import PublicRegistrationPage from '../../features/public-registration';
import { useAuthStore } from '../store/authStore';

const AppRoutes = () => {
  const user = useAuthStore((state) => state.user);

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
          <Route path="/dashboard" element={<UserIndexPage clinicId={user?.clinicId ?? undefined} />} />
          <Route path="/patient" element={<PatientModule clinicId={user?.clinicId ?? undefined} />} />
          <Route path="/appointment" element={<AppointmentModule clinicId={user?.clinicId ?? undefined} />} />
          <Route
            path="/finance-overview"
            element={<FinanceOverview clinicId={user?.clinicId ?? undefined} />}
          />
          <Route path="/settings" element={<SettingsModule clinicId={user?.clinicId ?? undefined} />} />
          <Route path="/patient-profile/:patientId" element={<PatientProfileModule clinicId={user?.clinicId ?? undefined} />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard currentUser={user} />} />
          <Route path="/admin/clinic-locks" element={<ClinicLockModule />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
