import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { PAYMENT_CONFIG, formatCurrency } from '../../config/payments';
import { Check, Copy, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'nequi' | 'daviplata' | 'bancolombia' | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const amount = PAYMENT_CONFIG.SUBSCRIPTION_PRICE;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentDetails = () => {
    switch (selectedMethod) {
      case 'nequi':
        return { number: PAYMENT_CONFIG.NEQUI.NUMBER, holder: PAYMENT_CONFIG.NEQUI.HOLDER };
      case 'daviplata':
        return { number: PAYMENT_CONFIG.DAVIPLATA.NUMBER, holder: PAYMENT_CONFIG.DAVIPLATA.HOLDER };
      case 'bancolombia':
        return { number: PAYMENT_CONFIG.BANCOLOMBIA.NUMBER, holder: PAYMENT_CONFIG.BANCOLOMBIA.HOLDER };
      default:
        return null;
    }
  };

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
      setError('Error al enviar. Intenta de nuevo.');
      console.error('Payment request error:', err);
    } finally {
      setSending(false);
    }
  };

  // Pantalla de éxito
  if (sent) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
            Solicitud enviada
          </h1>
          <p className="text-[#666] mb-8">
            Verificaremos tu pago y activaremos tu cuenta en las próximas horas. 
            Te notificaremos cuando esté listo.
          </p>
          <div className="p-4 bg-[#f5f5f5] rounded-xl text-sm text-[#666]">
            <p><strong>Referencia:</strong> {referenceNumber}</p>
            <p><strong>Método:</strong> {selectedMethod}</p>
            <p><strong>Monto:</strong> {formatCurrency(amount)}</p>
          </div>
        </div>
      </div>
    );
  }

  const paymentDetails = getPaymentDetails();

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          Completa tu inscripción
        </h1>
        <p className="text-[#666]">
          Paga {formatCurrency(amount)} para acceder al Mundial 2026
        </p>
      </div>

      {/* Métodos de pago */}
      <div className="mb-6">
        <p className="text-sm font-medium text-[#1a1a1a] mb-3">
          Selecciona cómo pagar
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'nequi', name: 'Nequi', color: '#E6007A' },
            { id: 'daviplata', name: 'Daviplata', color: '#ED1C24' },
            { id: 'bancolombia', name: 'Bancolombia', color: '#FDDA24' },
          ]).map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id as any)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedMethod === method.id
                  ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                  : 'border-[#eee] bg-white hover:border-[#ccc]'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  selectedMethod === method.id ? 'bg-white' : ''
                }`}
                style={{ backgroundColor: selectedMethod === method.id ? 'white' : method.color }}
              />
              <span className="text-sm font-medium">{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Datos de pago */}
      {paymentDetails && (
        <div className="mb-6 p-5 bg-[#f9f9f9] rounded-xl border border-[#eee]">
          <p className="text-sm text-[#666] mb-3">
            Envía <strong className="text-[#1a1a1a]">{formatCurrency(amount)}</strong> a:
          </p>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#eee] mb-2">
            <span className="font-mono text-lg font-semibold text-[#1a1a1a]">
              {paymentDetails.number}
            </span>
            <button
              onClick={() => copyToClipboard(paymentDetails.number)}
              className="p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4 text-[#999]" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-[#666]">
            A nombre de: <strong>{paymentDetails.holder}</strong>
          </p>
        </div>
      )}

      {/* Número de referencia */}
      {selectedMethod && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Número de referencia del pago
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Ej: 123456789"
            className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#1a1a1a] transition-colors"
          />
          <p className="mt-2 text-xs text-[#999]">
            Lo encuentras en el comprobante de tu transferencia
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Botón enviar */}
      {selectedMethod && (
        <button
          onClick={handleSubmitPayment}
          disabled={sending || !referenceNumber.trim()}
          className="w-full py-4 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-[#333] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Confirmar pago'
          )}
        </button>
      )}

      {/* Info adicional */}
      <div className="mt-8 pt-6 border-t border-[#eee]">
        <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">¿Cómo funciona?</h3>
        <ol className="space-y-2 text-sm text-[#666]">
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#f5f5f5] text-[#999] text-xs flex items-center justify-center flex-shrink-0">1</span>
            <span>Realiza la transferencia al número indicado</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#f5f5f5] text-[#999] text-xs flex items-center justify-center flex-shrink-0">2</span>
            <span>Ingresa el número de referencia del comprobante</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#f5f5f5] text-[#999] text-xs flex items-center justify-center flex-shrink-0">3</span>
            <span>Verificamos el pago y activamos tu cuenta (máx. 24h)</span>
          </li>
        </ol>
      </div>
    </div>
  );
}