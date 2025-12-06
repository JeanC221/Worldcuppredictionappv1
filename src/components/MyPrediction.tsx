import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match } from '../utils/types';
import { CheckCircle2, XCircle, Calendar, Trophy, TrendingUp, Loader2, ClipboardList } from 'lucide-react';
import { PredictionForm } from './PredictionForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';

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

  const isExactMatch =
    hasResult &&
    predicted.score1 === actual!.score1 &&
    predicted.score2 === actual!.score2;

  const isCorrectWinner =
    hasResult &&
    !isExactMatch &&
    getMatchResult(predicted) === getMatchResult(actual!);

  const isIncorrect =
    hasResult &&
    !isExactMatch &&
    !isCorrectWinner;

  return (
    <div
      className={`border-2 rounded-2xl p-4 transition-all ${
        isExactMatch
          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
          : isCorrectWinner
          ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]/30 shadow-sm'
          : isIncorrect
          ? 'bg-red-50 border-red-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Calendar className="size-3" />
        {predicted.date}
      </div>

      {/* Mostrar resultado real SOLO si existe */}
      {hasResult && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Resultado Real</div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-right">
              <div className="text-slate-900 text-sm mb-1 font-medium">{actual!.team1}</div>
              <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-200">
                <span className="text-xl font-bold text-slate-900">{actual!.score1}</span>
              </div>
            </div>
            <div className="text-center text-slate-400 text-sm font-medium">vs</div>
            <div className="text-left">
              <div className="text-slate-900 text-sm mb-1 font-medium">{actual!.team2}</div>
              <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-200">
                <span className="text-xl font-bold text-slate-900">{actual!.score2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Tu Predicción</div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <div className="text-slate-900 text-sm mb-1 font-medium">{predicted.team1}</div>
            <div
              className={`inline-block px-3 py-1.5 rounded-xl border-2 transition-colors ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <span className="text-xl font-bold">{predicted.score1}</span>
            </div>
          </div>
          <div className="text-center text-slate-400 text-sm font-medium">vs</div>
          <div className="text-left">
            <div className="text-slate-900 text-sm mb-1 font-medium">{predicted.team2}</div>
            <div
              className={`inline-block px-3 py-1.5 rounded-xl border-2 transition-colors ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <span className="text-xl font-bold">{predicted.score2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status badge SOLO si hay resultado */}
      {hasResult && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          {isExactMatch ? (
            <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-semibold bg-emerald-100 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="size-4" />
              <span>Marcador Exacto (+5 pts)</span>
            </div>
          ) : isCorrectWinner ? (
            <div className="inline-flex items-center gap-2 text-[#1E3A5F] text-sm font-semibold bg-[#1E3A5F]/10 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="size-4" />
              <span>Ganador Correcto (+3 pts)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-red-700 text-sm font-semibold bg-red-100 px-3 py-1.5 rounded-lg">
              <XCircle className="size-4" />
              <span>Incorrecto (0 pts)</span>
            </div>
          )}
        </div>
      )}

      {/* Si no hay resultado, mostrar "Pendiente" */}
      {!hasResult && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-lg">
            <Calendar className="size-4" />
            <span>Partido pendiente</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyPrediction() {
  const [loading, setLoading] = useState(true);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [actualMatchesMap, setActualMatchesMap] = useState<{ [key: string]: Match }>({});
  const [predictionsByGroup, setPredictionsByGroup] = useState<{ [group: string]: Match[] }>({});

  useEffect(() => {
    const fetchData = async (uid: string) => {
      try {
        // 1. Obtener los partidos oficiales
        const querySnapshot = await getDocs(collection(db, 'partidos'));
        const matchesMap: { [key: string]: Match } = {};
        querySnapshot.forEach((docSnap) => {
          matchesMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Match;
        });
        setActualMatchesMap(matchesMap);

        // 2. Obtener la predicción del usuario
        const docRef = doc(db, 'polla_completa', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPrediction(data);

          // 3. Convertir predicciones a formato agrupado por grupo
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

          // Ordenar partidos dentro de cada grupo por fecha
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

  // Si no hay predicción guardada, mostramos el formulario
  if (!userPrediction) {
    return <PredictionForm />;
  }

  const groups = Object.keys(predictionsByGroup).sort();

  // Calcular estadísticas (SOLO partidos con resultado)
  let totalExact = 0;
  let totalCorrectWinner = 0;
  let totalIncorrect = 0;

  groups.forEach((groupId) => {
    predictionsByGroup[groupId].forEach((predicted) => {
      const actual = actualMatchesMap[predicted.id];
      if (hasOfficialResult(actual)) {
        if (predicted.score1 === actual.score1 && predicted.score2 === actual.score2) {
          totalExact++;
        } else {
          const predResult = predicted.score1! > predicted.score2! ? 1 : predicted.score1! < predicted.score2! ? -1 : 0;
          const actualResult = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
          if (predResult === actualResult) {
            totalCorrectWinner++;
          } else {
            totalIncorrect++;
          }
        }
      }
    });
  });

  const totalPoints = totalExact * 5 + totalCorrectWinner * 3;

  // Formatear fecha de envío
  const formatSubmittedAt = () => {
    if (!userPrediction.submittedAt) return 'N/A';
    if (userPrediction.submittedAt.toDate) {
      return userPrediction.submittedAt.toDate().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return new Date(userPrediction.submittedAt).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#D4A824] to-[#B8941E] rounded-2xl flex items-center justify-center shadow-lg">
          <ClipboardList className="size-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mi Predicción</h1>
          <p className="text-slate-500 mt-1">Revisa tus predicciones y compáralas con los resultados reales</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="size-6" />
            </div>
            <div className="text-3xl md:text-4xl mb-1 font-bold">{totalPoints}</div>
            <div className="text-sm opacity-80">Puntos Totales</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
            <div className="text-3xl md:text-4xl text-emerald-600 mb-1 font-bold">{totalExact}</div>
            <div className="text-sm text-slate-500">Exactos (+5)</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle2 className="size-6 text-[#1E3A5F]" />
            </div>
            <div className="text-3xl md:text-4xl text-[#1E3A5F] mb-1 font-bold">{totalCorrectWinner}</div>
            <div className="text-sm text-slate-500">Ganadores (+3)</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <XCircle className="size-6 text-red-500" />
            </div>
            <div className="text-3xl md:text-4xl text-red-500 mb-1 font-bold">{totalIncorrect}</div>
            <div className="text-sm text-slate-500">Incorrectos</div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Alert className="mb-8 border-2 border-[#1E3A5F]/20 bg-[#1E3A5F]/5 rounded-2xl">
        <Trophy className="size-5 text-[#D4A824]" />
        <AlertDescription className="text-[#1E3A5F] ml-2">
          Predicción de <span className="font-bold">{userPrediction.userName}</span> — Enviada el {formatSubmittedAt()}
        </AlertDescription>
      </Alert>

      {/* Groups Accordion */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Fase de Grupos</h2>
        <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          {groups.map((groupId) => {
            const predictions = predictionsByGroup[groupId];
            
            let exactCount = 0;
            let correctCount = 0;
            let incorrectCount = 0;

            predictions.forEach((p) => {
              const actual = actualMatchesMap[p.id];
              if (hasOfficialResult(actual)) {
                if (p.score1 === actual.score1 && p.score2 === actual.score2) {
                  exactCount++;
                } else {
                  const predResult = p.score1! > p.score2! ? 1 : p.score1! < p.score2! ? -1 : 0;
                  const actualResult = actual.score1! > actual.score2! ? 1 : actual.score1! < actual.score2! ? -1 : 0;
                  if (predResult === actualResult) {
                    correctCount++;
                  } else {
                    incorrectCount++;
                  }
                }
              }
            });

            return (
              <AccordionItem
                key={groupId}
                value={groupId}
                className="border-2 border-slate-200 rounded-2xl bg-white px-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">{groupId}</span>
                      </div>
                      <span className="text-slate-900 font-semibold text-lg">Grupo {groupId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {exactCount > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                          <CheckCircle2 className="size-4" />
                          <span>{exactCount}</span>
                        </div>
                      )}
                      {correctCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[#1E3A5F] bg-[#1E3A5F]/10 px-3 py-1.5 rounded-lg text-sm font-medium">
                          <CheckCircle2 className="size-4" />
                          <span>{correctCount}</span>
                        </div>
                      )}
                      {incorrectCount > 0 && (
                        <div className="flex items-center gap-1.5 text-red-700 bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                          <XCircle className="size-4" />
                          <span>{incorrectCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-5">
                  <div className="space-y-3">
                    {predictions.map((predicted) => {
                      const actual = actualMatchesMap[predicted.id];
                      return (
                        <MatchComparison
                          key={predicted.id}
                          predicted={predicted}
                          actual={actual}
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Knockout Picks */}
      {userPrediction.knockoutPicks && Object.keys(userPrediction.knockoutPicks).length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Fase Final</h2>
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userPrediction.knockoutPicks['F-1'] && (
                  <div className="col-span-2 md:col-span-4 text-center">
                    <div className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-wide">Tu Campeón</div>
                    <div className="inline-flex items-center gap-4 bg-gradient-to-r from-[#D4A824] via-[#E8C547] to-[#D4A824] text-white px-10 py-5 rounded-2xl font-bold text-2xl shadow-xl border-2 border-[#B8941E]">
                      <Trophy className="size-8" />
                      <span className="drop-shadow-sm">
                        {userPrediction.knockoutPicks['F-1']}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}