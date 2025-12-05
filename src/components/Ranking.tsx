import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trophy, Medal, Award, Crown, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { calculateScore, ScoreResult } from '../utils/scoring';
import { Match } from '../utils/types';

interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
}

export function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid || '';

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // 1. Obtener todos los partidos con sus resultados oficiales
        const matchesSnap = await getDocs(collection(db, 'partidos'));
        const matches: Match[] = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        // 2. Obtener todas las predicciones de usuarios
        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        
        const entries: RankingEntry[] = [];

        for (const pollaDoc of pollasSnap.docs) {
          const data = pollaDoc.data();
          const predictions = data.groupPredictions || {};
          
          // Convertir formato de predicciones: { matchId: { score1, score2 } }
          const predictionMap: { [matchId: string]: { score1: number; score2: number } } = {};
          for (const [matchId, pred] of Object.entries(predictions)) {
            const p = pred as { score1?: number; score2?: number };
            if (p.score1 !== undefined && p.score2 !== undefined) {
              predictionMap[matchId] = { score1: p.score1, score2: p.score2 };
            }
          }

          // Calcular puntos
          const score: ScoreResult = calculateScore(predictionMap, matches);

          entries.push({
            rank: 0,
            userId: data.userId || pollaDoc.id,
            userName: data.userName || 'Anónimo',
            totalPoints: score.totalPoints,
            exactMatches: score.exactMatches,
            correctWinners: score.correctWinners,
          });
        }

        // 3. Ordenar por: puntos > exactos > ganadores (pueden empatar)
        entries.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
          return b.correctWinners - a.correctWinners;
        });

        // 4. Asignar rangos (considerando empates)
        entries.forEach((entry, index) => {
          if (index === 0) {
            entry.rank = 1;
          } else {
            const prev = entries[index - 1];
            // Si tiene los mismos puntos, exactos y ganadores = mismo rango
            if (
              entry.totalPoints === prev.totalPoints &&
              entry.exactMatches === prev.exactMatches &&
              entry.correctWinners === prev.correctWinners
            ) {
              entry.rank = prev.rank;
            } else {
              entry.rank = index + 1;
            }
          }
        });

        setRanking(entries);
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-600">Cargando ranking...</span>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const hasParticipants = ranking.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Ranking en Vivo</h1>
        <p className="text-gray-600">
          Clasificación actualizada en tiempo real según los resultados del Mundial FIFA 2026
        </p>
      </div>

      {!hasParticipants ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Trophy className="size-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-900 mb-2">Aún no hay participantes</h3>
          <p className="text-gray-600">
            Sé el primero en enviar tu predicción para aparecer en el ranking.
          </p>
        </div>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {top3.map((participant, index) => {
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
                const isCurrentUser = participant.userId === currentUserId;

                return (
                  <div
                    key={participant.userId}
                    className={`bg-gradient-to-br ${style.bgGradient} border ${style.border} rounded-xl p-6 text-center shadow-lg ${
                      index === 0 ? 'md:order-2 md:scale-105 md:-mt-4' : index === 1 ? 'md:order-1' : 'md:order-3'
                    } ${isCurrentUser ? 'ring-2 ring-orange-500' : ''}`}
                  >
                    <div className={`w-16 h-16 ${style.badgeBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md`}>
                      <Icon className="size-10 text-white" />
                    </div>
                    <div className="text-5xl mb-2 text-gray-900">{index + 1}°</div>
                    <h3 className="text-gray-900 mb-3">
                      {participant.userName}
                      {isCurrentUser && <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Tú</span>}
                    </h3>
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
          )}

          {/* Full Ranking Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-gray-900">Clasificación Completa</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sistema de puntuación: 5 puntos (exacto) | 3 puntos (ganador) | 
                Participantes: {ranking.length}
              </p>
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
                {ranking.map((participant, index) => {
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
                            {participant.rank}
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
        </>
      )}

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
          <h3 className="text-gray-900 mb-2">Empates</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Puntos totales</p>
            <p>2. Marcadores exactos</p>
            <p>3. Ganadores correctos</p>
            <p className="mt-2 text-orange-600 font-medium">
              Si empatan, comparten posición y dividen el premio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
