import { mockRanking } from '../utils/mockData';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export function Ranking() {
  // Simular el usuario actual (primer participante)
  const currentUserId = '1';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Ranking en Vivo</h1>
        <p className="text-gray-600">
          Clasificación actualizada en tiempo real según los resultados del Mundial FIFA 2026
        </p>
      </div>

      {/* Podium - Top 3 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {mockRanking.slice(0, 3).map((participant, index) => {
          const styles = [
            { 
              icon: Trophy, 
              iconColor: 'text-amber-500', 
              bgGradient: 'from-amber-50 to-amber-100', 
              border: 'border-amber-300',
              badgeBg: 'bg-amber-500'
            },
            { 
              icon: Medal, 
              iconColor: 'text-slate-400', 
              bgGradient: 'from-slate-50 to-slate-100', 
              border: 'border-slate-300',
              badgeBg: 'bg-slate-400'
            },
            { 
              icon: Award, 
              iconColor: 'text-orange-600', 
              bgGradient: 'from-orange-50 to-orange-100', 
              border: 'border-orange-300',
              badgeBg: 'bg-orange-600'
            },
          ];
          const style = styles[index];
          const Icon = style.icon;

          return (
            <div
              key={participant.userId}
              className={`bg-gradient-to-br ${style.bgGradient} border ${style.border} rounded-xl p-6 text-center shadow-lg ${
                index === 0 ? 'md:order-2 md:scale-105 md:-mt-4' : index === 1 ? 'md:order-1' : 'md:order-3'
              }`}
            >
              <div className={`w-16 h-16 ${style.badgeBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md`}>
                <Icon className="size-10 text-white" />
              </div>
              <div className="text-5xl mb-2 text-gray-900">{index + 1}°</div>
              <h3 className="text-gray-900 mb-3">{participant.userName}</h3>
              <div className="inline-block bg-white border border-gray-200 rounded-lg px-6 py-3 mb-4 shadow-sm">
                <div className="text-4xl text-orange-600">{participant.totalPoints}</div>
                <div className="text-xs text-gray-600 mt-1">puntos</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-600 text-xs mb-1">Exactos</div>
                  <div className="text-emerald-600 text-xl">{participant.exactMatches}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-gray-600 text-xs mb-1">Ganadores</div>
                  <div className="text-blue-600 text-xl">{participant.correctWinners}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Ranking Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-gray-900">Clasificación Completa</h2>
          <p className="text-sm text-gray-600 mt-1">Sistema de puntuación: 5 puntos (exacto) | 3 puntos (ganador)</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 hover:bg-transparent bg-gray-50">
              <TableHead className="text-gray-600 w-20">Pos.</TableHead>
              <TableHead className="text-gray-600">Participante</TableHead>
              <TableHead className="text-gray-600 text-right">Puntos</TableHead>
              <TableHead className="text-gray-600 text-right">Exactos</TableHead>
              <TableHead className="text-gray-600 text-right">Ganadores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRanking.map((participant, index) => {
              const isCurrentUser = participant.userId === currentUserId;
              const isTop3 = index < 3;
              
              return (
                <TableRow
                  key={participant.userId}
                  className={`border-gray-200 ${
                    isCurrentUser
                      ? 'bg-orange-50 border-l-4 border-l-orange-500'
                      : isTop3
                      ? 'bg-amber-50/30'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {index === 0 && <Crown className="size-5 text-amber-500" />}
                      {index === 1 && <Medal className="size-5 text-slate-400" />}
                      {index === 2 && <Award className="size-5 text-orange-600" />}
                      <span className={`text-lg ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {index + 1}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{participant.userName}</span>
                      {isCurrentUser && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">
                          Tú
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-center bg-orange-100 border border-orange-200 rounded-lg px-4 py-2">
                      <span className="text-2xl text-orange-600">{participant.totalPoints}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg">
                      <Trophy className="size-4" />
                      <span className="text-lg">{participant.exactMatches}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg">
                      <Award className="size-4" />
                      <span className="text-lg">{participant.correctWinners}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Scoring System Info */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="size-6 text-emerald-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Marcador Exacto</h3>
          <div className="text-3xl text-emerald-600 mb-2">+5</div>
          <p className="text-sm text-gray-600">
            Predijiste el resultado exacto del partido
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Award className="size-6 text-blue-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Ganador Correcto</h3>
          <div className="text-3xl text-blue-600 mb-2">+3</div>
          <p className="text-sm text-gray-600">
            Acertaste el ganador pero no el marcador exacto
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Medal className="size-6 text-gray-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Desempate</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Marcadores exactos</p>
            <p>2. Ganadores correctos</p>
            <p>3. Fecha de envío</p>
          </div>
        </div>
      </div>
    </div>
  );
}
