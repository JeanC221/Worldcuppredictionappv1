import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match } from '../utils/types';
import { CheckCircle2, XCircle, Calendar, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { PredictionForm } from './PredictionForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Alert, AlertDescription } from './ui/alert';

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
      className={`border rounded-lg p-4 ${
        isExactMatch
          ? 'bg-emerald-50 border-emerald-300'
          : isCorrectWinner
          ? 'bg-blue-50 border-blue-200'
          : isIncorrect
          ? 'bg-red-50 border-red-300'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Calendar className="size-3" />
        {predicted.date}
      </div>

      {/* Mostrar resultado real SOLO si existe */}
      {hasResult && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Resultado Real:</div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-right">
              <div className="text-gray-900 text-sm mb-1">{actual!.team1}</div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-xl text-gray-900">{actual!.score1}</span>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm">vs</div>
            <div className="text-left">
              <div className="text-gray-900 text-sm mb-1">{actual!.team2}</div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-xl text-gray-900">{actual!.score2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-gray-600 mb-2">Tu Predicción:</div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <div className="text-gray-900 text-sm mb-1">{predicted.team1}</div>
            <div
              className={`inline-block px-3 py-1.5 rounded-lg border-2 ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <span className="text-xl">{predicted.score1}</span>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm">vs</div>
          <div className="text-left">
            <div className="text-gray-900 text-sm mb-1">{predicted.team2}</div>
            <div
              className={`inline-block px-3 py-1.5 rounded-lg border-2 ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <span className="text-xl">{predicted.score2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status badge SOLO si hay resultado */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {isExactMatch ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="size-4" />
              <span>Marcador Exacto (+5 pts)</span>
            </div>
          ) : isCorrectWinner ? (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <CheckCircle2 className="size-4" />
              <span>Ganador Correcto (+3 pts)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="size-4" />
              <span>Incorrecto (0 pts)</span>
            </div>
          )}
        </div>
      )}

      {/* Si no hay resultado, mostrar "Pendiente" */}
      {!hasResult && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
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
          // El formato guardado es: { matchId: { score1, score2 } }
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin size-10 text-orange-500" />
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
  let totalPending = 0;

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
      } else {
        totalPending++;
      }
    });
  });

  const totalPoints = totalExact * 5 + totalCorrectWinner * 3;

  // Formatear fecha de envío
  const formatSubmittedAt = () => {
    if (!userPrediction.submittedAt) return 'N/A';
    if (userPrediction.submittedAt.toDate) {
      return userPrediction.submittedAt.toDate().toLocaleDateString('es-ES');
    }
    return new Date(userPrediction.submittedAt).toLocaleDateString('es-ES');
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mi Predicción</h1>
        <p className="text-gray-600">
          Revisa tus predicciones y compáralas con los resultados reales
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
          <TrendingUp className="size-5 md:size-6 mb-2" />
          <div className="text-2xl md:text-3xl mb-1 font-bold">{totalPoints}</div>
          <div className="text-xs md:text-sm opacity-90">Puntos Totales</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <CheckCircle2 className="size-5 md:size-6 text-emerald-500 mb-2" />
          <div className="text-2xl md:text-3xl text-gray-900 mb-1 font-bold">{totalExact}</div>
          <div className="text-xs md:text-sm text-gray-600">Exactos (+5)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <CheckCircle2 className="size-5 md:size-6 text-blue-500 mb-2" />
          <div className="text-2xl md:text-3xl text-gray-900 mb-1 font-bold">{totalCorrectWinner}</div>
          <div className="text-xs md:text-sm text-gray-600">Ganadores (+3)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
          <XCircle className="size-5 md:size-6 text-red-500 mb-2" />
          <div className="text-2xl md:text-3xl text-gray-900 mb-1 font-bold">{totalIncorrect}</div>
          <div className="text-xs md:text-sm text-gray-600">Incorrectos</div>
        </div>
      </div>

      {/* User Info */}
      <Alert className="mb-6 border-orange-300 bg-orange-50">
        <Trophy className="size-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          Predicción de <span className="font-semibold">{userPrediction.userName}</span> - Enviada: {formatSubmittedAt()}
        </AlertDescription>
      </Alert>

      {/* Groups Accordion - cambiar defaultValue a array vacío */}
      <Accordion type="multiple" defaultValue={[]} className="space-y-3">
        {groups.map((groupId) => {
          const predictions = predictionsByGroup[groupId];
          
          let exactCount = 0;
          let correctCount = 0;
          let incorrectCount = 0;

          predictions.forEach((p) => {
            const actual = actualMatchesMap[p.id];
            // Cambiar validación para incluir null
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
              className="border border-gray-200 rounded-lg bg-gray-50 px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold">{groupId}</span>
                    </div>
                    <span className="text-gray-900">Grupo {groupId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {exactCount > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="size-3" />
                        <span>{exactCount}</span>
                      </div>
                    )}
                    {correctCount > 0 && (
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <CheckCircle2 className="size-3" />
                        <span>{correctCount}</span>
                      </div>
                    )}
                    {incorrectCount > 0 && (
                      <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded">
                        <XCircle className="size-3" />
                        <span>{incorrectCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-4">
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

      {/* Knockout Picks */}
      {userPrediction.knockoutPicks && Object.keys(userPrediction.knockoutPicks).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fase Final</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userPrediction.knockoutPicks['F-1'] && (
                <div className="col-span-2 md:col-span-4 text-center mb-4">
                  <div className="text-sm text-gray-500 mb-2">Tu Campeón</div>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-gray-900 px-8 py-4 rounded-xl font-bold text-xl shadow-lg border-2 border-yellow-300">
                    <span className="text-2xl">🏆</span>
                    <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                      {userPrediction.knockoutPicks['F-1']}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}