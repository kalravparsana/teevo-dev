import { Navigate, Outlet } from 'react-router-dom';
import { useTeevo } from '@/store/TeevoContext';

export function ProtectedRoute() {
  const { currentUser } = useTeevo();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
