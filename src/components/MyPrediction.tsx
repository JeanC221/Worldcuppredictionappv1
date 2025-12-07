import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match } from '../utils/types';
import { CheckCircle2, XCircle, Calendar, Trophy, TrendingUp, Loader2, ClipboardList } from 'lucide-react';
import { PredictionForm } from './PredictionForm';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
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
      <div className="w-16 text-right">
        {hasResult ? (
          isExactMatch ? (
            <span className="text-emerald-600 text-xs font-bold">+5</span>
          ) : isCorrectWinner ? (
            <span className="text-[#1E3A5F] text-xs font-bold">+3</span>
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

export function MyPrediction() {
  const [loading, setLoading] = useState(true);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [actualMatchesMap, setActualMatchesMap] = useState<{ [key: string]: Match }>({});
  const [predictionsByGroup, setPredictionsByGroup] = useState<{ [group: string]: Match[] }>({});
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

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
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin size-12 text-[#1E3A5F] mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Cargando predicción...</p>
        </div>
      </div>
    );
  }

  if (!userPrediction) {
    return <PredictionForm />;
  }

  const groups = Object.keys(predictionsByGroup).sort();

  // Estadísticas totales
  let totalExact = 0, totalCorrectWinner = 0, totalIncorrect = 0;
  groups.forEach((groupId) => {
    predictionsByGroup[groupId].forEach((predicted) => {
      const actual = actualMatchesMap[predicted.id];
      if (hasOfficialResult(actual)) {
        if (predicted.score1 === actual.score1 && predicted.score2 === actual.score2) totalExact++;
        else {
          const predResult = predicted.score1! > predicted.score2! ? 1 : predicted.score1! < predicted.score2! ? -1 : 0;
          const actualResult = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
          if (predResult === actualResult) totalCorrectWinner++;
          else totalIncorrect++;
        }
      }
    });
  });
  const totalPoints = totalExact * 5 + totalCorrectWinner * 3;

  // Stats por grupo
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

  const formatSubmittedAt = () => {
    if (!userPrediction.submittedAt) return 'N/A';
    if (userPrediction.submittedAt.toDate) {
      return userPrediction.submittedAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return new Date(userPrediction.submittedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const currentGroupStats = getGroupStats(selectedGroup);
  const currentPredictions = predictionsByGroup[selectedGroup] || [];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#D4A824] to-[#B8941E] rounded-2xl flex items-center justify-center shadow-lg">
          <ClipboardList className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Predicción</h1>
          <p className="text-slate-500 text-sm">Compara tus predicciones con los resultados</p>
        </div>
      </div>

      {/* Stats Summary - Compacto */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white rounded-xl">
          <CardContent className="p-3 text-center">
            <TrendingUp className="size-5 mx-auto mb-1 opacity-80" />
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-[10px] opacity-70 uppercase">Puntos</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-xl">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="size-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-2xl font-bold text-emerald-600">{totalExact}</div>
            <div className="text-[10px] text-slate-500 uppercase">Exactos</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-xl">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="size-5 mx-auto mb-1 text-[#1E3A5F]" />
            <div className="text-2xl font-bold text-[#1E3A5F]">{totalCorrectWinner}</div>
            <div className="text-[10px] text-slate-500 uppercase">Ganador</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-xl">
          <CardContent className="p-3 text-center">
            <XCircle className="size-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold text-red-500">{totalIncorrect}</div>
            <div className="text-[10px] text-slate-500 uppercase">Fallos</div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Alert className="mb-6 border-2 border-[#1E3A5F]/20 bg-[#1E3A5F]/5 rounded-xl py-3">
        <Trophy className="size-4 text-[#D4A824]" />
        <AlertDescription className="text-[#1E3A5F] text-sm ml-2">
          <span className="font-bold">{userPrediction.userName}</span> — {formatSubmittedAt()}
        </AlertDescription>
      </Alert>

      {/* Selector de Grupos - 12 cuadrados */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Fase de Grupos</h2>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {groups.map(g => {
            const stats = getGroupStats(g);
            const isSelected = selectedGroup === g;
            const hasPoints = stats.points > 0;
            
            return (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`relative aspect-square rounded-xl font-bold text-lg transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-[#1E3A5F] hover:shadow-md'
                }`}
              >
                {g}
                {/* Indicador de puntos */}
                {hasPoints && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {stats.points}
                  </span>
                )}
                {/* Indicadores de resultados */}
                {isSelected && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {stats.exact > 0 && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
                    {stats.correct > 0 && <span className="w-2 h-2 bg-white/60 rounded-full" />}
                    {stats.incorrect > 0 && <span className="w-2 h-2 bg-red-400 rounded-full" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixture del grupo seleccionado */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        {/* Header del grupo */}
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{selectedGroup}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Grupo {selectedGroup}</h3>
              <p className="text-white/70 text-sm">{currentPredictions.length} partidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentGroupStats.exact > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="size-4" />
                <span className="font-bold text-sm">{currentGroupStats.exact}</span>
              </div>
            )}
            {currentGroupStats.correct > 0 && (
              <div className="flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="size-4" />
                <span className="font-bold text-sm">{currentGroupStats.correct}</span>
              </div>
            )}
            {currentGroupStats.incorrect > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg">
                <XCircle className="size-4" />
                <span className="font-bold text-sm">{currentGroupStats.incorrect}</span>
              </div>
            )}
            <div className="ml-2 bg-[#D4A824] text-white px-3 py-1.5 rounded-lg">
              <span className="font-bold text-sm">{currentGroupStats.points} pts</span>
            </div>
          </div>
        </div>

        {/* Lista de partidos */}
        <CardContent className="p-4 space-y-2">
          {currentPredictions.map((predicted) => (
            <MatchComparison
              key={predicted.id}
              predicted={predicted}
              actual={actualMatchesMap[predicted.id]}
            />
          ))}
        </CardContent>
      </Card>

      {/* Knockout Picks */}
      {userPrediction.knockoutPicks && Object.keys(userPrediction.knockoutPicks).length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Fase Final</h2>
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6 text-center">
              {userPrediction.knockoutPicks['F-1'] && (
                <>
                  <div className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Tu Campeón</div>
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#D4A824] via-[#E8C547] to-[#D4A824] text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl">
                    <Trophy className="size-7" />
                    <TeamDisplay team={userPrediction.knockoutPicks['F-1']} flagSize="lg" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}