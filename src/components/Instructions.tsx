import { Trophy, Target, Award, Shield, Calendar, Lock, CheckCircle, Users, ClipboardList, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function Instructions() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl mb-6 shadow-xl">
          <Trophy className="size-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Instrucciones y Sistema de Puntuación</h1>
        <p className="text-slate-500 text-lg">Guía completa para participar en la Polla Mundialista 2026</p>
      </div>

      {/* How to Participate */}
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] px-8 py-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="size-6" />
            ¿Cómo Participar?
          </h2>
        </div>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Regístrate en la Plataforma</h4>
                <p className="text-slate-600">
                  Crea tu cuenta con un correo electrónico válido o usa tu cuenta de Google. Tu información está protegida con Firebase Authentication.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Completa tu Predicción</h4>
                <p className="text-slate-600">
                  Pronostica el marcador de cada partido de la fase de grupos (12 grupos, 3 partidos por grupo). También selecciona a los equipos que crees que avanzarán en la fase eliminatoria hasta el campeón.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Send className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Envía y Bloquea</h4>
                <p className="text-slate-600">
                  Una vez satisfecho con tus predicciones, haz clic en "Enviar y Bloquear Polla". <span className="font-semibold text-red-600">Esta acción es irreversible</span> y debe hacerse antes del inicio del torneo.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <TrendingUp className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Sigue el Ranking</h4>
                <p className="text-slate-600">
                  A medida que se juegan los partidos, tu puntaje se actualiza automáticamente. Revisa el ranking en vivo para ver tu posición.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring System */}
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#D4A824] to-[#E8C547] px-8 py-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Target className="size-6" />
            Sistema de Puntuación
          </h2>
        </div>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Exact Score */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="size-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-emerald-600">+5</div>
                  <div className="text-sm text-emerald-700 font-medium">puntos</div>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Marcador Exacto</h4>
              <p className="text-slate-600">
                Predices correctamente el marcador final del partido (ej. México 2-1 Canadá)
              </p>
            </div>

            {/* Correct Winner */}
            <div className="bg-gradient-to-br from-[#1E3A5F]/5 to-[#1E3A5F]/10 rounded-2xl p-6 border-2 border-[#1E3A5F]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-[#1E3A5F] rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="size-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-[#1E3A5F]">+3</div>
                  <div className="text-sm text-[#1E3A5F] font-medium">puntos</div>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Ganador/Empate Correcto</h4>
              <p className="text-slate-600">
                Predices el equipo ganador o el empate, pero no el marcador exacto (ej. predijiste 3-1 y fue 2-0, o predijiste 1-1 y fue 0-0)
              </p>
            </div>
          </div>

          {/* Scoring Matrix */}
          <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
            <table className="w-full">
              <thead className="bg-[#1E3A5F]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tipo de Acierto</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Puntos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Ejemplo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-emerald-50">
                  <td className="px-6 py-4 font-medium text-slate-900">Marcador Exacto</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-lg text-white font-bold">5</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">Predijiste 2-1 → Resultado 2-1</td>
                </tr>
                <tr className="bg-[#1E3A5F]/5">
                  <td className="px-6 py-4 font-medium text-slate-900">Ganador Correcto</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-[#1E3A5F] rounded-lg text-white font-bold">3</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">Predijiste 3-0 → Resultado 1-0</td>
                </tr>
                <tr className="bg-[#1E3A5F]/5">
                  <td className="px-6 py-4 font-medium text-slate-900">Empate Correcto</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-[#1E3A5F] rounded-lg text-white font-bold">3</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">Predijiste 1-1 → Resultado 0-0</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-6 py-4 font-medium text-slate-900">Predicción Incorrecta</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg text-white font-bold">0</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">Predijiste 2-1 → Resultado 1-2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ranking & Ties */}
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#E85D24] to-[#F07D4A] px-8 py-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Users className="size-6" />
            Ranking y Empates
          </h2>
        </div>
        <CardContent className="p-8">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="size-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-amber-900 mb-2">Solo importan los Puntos Totales</h4>
                <p className="text-amber-800">
                  El ranking se ordena <span className="font-bold">únicamente por la suma total de puntos</span>. No hay criterios de desempate adicionales.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="size-5 text-slate-600" />
              ¿Qué pasa si hay empate en puntos?
            </h4>
            <p className="text-slate-600 mb-4">
              Si dos o más participantes tienen la misma cantidad de puntos totales, <span className="font-semibold">quedarán empatados en el ranking</span>. Compartirán la misma posición.
            </p>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">Ejemplo:</span> Si Juan tiene 45 puntos y María también tiene 45 puntos, ambos aparecerán en la misma posición del ranking (ej. ambos en 3er lugar).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Calendar className="size-6" />
            Fechas Importantes
          </h2>
        </div>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="size-5 text-red-500" />
                  Cierre de Predicciones
                </h4>
                <p className="text-slate-600 mt-1">Último momento para enviar tu polla</p>
              </div>
              <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-xl font-bold">
                10 Jun 2026 - 23:59
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Inicio del Torneo</h4>
                <p className="text-slate-600 mt-1">Primer partido oficial</p>
              </div>
              <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-[#1E3A5F] text-white rounded-xl font-bold">
                11 Jun 2026 - 12:00
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-[#D4A824]/10 border-2 border-[#D4A824]/30 rounded-2xl">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Trophy className="size-5 text-[#D4A824]" />
                  Final del Mundial
                </h4>
                <p className="text-slate-600 mt-1">Último partido y cierre de puntuación</p>
              </div>
              <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-[#D4A824] text-white rounded-xl font-bold">
                19 Jul 2026
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1E3A5F]/10 to-[#1E3A5F]/5 px-8 py-8">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="size-7 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1E3A5F] mb-3">
                Transparencia y Seguridad
              </h4>
              <p className="text-slate-600 mb-4">
                Todas las predicciones son <span className="font-semibold">inmutables una vez enviadas</span>. Puedes consultar la predicción de cualquier participante en la sección "Comunidad" para garantizar transparencia total.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <Lock className="size-4 text-[#1E3A5F]" />
                  <span className="text-sm font-medium text-slate-700">Predicciones bloqueadas</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <Users className="size-4 text-[#1E3A5F]" />
                  <span className="text-sm font-medium text-slate-700">100% transparente</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <Shield className="size-4 text-[#1E3A5F]" />
                  <span className="text-sm font-medium text-slate-700">Firebase Authentication</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
