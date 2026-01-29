import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const referenceCode = searchParams.get('referenceCode');
        const transactionState = searchParams.get('transactionState');

        if (transactionState === '4' && referenceCode) {
          const verifyPayU = httpsCallable(functions, 'verifyPayUPayment');
          const result = await verifyPayU({ referenceCode });
          const data = result.data as { paid: boolean };
          setVerified(data.paid);
          
          if (!data.paid) {
            setError('No se pudo verificar el pago. Contacta a soporte.');
          }
        } else if (transactionState === '6') {
          setError('La transaccion fue rechazada.');
          setVerified(false);
        } else if (transactionState === '104') {
          setError('Error en la transaccion.');
          setVerified(false);
        } else {
          setError('Estado de pago desconocido.');
          setVerified(false);
        }
      } catch (err) {
        setError('Error al verificar el pago');
        console.error('Payment verification error:', err);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Verificando tu pago
          </h2>
          <p className="text-gray-600">Por favor espera un momento...</p>
        </div>
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error en el pago
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'No pudimos verificar tu pago. Por favor contacta a soporte.'}
          </p>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pago confirmado
        </h2>
        
        <p className="text-gray-600 mb-6">
          Tu inscripcion ha sido procesada exitosamente. Ya puedes acceder a todas las funciones de la plataforma.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">
            Recibiras un correo de confirmacion con los detalles de tu inscripcion.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
        >
          Ir al Dashboard
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}