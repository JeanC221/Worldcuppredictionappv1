import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match, PhaseScore } from '../utils/types';
import { PHASES, GROUPS, TournamentPhase } from '../utils/constants';
import { calculateScore, calculateTeamsBonus } from '../utils/scoring';
import { CheckCircle2, XCircle, Trophy, TrendingUp, Loader2, ClipboardList, Award, Users } from 'lucide-react';
import { PredictionForm } from './PredictionForm';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TeamDisplay } from './TeamDisplay';

interface MatchComparisonProps {
  predicted: Match;
  actual?: Match;
}

// Helper para verificar si un partido tiene resultado oficial
function hasOfficialResult(match: Match | undefined): boolean {
  return !!(match && 
    match.score1 !== undefined && match.score1 !== null &&
    match.score2 !== undefined && match.score2 !== null);
}

function MatchComparison({ predicted, actual }: MatchComparisonProps) {
  const getMatchResult = (match: Match): 'win1' | 'win2' | 'draw' | 'pending' => {
    if (!hasOfficialResult(match)) return 'pending';
    if (match.score1! > match.score2!) return 'win1';
    if (match.score2! > match.score1!) return 'win2';
    return 'draw';
  };

  const hasResult = hasOfficialResult(actual);
  const isExactMatch = hasResult && predicted.score1 === actual!.score1 && predicted.score2 === actual!.score2;
  const isCorrectWinner = hasResult && !isExactMatch && getMatchResult(predicted) === getMatchResult(actual!);
  const isIncorrect = hasResult && !isExactMatch && !isCorrectWinner;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      isExactMatch ? 'bg-emerald-50 border-2 border-emerald-300' :
      isCorrectWinner ? 'bg-[#1E3A5F]/5 border-2 border-[#1E3A5F]/30' :
      isIncorrect ? 'bg-red-50 border-2 border-red-300' :
      'bg-slate-50 border-2 border-slate-200'
    }`}>
      {/* Equipo 1 */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <TeamDisplay team={predicted.team1} reverse className="text-slate-800 text-sm font-medium" flagSize="md" />
      </div>

      {/* Scores */}
      <div className="flex flex-col items-center gap-1">
        {/* Resultado Real */}
        {hasResult && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 rounded text-xs">
            <span className="font-bold text-slate-600 w-3 text-center">{actual!.score1}</span>
            <span className="text-slate-400">-</span>
            <span className="font-bold text-slate-600 w-3 text-center">{actual!.score2}</span>
          </div>
        )}
        {/* Predicción */}
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
          isExactMatch ? 'bg-emerald-500 text-white' :
          isCorrectWinner ? 'bg-[#1E3A5F] text-white' :
          isIncorrect ? 'bg-red-500 text-white' :
          'bg-white border-2 border-slate-300 text-slate-900'
        }`}>
          <span className="font-bold text-lg w-4 text-center">{predicted.score1}</span>
          <span className="opacity-60">-</span>
          <span className="font-bold text-lg w-4 text-center">{predicted.score2}</span>
        </div>
      </div>

      {/* Equipo 2 */}
      <div className="flex-1 flex items-center justify-start gap-2">
        <TeamDisplay team={predicted.team2} className="text-slate-800 text-sm font-medium" flagSize="md" />
      </div>

      {/* Badge */}
      <div className="w-12 text-right">
        {hasResult ? (
          isExactMatch ? <span className="text-emerald-600 text-xs font-bold">+5</span> :
          isCorrectWinner ? <span className="text-[#1E3A5F] text-xs font-bold">+3</span> :
          <span className="text-red-500 text-xs font-bold">0</span>
        ) : <span className="text-slate-400 text-xs">--</span>}
      </div>
    </div>
  );
}

