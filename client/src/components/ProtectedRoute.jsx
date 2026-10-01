import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) return (
    <div className="card" style={{ textAlign: 'center', padding: 60, margin: 24 }}>
      <h3>Access Restricted</h3>
      <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
    </div>
  );

  return children;
}
