import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, PhaseScore } from '../utils/types';
import { Users, Eye, CheckCircle2, Search, Trophy, Loader2, X, Lock, Users as UsersIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { calculateScore, calculateTotalScore } from '../utils/scoring';
import { TeamDisplay } from './TeamDisplay';
import { TournamentPhase, PHASES, isPhaseCompleted, SCORING } from '../utils/constants';

interface UserPrediction {
  odId: string;
  userId: string;
  userName: string;
  // Nuevo sistema
  phases?: {
    [key in TournamentPhase]?: {
      matchPredictions: { [matchId: string]: { score1: number; score2: number } };
      teamsAdvancing: string[];
    };
  };
  scores?: { [key in TournamentPhase]?: PhaseScore };
  // Sistema antiguo (compatibilidad)
  groupPredictions?: { [matchId: string]: { score1: number; score2: number } };
  submittedAt?: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
  teamsBonus: number;
}

interface MatchComparisonProps {
  predicted: { score1: number; score2: number; team1: string; team2: string };
  actual?: Match;
  matchId: string;
}

// Helper para verificar si un partido tiene resultado oficial
function hasOfficialResult(match: Match | undefined): boolean {
  return !!(match && 
    match.score1 !== undefined && match.score1 !== null &&
    match.score2 !== undefined && match.score2 !== null);
}

function MatchComparison({ predicted, actual, matchId }: MatchComparisonProps) {
  const getMatchResult = (score1: number, score2: number): 'win1' | 'win2' | 'draw' => {
    if (score1 > score2) return 'win1';
    if (score2 > score1) return 'win2';
    return 'draw';
  };

  const hasResult = hasOfficialResult(actual);

  const isExactMatch =
    hasResult &&
    predicted.score1 === actual!.score1 &&
    predicted.score2 === actual!.score2;

  const isCorrectWinner =
    hasResult &&
    !isExactMatch &&
    getMatchResult(predicted.score1, predicted.score2) === getMatchResult(actual!.score1!, actual!.score2!);

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
        {hasResult && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 rounded text-xs">
            <span className="font-bold text-slate-600 w-3 text-center">{actual!.score1}</span>
            <span className="text-slate-400">-</span>
            <span className="font-bold text-slate-600 w-3 text-center">{actual!.score2}</span>
          </div>
        )}
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
      <div className="w-16 text-right">
        {hasResult ? (
          isExactMatch ? (
            <span className="text-emerald-600 text-xs font-bold">+{SCORING.EXACT_MATCH}</span>
          ) : isCorrectWinner ? (
            <span className="text-[#1E3A5F] text-xs font-bold">+{SCORING.CORRECT_WINNER}</span>
          ) : (
            <span className="text-red-500 text-xs font-bold">0</span>
          )
        ) : (
          <span className="text-slate-400 text-xs">Pendiente</span>
        )}
      </div>
    </div>
  );
}

