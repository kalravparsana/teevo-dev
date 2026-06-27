import { Navigate } from 'react-router-dom';
import { useTeevo } from '@/store/TeevoContext';
import type { UserRole } from '@/types/entities';

export function RoleGate({
  roles,
  children,
  fallback = '/dashboard',
}: {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: string;
}) {
  const { currentUser } = useTeevo();
  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
