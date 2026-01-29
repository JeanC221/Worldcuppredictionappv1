import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency, PAYMENT_CONFIG } from '../config/payments';

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const { isSubscribed, loading } = useSubscription();

  if (loading || isSubscribed) {
    return null;
  }

  const daysUntilWorldCup = Math.floor(
    (new Date('2026-06-11').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="max-w-5xl mx-auto py-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium">
              ⚽ El Mundial 2026 comienza en {daysUntilWorldCup} días
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              Inscríbete y accede a todas las predicciones
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xl font-bold text-[#E85D24]">
                {formatCurrency(PAYMENT_CONFIG.SUBSCRIPTION_PRICE)}
              </p>
              <p className="text-xs text-white/70">Pago único</p>
            </div>
            
            <button
              onClick={() => navigate('/checkout')}
              className="bg-white text-[#1a1a1a] px-5 py-2 rounded-lg font-medium text-sm hover:bg-[#f5f5f5] transition-colors"
            >
              Inscribirme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}