import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { Loader2 } from 'lucide-react';

interface PaymentProtectedRouteProps {
  children: ReactNode;
}

export default function PaymentProtectedRoute({ children }: PaymentProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Mostrar loading mientras se verifican auth, subscription y admin
  if (authLoading || subLoading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin size-10 text-orange-500" />
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si es admin, siempre tiene acceso
  if (isAdmin) {
    return <>{children}</>;
  }

  // Si no está suscrito, redirigir al checkout
  if (!isSubscribed) {
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}