import { useState } from 'react';
import { Trophy, Target, Award, Shield, Calendar, Lock, CheckCircle, Users, ClipboardList, Send, TrendingUp, HelpCircle, Medal, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { SCORING, PHASES, PHASE_DATES } from '../utils/constants';
import { Link } from 'react-router-dom';

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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          ¿Cómo funciona la Polla?
        </h1>
        <p className="text-[#666]">
          Todo lo que necesitas saber para participar y ganar
        </p>
      </div>

      {/* Secciones */}
      <div className="space-y-8">
        
        {/* Cómo participar */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             ¿Qué tengo que hacer?
          </h2>
          <div className="space-y-3 text-[#666]">
            <p>
              Predice los resultados de <strong className="text-[#1a1a1a]">todos los partidos</strong> del 
              Mundial 2026. Desde la fase de grupos hasta la final.
            </p>
            <p>
              También eliges qué equipos crees que pasarán a cada ronda: octavos, cuartos, 
              semifinales, y quién será el campeón.
            </p>
          </div>
        </section>

        {/* Sistema de puntos */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             Sistema de puntos
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+3</div>
              <div>
                <p className="font-medium text-[#1a1a1a]">Marcador exacto</p>
                <p className="text-sm text-[#666]">
                  Acertaste el resultado exacto. Por ejemplo: dijiste 2-1 y quedó 2-1.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+1</div>
              <div>
                <p className="font-medium text-[#1a1a1a]">Ganador correcto</p>
                <p className="text-sm text-[#666]">
                  No acertaste el marcador pero sí quién ganó (o si fue empate).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#fafafa] rounded-lg">
              <div className="text-2xl font-bold text-[#E85D24]">+2</div>
              <div>
                <p className="font-medium text-[#1a1a1a]">Equipo avanza</p>
                <p className="text-sm text-[#666]">
                  Por cada equipo que elegiste y sí pasó a la siguiente ronda.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ejemplo práctico */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             Ejemplo práctico
          </h2>
          
          <div className="bg-[#fafafa] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#999] mb-2">Partido: Argentina vs México</p>
            <p className="text-sm text-[#999]">Resultado real: <strong className="text-[#1a1a1a]">2 - 0</strong></p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
              <span>Tu predicción: <strong>2 - 0</strong></span>
              <span className="text-green-600 font-semibold">+3 puntos ✓</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
              <span>Tu predicción: <strong>1 - 0</strong></span>
              <span className="text-blue-600 font-semibold">+1 punto ✓</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
              <span>Tu predicción: <strong>0 - 1</strong></span>
              <span className="text-red-500 font-semibold">0 puntos ✗</span>
            </div>
          </div>
        </section>

        {/* Fases del torneo */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             Fases del torneo
          </h2>
          
          <div className="space-y-2">
            {[
              { name: 'Fase de Grupos', matches: 72, desc: 'Todos los partidos de los 12 grupos' },
              { name: 'Octavos de Final', matches: 16, desc: '16 equipos, 8 pasan' },
              { name: 'Cuartos de Final', matches: 8, desc: '8 equipos, 4 pasan' },
              { name: 'Semifinales', matches: 2, desc: '4 equipos, 2 pasan' },
              { name: 'Final', matches: 1, desc: '¡El partido decisivo!' },
            ].map((fase, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 bg-[#fafafa] rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[#1a1a1a]">{fase.name}</p>
                    <p className="text-xs text-[#999]">{fase.desc}</p>
                  </div>
                </div>
                <span className="text-sm text-[#666]">{fase.matches} partidos</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-[#999]">
             Cada fase se desbloquea cuando termina la anterior. Así es más emocionante.
          </p>
        </section>

        {/* Fechas importantes */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             Fechas importantes
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#E85D24]" />
              <div>
                <p className="font-medium text-[#1a1a1a]">Cierre de predicciones</p>
                <p className="text-sm text-[#666]">Antes del primer partido del Mundial</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              <div>
                <p className="font-medium text-[#1a1a1a]">Inicio del Mundial</p>
                <p className="text-sm text-[#666]">11 de junio de 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              <div>
                <p className="font-medium text-[#1a1a1a]">Final</p>
                <p className="text-sm text-[#666]">19 de julio de 2026</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ranking y empates */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             ¿Cómo se decide el ganador?
          </h2>
          
          <div className="space-y-3 text-[#666]">
            <p>
              Gana quien tenga <strong className="text-[#1a1a1a]">más puntos totales</strong> al final del Mundial.
            </p>
            <p>
              Si hay empate en puntos, <strong className="text-[#E85D24]">se comparte el premio</strong>. 
              No hay desempates. Simple y justo.
            </p>
          </div>

          <div className="mt-4 p-4 bg-[#fafafa] rounded-lg">
            <p className="text-sm text-[#666]">
              <strong className="text-[#1a1a1a]">Ejemplo:</strong> Si María y Juan empatan en 2do lugar 
              con 85 puntos cada uno, ambos son segundos y dividen el premio del 2do puesto.
            </p>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section className="bg-white border border-[#eee] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">
             Preguntas frecuentes
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium text-[#1a1a1a] mb-1">
                ¿Puedo cambiar mi predicción?
              </p>
              <p className="text-sm text-[#666]">
                Sí, puedes modificarla las veces que quieras antes de que cierre el plazo.
              </p>
            </div>
            <div>
              <p className="font-medium text-[#1a1a1a] mb-1">
                ¿Qué pasa si no completo todos los partidos?
              </p>
              <p className="text-sm text-[#666]">
                Los partidos sin predicción cuentan como 0 puntos. Te conviene llenarlos todos.
              </p>
            </div>
            <div>
              <p className="font-medium text-[#1a1a1a] mb-1">
                ¿Cómo veo las predicciones de otros?
              </p>
              <p className="text-sm text-[#666]">
                En la sección "Comunidad" puedes explorar lo que predijeron los demás participantes.
              </p>
            </div>
            <div>
              <p className="font-medium text-[#1a1a1a] mb-1">
                ¿Las predicciones son públicas?
              </p>
              <p className="text-sm text-[#666]">
                Sí, una vez enviadas son visibles para todos. Esto garantiza transparencia total.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <p className="text-[#666] mb-4">¿Listo para jugar?</p>
          <Link
            to="/mi-polla"
            className="inline-block px-6 py-3 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-[#333] transition-colors"
          >
            Hacer mi predicción
          </Link>
        </div>

      </div>
    </div>
  );
}
