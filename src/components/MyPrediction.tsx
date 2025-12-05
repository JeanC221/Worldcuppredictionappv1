import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Match } from '../utils/types';
import { CheckCircle2, XCircle, Calendar, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { PredictionForm } from './PredictionForm'; // <--- IMPORTANTE: Importamos el formulario
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

function MatchComparison({ predicted, actual }: MatchComparisonProps) {
  const getMatchResult = (match: Match): 'win1' | 'win2' | 'draw' | 'pending' => {
    if (match.score1 === undefined || match.score2 === undefined) return 'pending';
    if (match.score1 > match.score2) return 'win1';
    if (match.score2 > match.score1) return 'win2';
    return 'draw';
  };

  const isExactMatch =
    actual &&
    predicted.score1 === actual.score1 &&
    predicted.score2 === actual.score2;

  const isCorrectWinner =
    actual &&
    !isExactMatch &&
    getMatchResult(predicted) === getMatchResult(actual);

  const isIncorrect =
    actual &&
    actual.score1 !== undefined &&
    actual.score2 !== undefined &&
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
      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Calendar className="size-3" />
        {/* Formateo seguro de fecha */}
        {new Date(predicted.date).toLocaleDateString('es-ES', {  month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
      </div>

      {/* Actual Result (if available) */}
      {actual && actual.score1 !== undefined && actual.score2 !== undefined && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Resultado Real:</div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-right">
              <div className="text-gray-900 mb-1">{actual.team1}</div>
              <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-2xl text-gray-900">{actual.score1}</span>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm">vs</div>
            <div className="text-left">
              <div className="text-gray-900 mb-1">{actual.team2}</div>
              <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-2xl text-gray-900">{actual.score2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prediction */}
      <div>
        <div className="text-xs text-gray-600 mb-2">Tu Predicción:</div>
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <div className="text-gray-900 mb-1">{predicted.team1}</div>
            <div
              className={`inline-block px-4 py-2 rounded-lg border-2 ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <span className="text-2xl">{predicted.score1}</span>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm">vs</div>
          <div className="text-left">
            <div className="text-gray-900 mb-1">{predicted.team2}</div>
            <div
              className={`inline-block px-4 py-2 rounded-lg border-2 ${
                isExactMatch
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isCorrectWinner
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : isIncorrect
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <span className="text-2xl">{predicted.score2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      {actual && actual.score1 !== undefined && actual.score2 !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {isExactMatch ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="size-5" />
              <span>Marcador Exacto - +5 puntos</span>
            </div>
          ) : isCorrectWinner ? (
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="size-5" />
              <span>Ganador Correcto - +3 puntos</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="size-5" />
              <span>Predicción Incorrecta - 0 puntos</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MyPrediction() {
  const [loading, setLoading] = useState(true);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [actualMatchesMap, setActualMatchesMap] = useState<{ [key: string]: Match }>({});

  useEffect(() => {
    const fetchData = async (uid: string) => {
      try {
        // 1. Obtener la predicción del usuario
        const docRef = doc(db, 'polla_completa', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserPrediction(docSnap.data());
        }

        // 2. Obtener los resultados reales de TODOS los partidos
        const querySnapshot = await getDocs(collection(db, 'partidos'));
        const matchesMap: { [key: string]: Match } = {};
        querySnapshot.forEach((doc) => {
          matchesMap[doc.id] = { id: doc.id, ...doc.data() } as Match;
        });
        setActualMatchesMap(matchesMap);

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
     return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin size-10 text-orange-500" /></div>;
  }

  // --- SOLUCIÓN DEL BUCLE ---
  // Si no hay predicción guardada, mostramos el formulario directamente
  // en lugar de mandar al usuario a otro lado.
  if (!userPrediction) {
    return <PredictionForm />;
  }

  // Si YA hay predicción, mostramos los resultados y puntos
  const groups = Object.keys(userPrediction.groupPredictions || {}).sort();

  // Calcular estadísticas en tiempo real
  let totalExact = 0;
  let totalCorrectWinner = 0;
  let totalIncorrect = 0;

  groups.forEach((groupId) => {
    const predictions = userPrediction.groupPredictions[groupId];
    
    predictions.forEach((p: Match) => {
      const actual = actualMatchesMap[p.id];
      // Solo contamos si el partido ya tiene resultado
      if (actual && actual.score1 !== undefined && actual.score2 !== undefined && actual.score1 !== null) {
        if (p.score1 === actual.score1 && p.score2 === actual.score2) {
          totalExact++;
        } else {
          // Lógica de ganador
          const predDiff = (p.score1 || 0) - (p.score2 || 0);
          const actualDiff = (actual.score1 || 0) - (actual.score2 || 0);
          
          // Si ambos son positivos (gana 1), ambos negativos (gana 2) o ambos cero (empate)
          const sameSign = (predDiff > 0 && actualDiff > 0) || 
                           (predDiff < 0 && actualDiff < 0) || 
                           (predDiff === 0 && actualDiff === 0);

          if (sameSign) {
            totalCorrectWinner++;
          } else {
            totalIncorrect++;
          }
        }
      }
    });
  });

  const totalPoints = totalExact * 5 + totalCorrectWinner * 3;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mi Predicción</h1>
        <p className="text-gray-600">
          Revisa tus predicciones y compáralas con los resultados reales
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <TrendingUp className="size-6 mb-3" />
          <div className="text-3xl mb-1 font-bold">{totalPoints}</div>
          <div className="text-sm opacity-90">Puntos Totales</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <CheckCircle2 className="size-6 text-emerald-500 mb-3" />
          <div className="text-3xl text-gray-900 mb-1 font-bold">{totalExact}</div>
          <div className="text-sm text-gray-600">Marcadores Exactos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <CheckCircle2 className="size-6 text-blue-500 mb-3" />
          <div className="text-3xl text-gray-900 mb-1 font-bold">{totalCorrectWinner}</div>
          <div className="text-sm text-gray-600">Ganadores Correctos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <XCircle className="size-6 text-red-500 mb-3" />
          <div className="text-3xl text-gray-900 mb-1 font-bold">{totalIncorrect}</div>
          <div className="text-sm text-gray-600">Incorrectos</div>
        </div>
      </div>

      {/* User Info */}
      <Alert className="mb-6 border-orange-300 bg-orange-50">
        <Trophy className="size-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          Predicción bloqueada de <span className="font-semibold">{userPrediction.userName}</span> -{' '}
          Enviada: {new Date(userPrediction.submittedAt).toLocaleDateString()}
        </AlertDescription>
      </Alert>

      {/* Groups Accordion */}
      <Accordion type="multiple" defaultValue={groups} className="space-y-3">
        {groups.map((groupId) => {
          const predictions = userPrediction.groupPredictions[groupId];
          
          // Contadores locales por grupo
          let exactCount = 0;
          let correctWinnerCount = 0;
          let incorrectCount = 0;

          predictions.forEach((p: Match) => {
             const actual = actualMatchesMap[p.id];
             if (actual && actual.score1 !== undefined && actual.score1 !== null) {
                if (p.score1 === actual.score1 && p.score2 === actual.score2) {
                   exactCount++;
                } else {
                   const pDiff = (p.score1||0) - (p.score2||0);
                   const aDiff = (actual.score1||0) - (actual.score2||0);
                   if ((pDiff>0 && aDiff>0) || (pDiff<0 && aDiff<0) || (pDiff===0 && aDiff===0)) {
                      correctWinnerCount++;
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
              className="border border-gray-200 rounded-xl bg-white px-4 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">{groupId}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-900 block">Grupo {groupId}</span>
                      <span className="text-xs text-gray-500">{predictions.length} partidos</span>
                    </div>
                  </div>
                  
                  {/* Badge resumen de aciertos en el header del acordeon */}
                  <div className="flex items-center gap-3 text-sm">
                      {exactCount > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          <CheckCircle2 className="size-4" />
                          <span>{exactCount}</span>
                        </div>
                      )}
                      {correctWinnerCount > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <CheckCircle2 className="size-4" />
                          <span>{correctWinnerCount}</span>
                        </div>
                      )}
                      {incorrectCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded">
                          <XCircle className="size-4" />
                          <span>{incorrectCount}</span>
                        </div>
                      )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  {predictions.map((predicted: Match) => {
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
  );
}