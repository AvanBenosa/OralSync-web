import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPortalHomePath, getUserPortalType } from '../utils/portal';

export const ProtectedRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export const ClinicRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (getUserPortalType(user) !== 'clinic') {
    return <Navigate to={getPortalHomePath(getUserPortalType(user))} replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (getUserPortalType(user) !== 'admin') {
    return <Navigate to={getPortalHomePath(getUserPortalType(user))} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  if (isLoggedIn) {
    return <Navigate to={getPortalHomePath(getUserPortalType(user))} replace />;
  }

  return <Outlet />;
};
