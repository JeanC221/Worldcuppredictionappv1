import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match } from '../utils/types';
import { Users, Eye, Calendar, CheckCircle2, XCircle, Search, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { calculateScore } from '../utils/scoring';

interface UserPrediction {
  odId: string;
  userId: string;
  userName: string;
  groupPredictions: { [matchId: string]: { score1: number; score2: number } };
  submittedAt?: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
}

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
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Calendar className="size-3" />
        {predicted.date}
      </div>

      {actual && actual.score1 !== undefined && actual.score2 !== undefined && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Resultado Real:</div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-right">
              <div className="text-gray-900 text-sm mb-1">{actual.team1}</div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-xl text-gray-900">{actual.score1}</span>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm">vs</div>
            <div className="text-left">
              <div className="text-gray-900 text-sm mb-1">{actual.team2}</div>
              <div className="inline-block px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300">
                <span className="text-xl text-gray-900">{actual.score2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-gray-600 mb-2">Predicción:</div>
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

      {actual && actual.score1 !== undefined && actual.score2 !== undefined && (
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
    </div>
  );
}

export function Community() {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<UserPrediction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          const groupPredictions = data.groupPredictions || {};
          
          // Convertir formato para calculateScore
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
          });
        }

        // Ordenar por puntos
        predictionsData.sort((a, b) => b.totalPoints - a.totalPoints);
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

  // Agrupar partidos por grupo
  const matchesByGroup: { [group: string]: Match[] } = {};
  matches.forEach(m => {
    if (!matchesByGroup[m.group]) matchesByGroup[m.group] = [];
    matchesByGroup[m.group].push(m);
  });

  // Función para obtener predicciones de un usuario agrupadas por grupo
  const getPredictionsByGroup = (userPredictions: { [matchId: string]: { score1: number; score2: number } }) => {
    const result: { [group: string]: Match[] } = {};
    
    for (const [matchId, pred] of Object.entries(userPredictions)) {
      const originalMatch = matches.find(m => m.id === matchId);
      if (originalMatch) {
        const group = originalMatch.group;
        if (!result[group]) result[group] = [];
        result[group].push({
          ...originalMatch,
          score1: pred.score1,
          score2: pred.score2,
        });
      }
    }

    // Ordenar partidos dentro de cada grupo
    Object.keys(result).forEach(group => {
      result[group].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-600">Cargando predicciones...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Comunidad - Todas las Pollas</h1>
        <p className="text-gray-600">
          Transparencia total: consulta las predicciones de todos los participantes ({predictions.length})
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar participante por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
          />
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Users className="size-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-900 mb-2">Aún no hay predicciones</h3>
          <p className="text-gray-600">Sé el primero en enviar tu polla.</p>
        </div>
      ) : (
        <>
          {/* Participants Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPredictions.map((prediction) => (
              <div
                key={prediction.odId}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 mb-1">{prediction.userName}</h3>
                    <p className="text-xs text-gray-500">
                      Enviado: {prediction.submittedAt}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="size-5 text-orange-600" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <TrendingUp className="size-4 text-orange-500 mx-auto mb-1" />
                    <div className="text-xl text-orange-600">{prediction.totalPoints}</div>
                    <div className="text-xs text-gray-600 mt-1">Puntos</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <Trophy className="size-4 text-emerald-600 mx-auto mb-1" />
                    <div className="text-xl text-emerald-600">{prediction.exactMatches}</div>
                    <div className="text-xs text-gray-600 mt-1">Exactos</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <CheckCircle2 className="size-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xl text-blue-600">{prediction.correctWinners}</div>
                    <div className="text-xs text-gray-600 mt-1">Ganadores</div>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedPrediction(prediction)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Eye className="size-4 mr-2" />
                  Ver Predicción
                </Button>
              </div>
            ))}
          </div>

          {filteredPredictions.length === 0 && searchTerm && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <Users className="size-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron participantes con "{searchTerm}"</p>
            </div>
          )}
        </>
      )}

      {/* Prediction Detail Dialog */}
      <Dialog
        open={selectedPrediction !== null}
        onOpenChange={(open: boolean) => !open && setSelectedPrediction(null)}
      >
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Trophy className="size-5 text-orange-500" />
              Predicción de {selectedPrediction?.userName}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Enviado: {selectedPrediction?.submittedAt} | 
              Puntos: {selectedPrediction?.totalPoints} | 
              Exactos: {selectedPrediction?.exactMatches} | 
              Ganadores: {selectedPrediction?.correctWinners}
            </DialogDescription>
          </DialogHeader>

          {selectedPrediction && (
            <div className="mt-4">
              <Accordion
                type="multiple"
                defaultValue={Object.keys(getPredictionsByGroup(selectedPrediction.groupPredictions))}
                className="space-y-3"
              >
                {Object.entries(getPredictionsByGroup(selectedPrediction.groupPredictions))
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupId, predictedMatches]) => {
                    const actualGroupMatches = matchesByGroup[groupId] || [];

                    let exactCount = 0;
                    let correctCount = 0;
                    let incorrectCount = 0;

                    predictedMatches.forEach((p) => {
                      const actual = actualGroupMatches.find((a) => a.id === p.id);
                      if (actual && actual.score1 !== undefined && actual.score2 !== undefined) {
                        if (p.score1 === actual.score1 && p.score2 === actual.score2) {
                          exactCount++;
                        } else {
                          const predResult = p.score1! > p.score2! ? 'win1' : p.score1! < p.score2! ? 'win2' : 'draw';
                          const actualResult = actual.score1 > actual.score2 ? 'win1' : actual.score1 < actual.score2 ? 'win2' : 'draw';
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
                                <span className="text-white">{groupId}</span>
                              </div>
                              <span className="text-gray-900 text-sm">Grupo {groupId}</span>
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
                            {predictedMatches.map((predicted) => {
                              const actual = actualGroupMatches.find((a) => a.id === predicted.id);
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}