import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency, PAYMENT_CONFIG } from '../config/payments';

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const { isSubscribed, subscription, loading } = useSubscription();

  if (loading || isSubscribed) {
    return null;
  }

  const daysUntilWorldCup = Math.floor(
    (new Date('2026-06-11').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium">
              El Mundial 2026 comienza en {daysUntilWorldCup} días
            </p>
            <p className="text-xs opacity-90 mt-1">
              Inscríbete ahora y accede a todas las funciones de predicción
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold">
                {formatCurrency(PAYMENT_CONFIG.SUBSCRIPTION_PRICE)}
              </p>
              <p className="text-xs opacity-90">Inscripción única</p>
            </div>
            
            <button
              onClick={() => navigate('/checkout')}
              className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Inscribirme ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}