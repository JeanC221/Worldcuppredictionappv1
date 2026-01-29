import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { PAYMENT_CONFIG, formatCurrency } from '../../config/payments';

export default function CheckoutPage() {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'nequi' | 'daviplata' | 'bancolombia' | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = PAYMENT_CONFIG.SUBSCRIPTION_PRICE;

  const handleSubmitPayment = async () => {
    if (!user || !selectedMethod || !referenceNumber.trim()) {
      setError('Completa todos los campos');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await addDoc(collection(db, 'paymentRequests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || '',
        amount,
        paymentMethod: selectedMethod,
        referenceNumber: referenceNumber.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSent(true);
    } catch (err) {
      setError('Error al enviar la solicitud. Intenta de nuevo.');
      console.error('Payment request error:', err);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitud enviada
            </h2>
            <p className="text-gray-600 mb-4">
              Hemos recibido tu comprobante de pago. Verificaremos el pago y activaremos tu cuenta en las proximas horas.
            </p>
            <p className="text-sm text-gray-500">
              Recibiras una notificacion cuando tu cuenta este activa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completa tu inscripción
          </h1>
          <p className="text-gray-600">
            Realiza el pago y accede a todas las funciones del Mundial 2026
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total a pagar</span>
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1. Selecciona tu metodo de pago
            </h3>
            
            <div className="grid gap-3">
              <button
                onClick={() => setSelectedMethod('nequi')}
                className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                  selectedMethod === 'nequi'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-pink-600 font-bold text-lg">N</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Nequi</p>
                  <p className="text-sm text-gray-600">Transferencia instantanea</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('daviplata')}
                className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                  selectedMethod === 'daviplata'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-red-600 font-bold text-lg">D</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Daviplata</p>
                  <p className="text-sm text-gray-600">Transferencia instantanea</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('bancolombia')}
                className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                  selectedMethod === 'bancolombia'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-yellow-600 font-bold text-lg">B</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Bancolombia</p>
                  <p className="text-sm text-gray-600">Transferencia bancaria</p>
                </div>
              </button>
            </div>
          </div>

          {selectedMethod && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                2. Realiza el pago
              </h3>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                {selectedMethod === 'nequi' && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Envia {formatCurrency(amount)} a:</p>
                    <p className="text-xl font-bold text-gray-900 mb-1">{PAYMENT_CONFIG.NEQUI.NUMBER}</p>
                    <p className="text-sm text-gray-600">A nombre de: {PAYMENT_CONFIG.NEQUI.HOLDER}</p>
                  </>
                )}
                {selectedMethod === 'daviplata' && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Envia {formatCurrency(amount)} a:</p>
                    <p className="text-xl font-bold text-gray-900 mb-1">{PAYMENT_CONFIG.DAVIPLATA.NUMBER}</p>
                    <p className="text-sm text-gray-600">A nombre de: {PAYMENT_CONFIG.DAVIPLATA.HOLDER}</p>
                  </>
                )}
                {selectedMethod === 'bancolombia' && (
                  <>
                    <p className="text-sm text-gray-600 mb-2">Transfiere {formatCurrency(amount)} a:</p>
                    <p className="text-xl font-bold text-gray-900 mb-1">{PAYMENT_CONFIG.BANCOLOMBIA.NUMBER}</p>
                    <p className="text-sm text-gray-600">A nombre de: {PAYMENT_CONFIG.BANCOLOMBIA.HOLDER}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedMethod && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                3. Confirma tu pago
              </h3>
              
              <div className="mb-4">
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Numero de referencia o comprobante
                </label>
                <input
                  type="text"
                  id="reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ingresa el numero de referencia que aparece en tu comprobante de pago
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmitPayment}
                disabled={sending || !referenceNumber.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Confirmar pago'
                )}
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                Tu cuenta sera activada una vez verifiquemos el pago. Esto puede tomar hasta 24 horas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}