export function MyPrediction() {
  const [loading, setLoading] = useState(true);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [actualMatchesMap, setActualMatchesMap] = useState<{ [key: string]: Match }>({});
  const [predictionsByGroup, setPredictionsByGroup] = useState<{ [group: string]: Match[] }>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [phaseScores, setPhaseScores] = useState<{ [key: string]: PhaseScore }>({});

  useEffect(() => {
    const fetchData = async (uid: string) => {
      try {
        // Cargar partidos reales
        const querySnapshot = await getDocs(collection(db, 'partidos'));
        const matchesMap: { [key: string]: Match } = {};
        querySnapshot.forEach((docSnap) => {
          matchesMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Match;
        });
        setActualMatchesMap(matchesMap);

        // Cargar predicción del usuario
        const docRef = doc(db, 'polla_completa', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPrediction(data);

          // Agrupar predicciones por grupo
          const grouped: { [group: string]: Match[] } = {};
          const predictions = data.groupPredictions || {};

          for (const [matchId, pred] of Object.entries(predictions)) {
            const originalMatch = matchesMap[matchId];
            if (originalMatch) {
              const group = originalMatch.group;
              if (!grouped[group]) grouped[group] = [];
              
              const p = pred as { score1: number; score2: number };
              grouped[group].push({
                ...originalMatch,
                score1: p.score1,
                score2: p.score2,
              });
            }
          }

          Object.keys(grouped).forEach(g => {
            grouped[g].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          });

          setPredictionsByGroup(grouped);

          // Calcular puntuación por fase
          const actualMatches = Object.values(matchesMap);
          const groupScore = calculateScore(predictions, actualMatches);
          
          // Calcular bonus de equipos (si hay datos de equipos que pasaron)
          const teamsBonus = data.phases?.groups?.teamsAdvancing 
            ? calculateTeamsBonus(data.phases.groups.teamsAdvancing, data.actualTeamsAdvanced || [])
            : { teamsCorrect: 0, bonusPoints: 0 };

          setPhaseScores({
            groups: {
              phase: 'groups',
              exactMatches: groupScore.exactMatches,
              correctWinners: groupScore.correctWinners,
              teamsAdvancedBonus: teamsBonus.teamsCorrect,
              matchPoints: groupScore.totalPoints,
              bonusPoints: teamsBonus.bonusPoints,
              totalPoints: groupScore.totalPoints + teamsBonus.bonusPoints
            }
          });
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchData(user.uid);
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin size-12 text-[#1E3A5F]" />
      </div>
    );
  }

  if (!userPrediction) return <PredictionForm />;

  const groups = Object.keys(predictionsByGroup).sort();
  const groupScore = phaseScores.groups;
  const totalPoints = groupScore?.totalPoints || 0;

  const getGroupStats = (groupId: string) => {
    let exact = 0, correct = 0, incorrect = 0;
    predictionsByGroup[groupId]?.forEach((p) => {
      const actual = actualMatchesMap[p.id];
      if (hasOfficialResult(actual)) {
        if (p.score1 === actual.score1 && p.score2 === actual.score2) exact++;
        else {
          const predResult = p.score1! > p.score2! ? 1 : p.score1! < p.score2! ? -1 : 0;
          const actualResult = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
          if (predResult === actualResult) correct++;
          else incorrect++;
        }
      }
    });
    return { exact, correct, incorrect, points: exact * 5 + correct * 3 };
  };

  const currentGroupStats = getGroupStats(selectedGroup);
  const currentPredictions = predictionsByGroup[selectedGroup] || [];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#D4A824] to-[#B8941E] rounded-2xl flex items-center justify-center shadow-lg">
          <ClipboardList className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Predicción</h1>
          <p className="text-slate-500 text-sm">Puntos por fase y total</p>
        </div>
      </div>

      {/* Resumen de puntos por fase */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total</p>
                <p className="text-4xl font-bold">{totalPoints}</p>
                <p className="text-white/50 text-xs mt-1">puntos</p>
              </div>
              <Trophy className="size-10 text-[#D4A824]" />
            </div>
          </CardContent>
        </Card>

        {/* Fase Grupos */}
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Grupos</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">{groupScore?.matchPoints || 0}</p>
                <p className="text-slate-400 text-xs mt-1">
                  +{groupScore?.bonusPoints || 0} bonus
                </p>
              </div>
              <Users className="size-8 text-[#1E3A5F]/30" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Exactos */}
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Exactos</p>
                <p className="text-3xl font-bold text-emerald-600">{groupScore?.exactMatches || 0}</p>
                <p className="text-slate-400 text-xs mt-1">×5 pts c/u</p>
              </div>
              <CheckCircle2 className="size-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Ganadores */}
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Ganador</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">{groupScore?.correctWinners || 0}</p>
                <p className="text-slate-400 text-xs mt-1">×3 pts c/u</p>
              </div>
              <Award className="size-8 text-[#1E3A5F]/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por fases (futuras fases aparecerán aquí) */}
      <Card className="border-0 shadow-md rounded-2xl mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-700">Puntos por Fase</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {PHASES.map(phase => {
              const score = phaseScores[phase.id];
              const isActive = phase.id === 'groups'; // Por ahora solo grupos activo
              return (
                <div key={phase.id} className={`flex items-center justify-between px-5 py-3 ${!isActive ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#1E3A5F]' : 'bg-slate-200'}`}>
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                        {phase.shortName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{phase.name}</p>
                      <p className="text-xs text-slate-500">{phase.matchCount} partidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[#1E3A5F]">{score?.totalPoints || 0}</p>
                    {score && score.bonusPoints > 0 && (
                      <p className="text-xs text-[#D4A824]">+{score.bonusPoints} bonus</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selector de grupos + Partidos */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Fase de Grupos</h2>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {groups.map(g => {
            const stats = getGroupStats(g);
            const isSelected = selectedGroup === g;
            
            return (
              <button key={g} onClick={() => setSelectedGroup(g)}
                className={`relative aspect-square rounded-xl font-bold text-lg transition-all ${
                  isSelected ? 'bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white shadow-lg scale-105' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-[#1E3A5F]'
                }`}
              >
                {g}
                {/* Indicador de puntos */}
                {stats.points > 0 && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {stats.points}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Partidos del grupo seleccionado */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] text-white py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">{selectedGroup}</span>
              </div>
              <div>
                <CardTitle className="text-lg">Grupo {selectedGroup}</CardTitle>
                <p className="text-white/70 text-sm">{currentPredictions.length} partidos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentGroupStats.exact > 0 && (
                <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">{currentGroupStats.exact} exactos</div>
              )}
              <div className="bg-[#D4A824] text-white px-3 py-1.5 rounded-lg text-sm font-bold">{currentGroupStats.points} pts</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {currentPredictions.map((predicted) => (
            <MatchComparison key={predicted.id} predicted={predicted} actual={actualMatchesMap[predicted.id]} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}