import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match } from '../utils/types';
import { Users, Eye, Calendar, CheckCircle2, XCircle, Search, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
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
        <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Predicción</div>
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
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 min-h-[60vh]">
        <Loader2 className="size-12 animate-spin text-[#1E3A5F] mb-4" />
        <span className="text-slate-600 font-medium">Cargando predicciones...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="size-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Comunidad</h1>
          <p className="text-slate-500 mt-1">
            Transparencia total: consulta las predicciones de todos los participantes
          </p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 bg-[#1E3A5F]/10 text-[#1E3A5F] px-4 py-2 rounded-xl font-semibold">
          <Users className="size-5" />
          <span>{predictions.length} participantes</span>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-md rounded-2xl mb-8">
        <CardContent className="p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar participante por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl h-14 text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
            />
          </div>
        </CardContent>
      </Card>

      {predictions.length === 0 ? (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="size-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Aún no hay predicciones</h3>
            <p className="text-slate-500 text-lg">Sé el primero en enviar tu polla.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Participants Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPredictions.map((prediction, index) => (
              <Card
                key={prediction.odId}
                className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setSelectedPrediction(prediction)}
              >
                <CardContent className="p-0">
                  {/* Card Header with rank indicator */}
                  <div className={`p-5 ${index < 3 ? 'bg-gradient-to-r from-[#D4A824]/10 to-transparent' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {index < 3 && (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-gradient-to-br from-[#D4A824] to-[#B8941E] text-white' :
                            index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                            'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        <div>
                          <h3 className="text-slate-900 font-bold text-lg">{prediction.userName}</h3>
                          <p className="text-xs text-slate-500">
                            Enviado: {prediction.submittedAt}
                          </p>
                        </div>
                      </div>
                      <div className="w-11 h-11 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center group-hover:bg-[#1E3A5F] transition-colors">
                        <Eye className="size-5 text-[#1E3A5F] group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-[#E85D24]/10 to-[#E85D24]/5 border-2 border-[#E85D24]/20 rounded-xl p-3 text-center">
                        <TrendingUp className="size-4 text-[#E85D24] mx-auto mb-1.5" />
                        <div className="text-2xl font-bold text-[#E85D24]">{prediction.totalPoints}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">Puntos</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border-2 border-emerald-200 rounded-xl p-3 text-center">
                        <CheckCircle2 className="size-4 text-emerald-600 mx-auto mb-1.5" />
                        <div className="text-2xl font-bold text-emerald-600">{prediction.exactMatches}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">Exactos</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#1E3A5F]/10 to-[#1E3A5F]/5 border-2 border-[#1E3A5F]/20 rounded-xl p-3 text-center">
                        <Trophy className="size-4 text-[#1E3A5F] mx-auto mb-1.5" />
                        <div className="text-2xl font-bold text-[#1E3A5F]">{prediction.correctWinners}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">Ganadores</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5">
                    <Button
                      className="w-full bg-[#1E3A5F] hover:bg-[#152A45] text-white rounded-xl h-12 font-semibold text-base transition-all group-hover:shadow-lg"
                    >
                      <Eye className="size-5 mr-2" />
                      Ver Predicción Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPredictions.length === 0 && searchTerm && (
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="size-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sin resultados</h3>
                <p className="text-slate-500">No se encontraron participantes con "<span className="font-semibold">{searchTerm}</span>"</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Prediction Detail Dialog */}
      <Dialog
        open={selectedPrediction !== null}
        onOpenChange={(open: boolean) => !open && setSelectedPrediction(null)}
      >
        <DialogContent className="bg-white border-0 shadow-2xl text-slate-900 max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-200">
            <DialogTitle className="text-slate-900 flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4A824] to-[#B8941E] rounded-xl flex items-center justify-center">
                <Trophy className="size-5 text-white" />
              </div>
              Predicción de {selectedPrediction?.userName}
            </DialogTitle>
            <DialogDescription className="mt-3">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 text-sm font-medium">
                  <Calendar className="size-4" />
                  {selectedPrediction?.submittedAt}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#E85D24]/10 px-3 py-1.5 rounded-lg text-[#E85D24] text-sm font-semibold">
                  <TrendingUp className="size-4" />
                  {selectedPrediction?.totalPoints} pts
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-lg text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="size-4" />
                  {selectedPrediction?.exactMatches} exactos
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#1E3A5F]/10 px-3 py-1.5 rounded-lg text-[#1E3A5F] text-sm font-semibold">
                  <Trophy className="size-4" />
                  {selectedPrediction?.correctWinners} ganadores
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedPrediction && (
            <div className="mt-6">
              <Accordion
                type="multiple"
                defaultValue={[]}
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
                      if (hasOfficialResult(actual)) {
                        if (p.score1 === actual!.score1 && p.score2 === actual!.score2) {
                          exactCount++;
                        } else {
                          const predResult = p.score1! > p.score2! ? 'win1' : p.score1! < p.score2! ? 'win2' : 'draw';
                          const actualResult = actual!.score1! > actual!.score2! ? 'win1' : actual!.score1! < actual!.score2! ? 'win2' : 'draw';
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