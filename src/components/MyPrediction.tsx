import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match, PhaseScore } from '../utils/types';
import { PHASES, GROUPS } from '../utils/constants';
import { calculateScore, calculateTeamsBonus } from '../utils/scoring';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PredictionForm } from './PredictionForm';
import { TeamDisplay } from './TeamDisplay';

function hasOfficialResult(match: Match | undefined): boolean {
  return !!(match && 
    match.score1 !== undefined && match.score1 !== null &&
    match.score2 !== undefined && match.score2 !== null);
}

export function MyPrediction() {
  const [loading, setLoading] = useState(true);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [actualMatchesMap, setActualMatchesMap] = useState<{ [key: string]: Match }>({});
  const [predictionsByGroup, setPredictionsByGroup] = useState<{ [group: string]: Match[] }>({});
  const [expandedGroup, setExpandedGroup] = useState<string | null>('A');
  const [phaseScores, setPhaseScores] = useState<{ [key: string]: PhaseScore }>({});

  useEffect(() => {
    const fetchData = async (uid: string) => {
      try {
        const querySnapshot = await getDocs(collection(db, 'partidos'));
        const matchesMap: { [key: string]: Match } = {};
        querySnapshot.forEach((docSnap) => {
          matchesMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Match;
        });
        setActualMatchesMap(matchesMap);

        const docRef = doc(db, 'polla_completa', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPrediction(data);

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

          const actualMatches = Object.values(matchesMap);
          const groupScore = calculateScore(predictions, actualMatches);
          
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  if (!userPrediction) return <PredictionForm />;

  const groups = Object.keys(predictionsByGroup).sort();
  const groupScore = phaseScores.groups;
  const totalPoints = groupScore?.totalPoints || 0;

  const getGroupStats = (groupId: string) => {
    let exact = 0, correct = 0, wrong = 0, pending = 0;
    predictionsByGroup[groupId]?.forEach((p) => {
      const actual = actualMatchesMap[p.id];
      if (hasOfficialResult(actual)) {
        if (p.score1 === actual.score1 && p.score2 === actual.score2) exact++;
        else {
          const predResult = p.score1! > p.score2! ? 1 : p.score1! < p.score2! ? -1 : 0;
          const actualResult = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
          if (predResult === actualResult) correct++;
          else wrong++;
        }
      } else {
        pending++;
      }
    });
    return { exact, correct, wrong, pending, points: exact * 3 + correct * 1 };
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Mi Predicción</h1>
        <p className="text-[#666]">
          Fase de grupos · {Object.keys(predictionsByGroup).length} grupos completados
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Total</p>
          <p className="text-3xl font-bold text-[#E85D24]">{totalPoints}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Exactos</p>
          <p className="text-3xl font-bold text-green-600">{groupScore?.exactMatches || 0}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Ganador</p>
          <p className="text-3xl font-bold text-blue-600">{groupScore?.correctWinners || 0}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Bonus</p>
          <p className="text-3xl font-bold text-[#1a1a1a]">+{groupScore?.bonusPoints || 0}</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[#666]">Exacto (+3)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[#666]">Ganador (+1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-[#666]">Fallido (0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
          <span className="text-[#666]">Pendiente</span>
        </div>
      </div>

      {/* Grupos */}
      <div className="space-y-2">
        {groups.map((groupId) => {
          const stats = getGroupStats(groupId);
          const isExpanded = expandedGroup === groupId;
          const predictions = predictionsByGroup[groupId] || [];

          return (
            <div
              key={groupId}
              className="bg-white border border-[#eee] rounded-xl overflow-hidden"
            >
              {/* Header del grupo */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : groupId)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white font-bold flex items-center justify-center">
                    {groupId}
                  </span>
                  <div className="text-left">
                    <p className="font-medium text-[#1a1a1a]">Grupo {groupId}</p>
                    <p className="text-sm text-[#999]">{predictions.length} partidos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Mini stats */}
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    {stats.exact > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {stats.exact} exactos
                      </span>
                    )}
                    {stats.correct > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {stats.correct} ganador
                      </span>
                    )}
                  </div>
                  
                  <span className="font-bold text-[#E85D24]">{stats.points} pts</span>
                  
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-[#999]" />
                  ) : (
                    <ChevronDown className="size-5 text-[#999]" />
                  )}
                </div>
              </button>

              {/* Partidos */}
              {isExpanded && (
                <div className="border-t border-[#eee] px-5 py-4 space-y-2">
                  {predictions.map((predicted) => {
                    const actual = actualMatchesMap[predicted.id];
                    const hasResult = hasOfficialResult(actual);
                    
                    let status: 'pending' | 'exact' | 'correct' | 'wrong' = 'pending';
                    let points = 0;
                    
                    if (hasResult) {
                      if (predicted.score1 === actual.score1 && predicted.score2 === actual.score2) {
                        status = 'exact';
                        points = 3;
                      } else {
                        const predWinner = predicted.score1! > predicted.score2! ? 1 : predicted.score1! < predicted.score2! ? -1 : 0;
                        const realWinner = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
                        if (predWinner === realWinner) {
                          status = 'correct';
                          points = 1;
                        } else {
                          status = 'wrong';
                        }
                      }
                    }

                    return (
                      <div
                        key={predicted.id}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg text-sm ${
                          !hasResult ? 'bg-[#fafafa]' :
                          status === 'exact' ? 'bg-green-50 border border-green-200' :
                          status === 'correct' ? 'bg-blue-50 border border-blue-200' :
                          'bg-red-50 border border-red-200'
                        }`}
                      >
                        {/* Equipo 1 */}
                        <div className="flex-1">
                          <TeamDisplay team={predicted.team1} reverse className="text-[#1a1a1a] text-sm" flagSize="sm" />
                        </div>
                        
                        {/* Marcadores */}
                        <div className="flex items-center gap-3 mx-4">
                          {/* Resultado real */}
                          {hasResult && (
                            <span className="text-xs text-[#666] font-mono bg-white px-2 py-0.5 rounded border">
                              {actual.score1}-{actual.score2}
                            </span>
                          )}
                          
                          {/* Predicción */}
                          <span className={`font-mono font-semibold px-2.5 py-1 rounded ${
                            !hasResult ? 'bg-[#e5e5e5] text-[#666]' :
                            status === 'exact' ? 'bg-green-500 text-white' :
                            status === 'correct' ? 'bg-blue-500 text-white' :
                            'bg-red-400 text-white'
                          }`}>
                            {predicted.score1} - {predicted.score2}
                          </span>
                        </div>
                        
                        {/* Equipo 2 */}
                        <div className="flex-1 text-right">
                          <TeamDisplay team={predicted.team2} className="text-[#1a1a1a] text-sm justify-end" flagSize="sm" />
                        </div>
                        
                        {/* Puntos */}
                        <div className="w-12 text-right">
                          {hasResult ? (
                            <span className={`text-xs font-bold ${
                              status === 'exact' ? 'text-green-600' :
                              status === 'correct' ? 'text-blue-600' :
                              'text-red-500'
                            }`}>
                              +{points}
                            </span>
                          ) : (
                            <span className="text-xs text-[#ccc]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fases futuras */}
      <div className="mt-8 p-5 bg-[#f9f9f9] rounded-xl">
        <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">Próximas fases</h3>
        <div className="space-y-2">
          {PHASES.filter(p => p.id !== 'groups').map((phase) => (
            <div key={phase.id} className="flex items-center justify-between py-2 text-sm text-[#999]">
              <span>{phase.name}</span>
              <span className="text-xs bg-[#eee] px-2 py-1 rounded">Próximamente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}