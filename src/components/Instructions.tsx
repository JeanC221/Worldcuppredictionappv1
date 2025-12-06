import { useState } from 'react';
import { Trophy, Target, Award, Shield, Calendar, Lock, CheckCircle, Users, ClipboardList, Send, TrendingUp, HelpCircle, Medal } from 'lucide-react';
import { Card, CardContent } from './ui/card';

type Section = 'participate' | 'scoring' | 'ranking' | 'dates';

export function Instructions() {
  const [activeSection, setActiveSection] = useState<Section>('participate');

  const sections = [
    { id: 'participate' as Section, label: 'Cómo Participar', icon: ClipboardList, color: 'from-[#1E3A5F] to-[#2D4A6F]' },
    { id: 'scoring' as Section, label: 'Puntuación', icon: Target, color: 'from-[#D4A824] to-[#E8C547]' },
    { id: 'ranking' as Section, label: 'Ranking', icon: Medal, color: 'from-[#E85D24] to-[#F07D4A]' },
    { id: 'dates' as Section, label: 'Fechas', icon: Calendar, color: 'from-slate-700 to-slate-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl mb-4 shadow-xl">
          <HelpCircle className="size-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Instrucciones</h1>
        <p className="text-slate-500">Guía completa para participar en la Polla Mundialista 2026</p>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative p-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? `bg-gradient-to-br ${section.color} text-white shadow-lg scale-[1.02]` 
                  : 'bg-white text-slate-600 hover:bg-slate-50 shadow-md border border-slate-100'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  <Icon className={`size-6 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <span className="text-sm font-semibold">{section.label}</span>
              </div>
              {isActive && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-inherit rotate-45 rounded-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Section: Cómo Participar */}
        {activeSection === 'participate' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <ClipboardList className="size-6" />
                ¿Cómo Participar?
              </h2>
            </div>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Regístrate</h4>
                    <p className="text-sm text-slate-600">
                      Crea tu cuenta con email o Google. Tu información está protegida.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Completa tu Predicción</h4>
                    <p className="text-sm text-slate-600">
                      Pronostica los 72 partidos de fase de grupos y la fase eliminatoria.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Send className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Envía y Bloquea</h4>
                    <p className="text-sm text-slate-600">
                      Confirma tu polla antes del inicio. <span className="text-red-600 font-medium">Es irreversible.</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <TrendingUp className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Sigue el Ranking</h4>
                    <p className="text-sm text-slate-600">
                      Tu puntaje se actualiza automáticamente con cada partido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-5 bg-[#1E3A5F]/5 rounded-2xl border-2 border-[#1E3A5F]/10">
                <div className="flex items-start gap-4">
                  <Shield className="size-6 text-[#1E3A5F] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#1E3A5F] mb-1">Transparencia Total</h4>
                    <p className="text-sm text-slate-600">
                      Todas las predicciones son inmutables y visibles en la sección "Comunidad".
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section: Sistema de Puntuación */}
        {activeSection === 'scoring' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-[#D4A824] to-[#E8C547] px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Target className="size-6" />
                Sistema de Puntuación
              </h2>
            </div>
            <CardContent className="p-8">
              {/* Main scoring cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                  <p className="text-slate-600 text-sm">
                    Predices correctamente el marcador final (ej. México 2-1 Canadá)
                  </p>
                </div>

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
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Ganador/Empate</h4>
                  <p className="text-slate-600 text-sm">
                    Aciertas quién gana o si empatan, pero no el marcador exacto
                  </p>
                </div>
              </div>

              {/* Examples table */}
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-slate-200">
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-700">Ejemplos Prácticos</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-6 py-4 bg-emerald-50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">5</span>
                      <span className="text-slate-700">Predijiste <strong>2-1</strong> → Resultado <strong>2-1</strong></span>
                    </div>
                    <span className="text-emerald-600 font-semibold text-sm">Exacto ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white font-bold text-sm">3</span>
                      <span className="text-slate-700">Predijiste <strong>3-0</strong> → Resultado <strong>1-0</strong></span>
                    </div>
                    <span className="text-[#1E3A5F] font-semibold text-sm">Ganador ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white font-bold text-sm">3</span>
                      <span className="text-slate-700">Predijiste <strong>1-1</strong> → Resultado <strong>0-0</strong></span>
                    </div>
                    <span className="text-[#1E3A5F] font-semibold text-sm">Empate ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 bg-red-50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">0</span>
                      <span className="text-slate-700">Predijiste <strong>2-1</strong> → Resultado <strong>1-2</strong></span>
                    </div>
                    <span className="text-red-500 font-semibold text-sm">Incorrecto ✗</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section: Ranking y Empates */}
        {activeSection === 'ranking' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-[#E85D24] to-[#F07D4A] px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Medal className="size-6" />
                Ranking y Empates
              </h2>
            </div>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Trophy className="size-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-amber-900">Solo Puntos Totales</h4>
                  </div>
                  <p className="text-amber-800 text-sm">
                    El ranking se ordena <span className="font-bold">únicamente por la suma total de puntos</span>. No hay criterios de desempate adicionales.
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center">
                      <Users className="size-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Empates Compartidos</h4>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Si hay empate en puntos, los participantes <span className="font-bold">comparten la misma posición</span> en el ranking.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Ejemplo de Ranking con Empate</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 p-3 bg-[#D4A824]/10 rounded-xl">
                    <span className="w-8 h-8 bg-[#D4A824] rounded-lg flex items-center justify-center text-white font-bold">1</span>
                    <span className="flex-1 font-medium">Carlos</span>
                    <span className="font-bold text-[#1E3A5F]">52 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl">
                    <span className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold">2</span>
                    <span className="flex-1 font-medium">María</span>
                    <span className="font-bold text-[#1E3A5F]">45 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl">
                    <span className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold">2</span>
                    <span className="flex-1 font-medium">Juan</span>
                    <span className="font-bold text-[#1E3A5F]">45 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-amber-700/10 rounded-xl">
                    <span className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center text-white font-bold">4</span>
                    <span className="flex-1 font-medium">Ana</span>
                    <span className="font-bold text-[#1E3A5F]">40 pts</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  * María y Juan comparten el 2do lugar. Ana queda en 4to (no 3ro).
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section: Fechas y Seguridad */}
        {activeSection === 'dates' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Calendar className="size-6" />
                Fechas Importantes
              </h2>
            </div>
            <CardContent className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Lock className="size-6 text-red-500" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Cierre de Predicciones</h4>
                      <p className="text-sm text-slate-600">Último momento para enviar tu polla</p>
                    </div>
                  </div>
                  <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">
                    10 Jun 2026 - 23:59
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="size-6 text-[#1E3A5F]" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Inicio del Torneo</h4>
                      <p className="text-sm text-slate-600">Primer partido oficial</p>
                    </div>
                  </div>
                  <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-[#1E3A5F] text-white rounded-xl font-bold text-sm">
                    11 Jun 2026
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-5 bg-[#D4A824]/10 border-2 border-[#D4A824]/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Award className="size-6 text-[#D4A824]" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Final del Mundial</h4>
                      <p className="text-sm text-slate-600">Cierre de puntuación</p>
                    </div>
                  </div>
                  <span className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-[#D4A824] text-white rounded-xl font-bold text-sm">
                    19 Jul 2026
                  </span>
                </div>
              </div>

              {/* Security */}
              <div className="bg-[#1E3A5F]/5 rounded-2xl p-6 border-2 border-[#1E3A5F]/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="size-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1E3A5F] mb-1">Seguridad y Transparencia</h4>
                    <p className="text-sm text-slate-600">
                      Todas las predicciones son inmutables una vez enviadas y visibles para todos.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                    <Lock className="size-3" /> Predicciones bloqueadas
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                    <Users className="size-3" /> 100% transparente
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                    <Shield className="size-3" /> Firebase Auth
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
