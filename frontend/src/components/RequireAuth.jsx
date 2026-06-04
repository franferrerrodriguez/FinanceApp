import { Navigate } from 'react-router-dom';
import { useSessionMeta } from '../store/hooks';

export function RequireAuth({ children }) {
  const { sessionStatus, user } = useSessionMeta();

  if (sessionStatus !== 'authenticated' || !user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
