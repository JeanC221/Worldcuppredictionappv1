import { Trophy, Target, Award, Shield, Calendar, Lock } from 'lucide-react';

export function Instructions() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
          <Trophy className="size-8 text-white" />
        </div>
        <h1 className="text-gray-900 mb-2">Instrucciones y Sistema de Puntuación</h1>
        <p className="text-gray-600">Guía completa para participar en la Polla Mundialista 2026</p>
      </div>

      {/* How to Participate */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm">
        <h2 className="text-gray-900 mb-6">¿Cómo Participar?</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600">1</span>
            </div>
            <div>
              <h4 className="text-gray-900 mb-2">Regístrate en la Plataforma</h4>
              <p className="text-gray-600 text-sm">
                Crea tu cuenta con un correo electrónico válido. Tu información está protegida con seguridad de nivel bancario.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600">2</span>
            </div>
            <div>
              <h4 className="text-gray-900 mb-2">Completa tu Predicción</h4>
              <p className="text-gray-600 text-sm">
                Pronostica el marcador de cada partido de la fase de grupos (12 grupos, 3 partidos por grupo). Los ganadores de cada grupo se calculan automáticamente según tus predicciones.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600">3</span>
            </div>
            <div>
              <h4 className="text-gray-900 mb-2">Envía y Bloquea</h4>
              <p className="text-gray-600 text-sm">
                Una vez satisfecho con tus predicciones, haz clic en "Enviar y Bloquear Polla". Esta acción es irreversible y debe hacerse antes del inicio del torneo.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600">4</span>
            </div>
            <div>
              <h4 className="text-gray-900 mb-2">Sigue el Ranking</h4>
              <p className="text-gray-600 text-sm">
                A medida que se juegan los partidos, tu puntaje se actualiza automáticamente. Revisa el ranking en vivo para ver tu posición.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring System */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="size-6 text-orange-600" />
          <h2 className="text-gray-900">Sistema de Puntuación</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Exact Score */}
          <div className="bg-white rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Trophy className="size-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-4xl text-emerald-600">+5</div>
                <div className="text-sm text-gray-600">puntos</div>
              </div>
            </div>
            <h4 className="text-gray-900 mb-2">Marcador Exacto</h4>
            <p className="text-sm text-gray-600">
              Predices correctamente el marcador final del partido (ej. México 2-1 Canadá)
            </p>
          </div>

          {/* Correct Winner */}
          <div className="bg-white rounded-lg p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Award className="size-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-4xl text-blue-600">+3</div>
                <div className="text-sm text-gray-600">puntos</div>
              </div>
            </div>
            <h4 className="text-gray-900 mb-2">Ganador Correcto</h4>
            <p className="text-sm text-gray-600">
              Predices el equipo ganador o el empate, pero no el marcador exacto (ej. predijiste 3-1 y fue 2-0)
            </p>
          </div>
        </div>

        {/* Scoring Matrix */}
        <div className="bg-white rounded-lg overflow-hidden border border-orange-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-900">Tipo de Acierto</th>
                <th className="px-6 py-3 text-center text-sm text-gray-900">Puntos</th>
                <th className="px-6 py-3 text-left text-sm text-gray-900">Ejemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-emerald-50">
                <td className="px-6 py-4 text-sm text-gray-900">Marcador Exacto</td>
                <td className="px-6 py-4 text-center text-emerald-600">5</td>
                <td className="px-6 py-4 text-sm text-gray-600">Predijiste 2-1 → Resultado 2-1</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-4 text-sm text-gray-900">Ganador Correcto</td>
                <td className="px-6 py-4 text-center text-blue-600">3</td>
                <td className="px-6 py-4 text-sm text-gray-600">Predijiste 3-0 → Resultado 1-0</td>
              </tr>
              <tr className="bg-red-50">
                <td className="px-6 py-4 text-sm text-gray-900">Predicción Incorrecta</td>
                <td className="px-6 py-4 text-center text-red-600">0</td>
                <td className="px-6 py-4 text-sm text-gray-600">Predijiste 2-1 → Resultado 1-2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tiebreaker Rules */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Award className="size-6 text-orange-500" />
          <h2 className="text-gray-900">Criterios de Desempate</h2>
        </div>
        <p className="text-gray-600 mb-4">
          En caso de empate en puntos totales, se utilizan los siguientes criterios en orden:
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm">
              1
            </div>
            <div>
              <h4 className="text-gray-900">Mayor número de marcadores exactos</h4>
            </div>
          </div>
          <div className="flex gap-3 bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm">
              2
            </div>
            <div>
              <h4 className="text-gray-900">Mayor número de ganadores correctos</h4>
            </div>
          </div>
          <div className="flex gap-3 bg-gray-50 rounded-lg p-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm">
              3
            </div>
            <div>
              <h4 className="text-gray-900">Fecha más temprana de envío de predicción</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Important Dates */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="size-6 text-orange-500" />
          <h2 className="text-gray-900">Fechas Importantes</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h4 className="text-gray-900">Cierre de Predicciones</h4>
              <p className="text-sm text-gray-600">Último momento para enviar tu polla</p>
            </div>
            <span className="text-orange-600">10 Jun 2026 - 23:59</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h4 className="text-gray-900">Inicio del Torneo</h4>
              <p className="text-sm text-gray-600">Primer partido oficial</p>
            </div>
            <span className="text-orange-600">11 Jun 2026 - 12:00</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-gray-900">Final del Mundial</h4>
              <p className="text-sm text-gray-600">Último partido y cierre de puntuación</p>
            </div>
            <span className="text-orange-600">19 Jul 2026</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="size-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-blue-900 mb-2">
              Transparencia y Seguridad
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Todas las predicciones son inmutables una vez enviadas. Puedes consultar la predicción de cualquier participante en la sección "Comunidad" para garantizar transparencia total.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Lock className="size-4" />
              <span>Sistema de bloqueo criptográfico</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