// Los 12 grupos del Mundial 2026
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function Community() {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<UserPrediction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<TournamentPhase>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

  // Fases visibles: solo las que ya iniciaron o están completas
  const visiblePhases = PHASES.filter(phase => isPhaseCompleted(phase.id) || phase.id === 'groups');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener todos los partidos oficiales
        const matchesSnap = await getDocs(collection(db, 'partidos'));
        const matchesData: Match[] = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];
        setMatches(matchesData);

        // 2. Obtener todas las predicciones
        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        const predictionsData: UserPrediction[] = [];

        for (const pollaDoc of pollasSnap.docs) {
          const data = pollaDoc.data();
          
          // Detectar si usa el nuevo sistema de fases
          if (data.phases) {
            // Nuevo sistema
            const phaseScores = data.scores as { [key in TournamentPhase]?: PhaseScore } || {};
            const totals = calculateTotalScore(phaseScores);
            
            predictionsData.push({
              odId: pollaDoc.id,
              userId: data.userId || pollaDoc.id,
              userName: data.userName || 'Anónimo',
              phases: data.phases,
              scores: phaseScores,
              submittedAt: data.submittedAt?.toDate?.().toLocaleDateString('es-ES') || 'N/A',
              totalPoints: totals.totalPoints,
              exactMatches: totals.totalExactMatches,
              correctWinners: totals.totalCorrectWinners,
              teamsBonus: totals.totalTeamsBonus,
            });
          } else {
            // Sistema antiguo
            const groupPredictions = data.groupPredictions || {};
            
            const predictionMap: { [matchId: string]: { score1: number; score2: number } } = {};
            for (const [matchId, pred] of Object.entries(groupPredictions)) {
              const p = pred as { score1?: number; score2?: number };
              if (p.score1 !== undefined && p.score2 !== undefined) {
                predictionMap[matchId] = { score1: p.score1, score2: p.score2 };
              }
            }

            const score = calculateScore(predictionMap, matchesData);

            predictionsData.push({
              odId: pollaDoc.id,
              userId: data.userId || pollaDoc.id,
              userName: data.userName || 'Anónimo',
              groupPredictions: predictionMap,
              submittedAt: data.submittedAt?.toDate?.().toLocaleDateString('es-ES') || 'N/A',
              totalPoints: score.totalPoints,
              exactMatches: score.exactMatches,
              correctWinners: score.correctWinners,
              teamsBonus: 0,
            });
          }
        }

        // Ordenar por puntos
        predictionsData.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
          return b.correctWinners - a.correctWinners;
        });
        setPredictions(predictionsData);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPredictions = predictions.filter(p => 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar partidos por grupo (para fase de grupos)
  const matchesByGroup: { [group: string]: Match[] } = {};
  matches.filter(m => !m.phase || m.phase === 'groups').forEach(m => {
    if (!matchesByGroup[m.group]) matchesByGroup[m.group] = [];
    matchesByGroup[m.group].push(m);
  });

  // Obtener predicciones del usuario para la fase actual
  const getUserPhasePredictions = (user: UserPrediction) => {
    if (user.phases && user.phases[selectedPhase]) {
      return user.phases[selectedPhase]!.matchPredictions || {};
    }
    // Sistema antiguo - solo tiene grupos
    if (selectedPhase === 'groups' && user.groupPredictions) {
      return user.groupPredictions;
    }
    return {};
  };

  // Obtener equipos que el usuario predijo que avanzan
  const getUserTeamsAdvancing = (user: UserPrediction) => {
    if (user.phases && user.phases[selectedPhase]) {
      return user.phases[selectedPhase]!.teamsAdvancing || [];
    }
    return [];
  };

  // Stats del usuario para la fase actual
  const getPhaseStats = (user: UserPrediction) => {
    if (user.scores && user.scores[selectedPhase]) {
      return user.scores[selectedPhase]!;
    }
    return { exactMatches: 0, correctWinners: 0, teamsAdvancedBonus: 0, totalPoints: 0 };
  };

  // Stats por grupo para fase de grupos
  const getGroupStats = (userPredictions: { [matchId: string]: { score1: number; score2: number } }, groupId: string) => {
    let exact = 0, correct = 0, incorrect = 0;
    const groupMatches = matchesByGroup[groupId] || [];
    
    groupMatches.forEach(match => {
      const pred = userPredictions[match.id];
      if (pred && hasOfficialResult(match)) {
        if (pred.score1 === match.score1 && pred.score2 === match.score2) exact++;
        else {
          const predResult = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? -1 : 0;
          const actualResult = match.score1! > match.score2! ? 1 : match.score1! < match.score2! ? -1 : 0;
          if (predResult === actualResult) correct++;
          else incorrect++;
        }
      }
    });
    return { exact, correct, incorrect, points: exact * SCORING.EXACT_MATCH + correct * SCORING.CORRECT_WINNER };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 min-h-[60vh]">
        <Loader2 className="size-12 animate-spin text-[#1E3A5F] mb-4" />
        <span className="text-slate-600 font-medium">Cargando predicciones...</span>
      </div>
    );
  }

  // Datos para el usuario seleccionado
  const currentPredictions = selectedPrediction ? getUserPhasePredictions(selectedPrediction) : {};
  const currentTeamsAdvancing = selectedPrediction ? getUserTeamsAdvancing(selectedPrediction) : [];
  const currentPhaseStats = selectedPrediction ? getPhaseStats(selectedPrediction) : null;
  
  // Para fase de grupos, filtrar por grupo seleccionado
  const groupMatchesList = matchesByGroup[selectedGroup] || [];
  const currentGroupStats = selectedPrediction ? getGroupStats(currentPredictions, selectedGroup) : { exact: 0, correct: 0, incorrect: 0, points: 0 };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="size-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Comunidad</h1>
          <p className="text-slate-500 text-sm">Consulta las predicciones de todos los participantes</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[#1E3A5F]/10 text-[#1E3A5F] px-4 py-2 rounded-xl font-semibold">
          <Users className="size-5" />
          <span>{predictions.length}</span>
        </div>
      </div>

      {/* Selector de Fase */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {PHASES.map(phase => {
          const isVisible = isPhaseCompleted(phase.id) || phase.id === 'groups';
          const isSelected = selectedPhase === phase.id;
          
          return (
            <button
              key={phase.id}
              onClick={() => isVisible && setSelectedPhase(phase.id)}
              disabled={!isVisible}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#1E3A5F] text-white shadow-md'
                  : isVisible
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              {!isVisible && <Lock className="size-3" />}
              {phase.name}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar participante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 bg-white border-2 border-slate-200 text-slate-900 rounded-xl h-12 focus:border-[#1E3A5F]"
        />
      </div>

      {predictions.length === 0 ? (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="size-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no hay predicciones</h3>
            <p className="text-slate-500">Sé el primero en enviar tu polla.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de participantes (izquierda) */}
          <div className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {filteredPredictions.map((prediction, index) => (
              <Card
                key={prediction.odId}
                className={`border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPrediction?.odId === prediction.odId 
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedPrediction(prediction)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Ranking */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-gradient-to-br from-[#D4A824] to-[#B8941E] text-white' :
                      index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{prediction.userName}</h3>
                      <p className="text-xs text-slate-500">{prediction.submittedAt}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-[#E85D24]">{prediction.totalPoints}</div>
                      <div className="text-xs text-slate-500">pts</div>
                    </div>
                  </div>
                  
                  {/* Mini stats */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                      <CheckCircle2 className="size-3" /> {prediction.exactMatches}
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-[#1E3A5F]/10 text-[#1E3A5F] px-2 py-1 rounded">
                      <Trophy className="size-3" /> {prediction.correctWinners}
                    </span>
                    {prediction.teamsBonus > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-[#D4A824]/10 text-[#D4A824] px-2 py-1 rounded">
                        <UsersIcon className="size-3" /> {prediction.teamsBonus}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPredictions.length === 0 && searchTerm && (
              <div className="text-center py-8 text-slate-500">
                No se encontró "{searchTerm}"
              </div>
            )}
          </div>

          {/* Detalle de predicción (derecha) */}
          <div className="lg:col-span-2">
            {selectedPrediction ? (
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden sticky top-4">
                {/* Header del usuario */}
                <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Trophy className="size-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{selectedPrediction.userName}</h3>
                        <p className="text-white/70 text-sm">{selectedPrediction.submittedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-[#E85D24] text-white px-3 py-1.5 rounded-lg font-bold">
                        {selectedPrediction.totalPoints} pts
                      </div>
                      <button 
                        onClick={() => setSelectedPrediction(null)}
                        className="lg:hidden w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                      >
                        <X className="size-4 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats del usuario */}
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm">
                      <CheckCircle2 className="size-4" />
                      <span className="font-bold">{selectedPrediction.exactMatches}</span>
                      <span className="opacity-80">exactos</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm">
                      <Trophy className="size-4" />
                      <span className="font-bold">{selectedPrediction.correctWinners}</span>
                      <span className="opacity-80">ganadores</span>
                    </div>
                    {selectedPrediction.teamsBonus > 0 && (
                      <div className="flex items-center gap-1.5 bg-[#D4A824] text-white px-3 py-1.5 rounded-lg text-sm">
                        <UsersIcon className="size-4" />
                        <span className="font-bold">{selectedPrediction.teamsBonus}</span>
                        <span className="opacity-80">equipos</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de Grupos (solo para fase de grupos) */}
                {selectedPhase === 'groups' && (
                  <div className="p-4 border-b border-slate-100">
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
                      {GROUPS.map(g => {
                        const stats = getGroupStats(currentPredictions, g);
                        const isSelected = selectedGroup === g;
                        const hasPoints = stats.points > 0;
                        
                        return (
                          <button
                            key={g}
                            onClick={() => setSelectedGroup(g)}
                            className={`relative aspect-square rounded-lg font-bold text-sm transition-all ${
                              isSelected 
                                ? 'bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white shadow-md scale-105' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {g}
                            {hasPoints && !isSelected && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {stats.points}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Header del grupo/fase */}
                <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {selectedPhase === 'groups' ? selectedGroup : PHASES.find(p => p.id === selectedPhase)?.name.slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {selectedPhase === 'groups' ? `Grupo ${selectedGroup}` : PHASES.find(p => p.id === selectedPhase)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPhase === 'groups' ? (
                      <>
                        {currentGroupStats.exact > 0 && (
                          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {currentGroupStats.exact}✓
                          </span>
                        )}
                        {currentGroupStats.correct > 0 && (
                          <span className="bg-[#1E3A5F] text-white text-xs font-bold px-2 py-1 rounded">
                            {currentGroupStats.correct}~
                          </span>
                        )}
                        <span className="bg-[#D4A824] text-white text-xs font-bold px-2 py-1 rounded ml-1">
                          {currentGroupStats.points} pts
                        </span>
                      </>
                    ) : currentPhaseStats && (
                      <>
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">
                          {currentPhaseStats.exactMatches}✓
                        </span>
                        <span className="bg-[#1E3A5F] text-white text-xs font-bold px-2 py-1 rounded">
                          {currentPhaseStats.correctWinners}~
                        </span>
                        <span className="bg-[#D4A824] text-white text-xs font-bold px-2 py-1 rounded ml-1">
                          {currentPhaseStats.totalPoints} pts
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de partidos */}
                <CardContent className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedPhase === 'groups' ? (
                    // Fase de grupos - mostrar partidos del grupo seleccionado
                    groupMatchesList.length > 0 ? (
                      groupMatchesList.map((match) => {
                        const pred = currentPredictions[match.id];
                        if (!pred) return null;
                        return (
                          <MatchComparison
                            key={match.id}
                            matchId={match.id}
                            predicted={{ ...pred, team1: match.team1, team2: match.team2 }}
                            actual={match}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        Sin predicciones para este grupo
                      </div>
                    )
                  ) : (
                    // Fases knockout - mostrar todos los partidos de la fase
                    <div className="text-center py-8 text-slate-400">
                      Predicciones de {PHASES.find(p => p.id === selectedPhase)?.name} próximamente
                    </div>
                  )}

                  {/* Equipos que avanzan (solo grupos) */}
                  {selectedPhase === 'groups' && currentTeamsAdvancing.length > 0 && (
                    <div className="mt-4 p-4 bg-[#D4A824]/10 rounded-xl border-2 border-[#D4A824]/30">
                      <div className="flex items-center gap-2 mb-3">
                        <UsersIcon className="size-5 text-[#D4A824]" />
                        <span className="font-semibold text-slate-900">Equipos que predijo que avanzan</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentTeamsAdvancing.map(team => (
                          <div key={team} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <TeamDisplay team={team} flagSize="sm" className="text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="size-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Selecciona un participante</h3>
                  <p className="text-slate-500 text-sm">Haz clic en un usuario de la lista para ver su predicción</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}