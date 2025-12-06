import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trophy, Medal, Award, Crown, Loader2, BarChart3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card, CardContent } from './ui/card';
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
        const matchesSnap = await getDocs(collection(db, 'partidos'));
        const matches: Match[] = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        
        const entries: RankingEntry[] = [];

        for (const pollaDoc of pollasSnap.docs) {
          const data = pollaDoc.data();
          const predictions = data.groupPredictions || {};
          
          const predictionMap: { [matchId: string]: { score1: number; score2: number } } = {};
          for (const [matchId, pred] of Object.entries(predictions)) {
            const p = pred as { score1?: number; score2?: number };
            if (p.score1 !== undefined && p.score2 !== undefined) {
              predictionMap[matchId] = { score1: p.score1, score2: p.score2 };
            }
          }

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

        entries.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
          return b.correctWinners - a.correctWinners;
        });

        entries.forEach((entry, index) => {
          if (index === 0) {
            entry.rank = 1;
          } else {
            const prev = entries[index - 1];
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
        <Loader2 className="size-8 animate-spin text-[#1E3A5F]" />
        <span className="ml-3 text-slate-600">Cargando ranking...</span>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const hasParticipants = ranking.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#D4A824] to-[#B8941E] rounded-2xl flex items-center justify-center shadow-lg">
          <BarChart3 className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ranking en Vivo</h1>
          <p className="text-slate-500">
            Clasificación actualizada en tiempo real según los resultados del Mundial FIFA 2026
          </p>
        </div>
      </div>

      {!hasParticipants ? (
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="size-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no hay participantes</h3>
            <p className="text-slate-500">
              Sé el primero en enviar tu predicción para aparecer en el ranking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Podium - Top 3 */}
          {top3.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {top3.map((participant, index) => {
                const styles = [
                  { 
                    icon: Trophy, 
                    iconColor: 'text-white', 
                    bgGradient: 'from-[#D4A824] to-[#B8941E]', 
                    border: 'border-[#D4A824]',
                    badgeBg: 'bg-[#D4A824]',
                    cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100'
                  },
                  { 
                    icon: Medal, 
                    iconColor: 'text-white', 
                    bgGradient: 'from-slate-400 to-slate-500', 
                    border: 'border-slate-300',
                    badgeBg: 'bg-slate-400',
                    cardBg: 'bg-gradient-to-br from-slate-50 to-slate-100'
                  },
                  { 
                    icon: Award, 
                    iconColor: 'text-white', 
                    bgGradient: 'from-[#E85D24] to-[#C44D1A]', 
                    border: 'border-[#E85D24]',
                    badgeBg: 'bg-[#E85D24]',
                    cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100'
                  },
                ];
                const style = styles[index];
                const Icon = style.icon;
                const isCurrentUser = participant.userId === currentUserId;

                return (
                  <div
                    key={participant.userId}
                    className={`${style.cardBg} border-2 ${style.border} rounded-2xl p-6 text-center shadow-lg ${
                      index === 0 ? 'md:order-2 md:scale-105 md:-mt-4' : index === 1 ? 'md:order-1' : 'md:order-3'
                    } ${isCurrentUser ? 'ring-4 ring-[#1E3A5F]/30' : ''}`}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${style.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className={`size-8 ${style.iconColor}`} />
                    </div>
                    <div className="text-5xl font-bold mb-2 text-slate-900">{index + 1}°</div>
                    <h3 className="text-slate-900 font-semibold mb-3 text-lg">
                      {participant.userName}
                      {isCurrentUser && <span className="ml-2 text-xs bg-[#1E3A5F] text-white px-2 py-1 rounded-lg">Tú</span>}
                    </h3>
                    <div className="inline-block bg-white border-2 border-slate-200 rounded-xl px-6 py-3 mb-4 shadow-sm">
                      <div className="text-4xl font-bold text-[#E85D24]">{participant.totalPoints}</div>
                      <div className="text-xs text-slate-500 mt-1">puntos</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white border-2 border-slate-200 rounded-xl p-3">
                        <div className="text-slate-500 text-xs mb-1">Exactos</div>
                        <div className="text-emerald-600 text-xl font-bold">{participant.exactMatches}</div>
                      </div>
                      <div className="bg-white border-2 border-slate-200 rounded-xl p-3">
                        <div className="text-slate-500 text-xs mb-1">Ganadores</div>
                        <div className="text-[#1E3A5F] text-xl font-bold">{participant.correctWinners}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Ranking Table */}
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] px-6 py-4">
              <h2 className="text-white font-bold text-lg">Clasificación Completa</h2>
              <p className="text-sm text-slate-300 mt-1">
                Sistema de puntuación: 5 puntos (exacto) | 3 puntos (ganador) | 
                Participantes: {ranking.length}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent bg-slate-50">
                  <TableHead className="text-slate-600 font-semibold w-20">Pos.</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Participante</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Puntos</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Exactos</TableHead>
                  <TableHead className="text-slate-600 font-semibold text-right">Ganadores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((participant, index) => {
                  const isCurrentUser = participant.userId === currentUserId;
                  const isTop3 = index < 3;
                  
                  return (
                    <TableRow
                      key={participant.userId}
                      className={`border-slate-200 ${
                        isCurrentUser
                          ? 'bg-[#1E3A5F]/5 border-l-4 border-l-[#1E3A5F]'
                          : isTop3
                          ? 'bg-amber-50/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {index === 0 && <Crown className="size-5 text-[#D4A824]" />}
                          {index === 1 && <Medal className="size-5 text-slate-400" />}
                          {index === 2 && <Award className="size-5 text-[#E85D24]" />}
                          <span className={`text-lg font-medium ${isTop3 ? 'text-slate-900' : 'text-slate-700'}`}>
                            {participant.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-medium">{participant.userName}</span>
                          {isCurrentUser && (
                            <span className="bg-[#1E3A5F] text-white text-xs px-2 py-0.5 rounded-lg font-medium">
                              Tú
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-center bg-[#E85D24]/10 border-2 border-[#E85D24]/20 rounded-xl px-4 py-2">
                          <span className="text-2xl font-bold text-[#E85D24]">{participant.totalPoints}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl">
                          <Trophy className="size-4" />
                          <span className="text-lg font-bold">{participant.exactMatches}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1 bg-[#1E3A5F]/10 border-2 border-[#1E3A5F]/20 text-[#1E3A5F] px-3 py-1.5 rounded-xl">
                          <Award className="size-4" />
                          <span className="text-lg font-bold">{participant.correctWinners}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Scoring System Info */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="size-7 text-emerald-600" />
            </div>
            <h3 className="text-slate-900 font-bold mb-2 text-lg">Marcador Exacto</h3>
            <div className="text-4xl font-bold text-emerald-600 mb-2">+5</div>
            <p className="text-sm text-slate-500">
              Predijiste el resultado exacto del partido
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="w-14 h-14 bg-[#1E3A5F]/10 rounded-2xl flex items-center justify-center mb-4">
              <Award className="size-7 text-[#1E3A5F]" />
            </div>
            <h3 className="text-slate-900 font-bold mb-2 text-lg">Ganador Correcto</h3>
            <div className="text-4xl font-bold text-[#1E3A5F] mb-2">+3</div>
            <p className="text-sm text-slate-500">
              Acertaste el ganador pero no el marcador exacto
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Medal className="size-7 text-slate-600" />
            </div>
            <h3 className="text-slate-900 font-bold mb-2 text-lg">Desempates</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <p>1. Puntos totales</p>
              <p>2. Marcadores exactos</p>
              <p>3. Ganadores correctos</p>
              <p className="mt-3 text-[#E85D24] font-medium">
                Si empatan, comparten posición
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
