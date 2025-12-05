import { mockPredictions, actualResults, calculateScore } from '../utils/mockData';
import { Trophy, TrendingUp, Calendar, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';

export function Dashboard() {
  const userPrediction = mockPredictions[0];
  const userScore = calculateScore(userPrediction, actualResults);

  // Calcular ranking position
  const allScores = mockPredictions.map(p => calculateScore(p, actualResults));
  const sortedScores = allScores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
    return b.correctWinners - a.correctWinners;
  });
  const userPosition = sortedScores.findIndex(s => s.userId === userPrediction.userId) + 1;

  const upcomingMatches = [
    { team1: 'Argentina', team2: 'Francia', date: '2026-06-17 12:00', group: 'C' },
    { team1: 'España', team2: 'Alemania', date: '2026-06-17 15:00', group: 'D' },
    { team1: 'Brasil', team2: 'Portugal', date: '2026-06-17 18:00', group: 'E' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">¡Bienvenido, {userPrediction.userName}!</h1>
        <p className="text-gray-600">Revisa tu progreso en la Polla Mundialista 2026</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {/* Position Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="size-8" />
            <div className="text-right">
              <div className="text-xs opacity-90">Tu Posición</div>
              <div className="text-4xl">{userPosition}</div>
            </div>
          </div>
          <div className="text-sm opacity-90">de {mockPredictions.length} participantes</div>
        </div>

        {/* Total Points */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="size-8 text-orange-500" />
            <div className="text-right">
              <div className="text-xs text-gray-500">Puntos Totales</div>
              <div className="text-4xl text-gray-900">{userScore.totalPoints}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">Sistema 5-3 puntos</div>
        </div>

        {/* Exact Matches */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="size-8 text-emerald-500" />
            <div className="text-right">
              <div className="text-xs text-gray-500">Marcadores Exactos</div>
              <div className="text-4xl text-gray-900">{userScore.exactMatches}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">+5 pts cada uno</div>
        </div>

        {/* Correct Winners */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Award className="size-8 text-blue-500" />
            <div className="text-right">
              <div className="text-xs text-gray-500">Ganadores Correctos</div>
              <div className="text-4xl text-gray-900">{userScore.correctWinners}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">+3 pts cada uno</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900">Próximos Partidos</h3>
            <Calendar className="size-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {upcomingMatches.map((match, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Grupo {match.group}</span>
                  <span className="text-xs text-gray-500">{match.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{match.team1}</span>
                  <span className="text-gray-400">vs</span>
                  <span className="text-gray-900">{match.team2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-gray-900 mb-6">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link to="/mi-polla">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Ver Mi Predicción</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/ranking">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Ver Ranking Completo</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/comunidad">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Ver Otras Pollas</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/instrucciones">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Sistema de Puntuación</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {userPrediction.isLocked && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="size-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-blue-900 mb-1">
                Predicción Registrada
              </h4>
              <p className="text-sm text-blue-700">
                Tu polla fue enviada el {userPrediction.submittedAt} y está bloqueada. Los puntos se actualizan automáticamente con cada resultado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
