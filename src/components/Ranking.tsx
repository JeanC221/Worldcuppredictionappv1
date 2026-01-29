import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { calculateScore, calculateTotalScore, ScoreResult } from '../utils/scoring';
import { Match, PhaseScore } from '../utils/types';
import { TournamentPhase, SCORING } from '../utils/constants';

interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
  teamsBonus: number;
  phaseScores?: { [key in TournamentPhase]?: PhaseScore };
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

          if (data.phases) {
            const phaseScores = data.scores as { [key in TournamentPhase]?: PhaseScore } || {};
            const totals = calculateTotalScore(phaseScores);

            entries.push({
              rank: 0,
              userId: data.userId || pollaDoc.id,
              userName: data.userName || 'Anónimo',
              totalPoints: totals.totalPoints,
              exactMatches: totals.totalExactMatches,
              correctWinners: totals.totalCorrectWinners,
              teamsBonus: totals.totalTeamsBonus,
              phaseScores,
            });
          } else {
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
              teamsBonus: 0,
            });
          }
        }

        entries.sort((a, b) => b.totalPoints - a.totalPoints);

        entries.forEach((entry, index) => {
          if (index === 0) {
            entry.rank = 1;
          } else {
            const prev = entries[index - 1];
            entry.rank = entry.totalPoints === prev.totalPoints ? prev.rank : index + 1;
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
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Ranking</h1>
        <p className="text-[#666]">
          {ranking.length} participantes · Actualizado en tiempo real
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#999]">Aún no hay participantes en el ranking</p>
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 0, 2].map((orderIndex) => {
              const participant = top3[orderIndex];
              if (!participant) return <div key={orderIndex} />;
              
              const isFirst = orderIndex === 0;
              const isCurrentUser = participant.userId === currentUserId;
              
              return (
                <div
                  key={participant.userId}
                  className={`text-center p-5 rounded-xl border ${
                    isFirst 
                      ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white -mt-4' 
                      : 'bg-white border-[#eee]'
                  } ${isCurrentUser && !isFirst ? 'ring-2 ring-[#E85D24]' : ''}`}
                >
                  <div className={`text-4xl font-bold mb-2 ${isFirst ? 'text-[#E85D24]' : 'text-[#1a1a1a]'}`}>
                    {participant.rank}°
                  </div>
                  <p className={`font-medium truncate mb-3 ${isFirst ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    {participant.userName}
                    {isCurrentUser && <span className="ml-1 text-xs">(tú)</span>}
                  </p>
                  <div className={`text-2xl font-bold ${isFirst ? 'text-white' : 'text-[#E85D24]'}`}>
                    {participant.totalPoints}
                  </div>
                  <p className={`text-xs ${isFirst ? 'text-white/60' : 'text-[#999]'}`}>
                    puntos
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tabla del resto */}
          {rest.length > 0 && (
            <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#eee] text-left">
                    <th className="px-4 py-3 text-xs font-medium text-[#999] uppercase tracking-wide">Pos</th>
                    <th className="px-4 py-3 text-xs font-medium text-[#999] uppercase tracking-wide">Participante</th>
                    <th className="px-4 py-3 text-xs font-medium text-[#999] uppercase tracking-wide text-right">Pts</th>
                    <th className="px-4 py-3 text-xs font-medium text-[#999] uppercase tracking-wide text-right hidden sm:table-cell">Exactos</th>
                    <th className="px-4 py-3 text-xs font-medium text-[#999] uppercase tracking-wide text-right hidden sm:table-cell">Ganador</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((participant) => {
                    const isCurrentUser = participant.userId === currentUserId;
                    return (
                      <tr
                        key={participant.userId}
                        className={`border-b border-[#eee] last:border-0 ${
                          isCurrentUser ? 'bg-[#E85D24]/5' : 'hover:bg-[#fafafa]'
                        }`}
                      >
                        <td className="px-4 py-4">
                          <span className="text-[#999] font-medium">{participant.rank}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-[#1a1a1a]">
                            {participant.userName}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-[#E85D24] font-medium">tú</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-[#E85D24]">{participant.totalPoints}</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden sm:table-cell">
                          <span className="text-[#666]">{participant.exactMatches}</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden sm:table-cell">
                          <span className="text-[#666]">{participant.correctWinners}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sistema de puntos */}
          <div className="mt-8 p-5 bg-[#f9f9f9] rounded-xl">
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">Sistema de puntos</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a]">+{SCORING.EXACT_MATCH}</p>
                <p className="text-xs text-[#666]">Marcador exacto</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a]">+{SCORING.CORRECT_WINNER}</p>
                <p className="text-xs text-[#666]">Ganador correcto</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a]">+{SCORING.TEAM_ADVANCED}</p>
                <p className="text-xs text-[#666]">Equipo avanza</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
