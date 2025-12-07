import { useState } from 'react';
import { Trophy, Target, Award, Shield, Calendar, Lock, CheckCircle, Users, ClipboardList, Send, TrendingUp, HelpCircle, Medal, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { SCORING, PHASES, PHASE_DATES } from '../utils/constants';

type Section = 'participate' | 'scoring' | 'phases' | 'ranking' | 'dates';

export function Instructions() {
  const [activeSection, setActiveSection] = useState<Section>('participate');

  const sections = [
    { id: 'participate' as Section, label: 'Cómo Participar', icon: ClipboardList, color: 'from-[#1E3A5F] to-[#2D4A6F]' },
    { id: 'phases' as Section, label: 'Fases', icon: Layers, color: 'from-[#E85D24] to-[#F07D4A]' },
    { id: 'scoring' as Section, label: 'Puntuación', icon: Target, color: 'from-[#D4A824] to-[#E8C547]' },
    { id: 'ranking' as Section, label: 'Ranking', icon: Medal, color: 'from-emerald-600 to-emerald-500' },
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  <Icon className={`size-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <span className="text-xs font-semibold">{section.label}</span>
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
                    <h4 className="font-semibold text-slate-900 mb-1">Predice Fase por Fase</h4>
                    <p className="text-sm text-slate-600">
                      Cada fase se desbloquea en su momento. Empieza con los 72 partidos de grupos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Send className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Envía Antes del Cierre</h4>
                    <p className="text-sm text-slate-600">
                      Cada fase tiene su fecha límite. <span className="text-red-600 font-medium">Una vez enviada, es irreversible.</span>
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

        {/* Section: Sistema de Fases */}
        {activeSection === 'phases' && (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-[#E85D24] to-[#F07D4A] px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Layers className="size-6" />
                Sistema de Fases
              </h2>
            </div>
            <CardContent className="p-8">
              <p className="text-slate-600 mb-6">
                El torneo se juega <strong>fase por fase</strong>. Cada fase se desbloquea para predecir 
                solo cuando la anterior haya terminado. Así es más emocionante y justo.
              </p>

              {/* Fases del torneo */}
              <div className="space-y-3 mb-8">
                {PHASES.map((phase, index) => (
                  <div key={phase.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-[#1E3A5F] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{phase.name}</span>
                        <span className="text-slate-400 ml-2 text-sm">({phase.matches} partidos)</span>
                      </div>
                      <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-lg border">
                        Cierra: {new Date(PHASE_DATES[phase.id].lockBefore).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {index < PHASES.length - 1 && (
                      <ArrowRight className="size-4 text-slate-300 -mr-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Cómo funciona */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="size-6 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900">Fase Desbloqueada</h4>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Puedes llenar tus predicciones y elegir qué equipos crees que pasarán a la siguiente ronda.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="size-6 text-slate-500" />
                    <h4 className="font-semibold text-slate-700">Fase Bloqueada</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Las fases futuras están bloqueadas hasta que llegue su momento. Las pasadas ya no se pueden editar.
                  </p>
                </div>
              </div>

              {/* Bonus de equipos */}
              <div className="mt-6 p-5 bg-[#D4A824]/10 border-2 border-[#D4A824]/30 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Users className="size-6 text-[#D4A824] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#D4A824] mb-1">Bonus por Equipos que Avanzan</h4>
                    <p className="text-sm text-slate-600">
                      Además de predecir marcadores, seleccionas qué equipos crees que pasarán de ronda. 
                      Por cada equipo que aciertes, ganas <strong className="text-[#D4A824]">+{SCORING.TEAM_ADVANCED} puntos</strong>.
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
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border-2 border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="size-6 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-emerald-600">+{SCORING.EXACT_MATCH}</div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Marcador Exacto</h4>
                  <p className="text-slate-600 text-sm">
                    Predices el resultado exacto del partido
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1E3A5F]/5 to-[#1E3A5F]/10 rounded-2xl p-5 border-2 border-[#1E3A5F]/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="size-6 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-[#1E3A5F">+{SCORING.CORRECT_WINNER}</div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Ganador/Empate</h4>
                  <p className="text-slate-600 text-sm">
                    Aciertas quién gana o si empatan
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#D4A824]/10 to-[#D4A824]/20 rounded-2xl p-5 border-2 border-[#D4A824]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-[#D4A824] rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="size-6 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-[#D4A824]">+{SCORING.TEAM_ADVANCED}</div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Equipo Avanza</h4>
                  <p className="text-slate-600 text-sm">
                    Bonus por cada equipo que pasa de ronda
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
                      <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">{SCORING.EXACT_MATCH}</span>
                      <span className="text-slate-700">Predijiste <strong>2-1</strong> → Resultado <strong>2-1</strong></span>
                    </div>
                    <span className="text-emerald-600 font-semibold text-sm">Exacto ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white font-bold text-sm">{SCORING.CORRECT_WINNER}</span>
                      <span className="text-slate-700">Predijiste <strong>3-0</strong> → Resultado <strong>1-0</strong></span>
                    </div>
                    <span className="text-[#1E3A5F] font-semibold text-sm">Ganador ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center text-white font-bold text-sm">{SCORING.CORRECT_WINNER}</span>
                      <span className="text-slate-700">Predijiste <strong>1-1</strong> → Resultado <strong>0-0</strong></span>
                    </div>
                    <span className="text-[#1E3A5F] font-semibold text-sm">Empate ✓</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 bg-[#D4A824]/10">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-[#D4A824] rounded-lg flex items-center justify-center text-white font-bold text-sm">{SCORING.TEAM_ADVANCED}</span>
                      <span className="text-slate-700">Predijiste que <strong>Brasil</strong> avanzaba → <strong>¡Avanzó!</strong></span>
                    </div>
                    <span className="text-[#D4A824] font-semibold text-sm">Bonus ✓</span>
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
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Medal className="size-6" />
                Ranking y Premios
              </h2>
            </div>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#E85D24]/10 border-2 border-[#E85D24]/30 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#E85D24] rounded-xl flex items-center justify-center">
                      <Trophy className="size-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Solo Puntos Totales</h4>
                  </div>
                  <p className="text-slate-600 text-sm">
                    El ranking se ordena <strong>únicamente por la suma total de puntos</strong>: 
                    marcadores exactos + ganadores correctos + bonus de equipos.
                  </p>
                </div>

                <div className="bg-[#D4A824]/10 border-2 border-[#D4A824]/30 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#D4A824] rounded-xl flex items-center justify-center">
                      <Users className="size-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">Sin Desempates</h4>
                  </div>
                  <p className="text-slate-600 text-sm">
                    <strong>No hay criterios de desempate.</strong> Si dos o más participantes empatan en puntos, 
                    <span className="text-[#D4A824] font-semibold"> comparten la posición y el premio se divide</span> entre ellos.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Ejemplo de Ranking con Empate</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 p-3 bg-[#D4A824]/10 rounded-xl">
                    <span className="w-8 h-8 bg-[#D4A824] rounded-lg flex items-center justify-center text-white font-bold">1</span>
                    <span className="flex-1 font-medium">Carlos</span>
                    <span className="font-bold text-[#E85D24] text-lg">96 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl border-2 border-[#1E3A5F]/20">
                    <span className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold">2</span>
                    <span className="flex-1 font-medium">María</span>
                    <span className="font-bold text-[#E85D24] text-lg">85 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl border-2 border-[#1E3A5F]/20">
                    <span className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold">2</span>
                    <span className="flex-1 font-medium">Juan</span>
                    <span className="font-bold text-[#E85D24] text-lg">85 pts</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-amber-700/10 rounded-xl">
                    <span className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center text-white font-bold">4</span>
                    <span className="flex-1 font-medium">Ana</span>
                    <span className="font-bold text-[#E85D24] text-lg">72 pts</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-[#D4A824]/10 rounded-xl border-2 border-[#D4A824]/30">
                  <p className="text-sm text-slate-700">
                    <strong className="text-[#D4A824]">💰 En este ejemplo:</strong> María y Juan comparten el 2do lugar. 
                    Si el premio del 2do lugar es $100, <strong>cada uno recibe $50</strong>. 
                    Ana queda en 4to (no 3ro).
                  </p>
                </div>
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
              <div className="space-y-3 mb-8">
                {PHASES.map((phase, index) => (
                  <div 
                    key={phase.id} 
                    className={`flex flex-col md:flex-row md:justify-between md:items-center p-4 rounded-2xl border-2 ${
                      index === 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {index === 0 ? (
                        <Lock className="size-5 text-red-500" />
                      ) : (
                        <Calendar className="size-5 text-slate-400" />
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900">{phase.name}</h4>
                        <p className="text-xs text-slate-500">{phase.matches} partidos</p>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Cierre:</span>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${
                        index === 0 ? 'bg-red-500 text-white' : 'bg-[#1E3A5F] text-white'
                      }`}>
                        {new Date(PHASE_DATES[phase.id].lockBefore).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fechas del torneo */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-5 bg-[#1E3A5F]/5 border-2 border-[#1E3A5F]/10 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="size-6 text-[#1E3A5F]" />
                    <h4 className="font-semibold text-[#1E3A5F]">Inicio del Mundial</h4>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">11 de Junio, 2026</p>
                </div>
                <div className="p-5 bg-[#D4A824]/10 border-2 border-[#D4A824]/30 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="size-6 text-[#D4A824]" />
                    <h4 className="font-semibold text-[#D4A824]">Final del Mundial</h4>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">19 de Julio, 2026</p>
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
                      Cada fase se bloquea antes de que inicien sus partidos. Las predicciones son inmutables y visibles para todos.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                    <Lock className="size-3" /> Predicciones inmutables
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
