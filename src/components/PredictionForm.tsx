import { useState } from 'react';
import { groupFixtures, GROUPS } from '../utils/mockData';
import { Match } from '../utils/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertCircle, Lock, Trophy, CheckCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export function PredictionForm() {
  const [predictions, setPredictions] = useState<{ [key: string]: Match[] }>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const updateScore = (groupId: string, matchId: string, team: 'team1' | 'team2', value: string) => {
    const score = value === '' ? undefined : parseInt(value);
    if (score !== undefined && (isNaN(score) || score < 0)) return;

    setPredictions((prev) => {
      const groupPredictions = prev[groupId] || groupFixtures.find((g) => g.group === groupId)!.matches;
      const updatedMatches = groupPredictions.map((match) =>
        match.id === matchId
          ? {
              ...match,
              [team === 'team1' ? 'score1' : 'score2']: score,
            }
          : match
      );
      return { ...prev, [groupId]: updatedMatches };
    });
  };

  const getWinner = (match: Match): string => {
    if (match.score1 === undefined || match.score2 === undefined) return '-';
    if (match.score1 > match.score2) return match.team1;
    if (match.score2 > match.score1) return match.team2;
    return 'Empate';
  };

  const getGroupWinners = (groupId: string): string[] => {
    const groupPredictions = predictions[groupId] || [];
    const teams = new Set<string>();
    
    groupPredictions.forEach((match) => {
      teams.add(match.team1);
      teams.add(match.team2);
    });

    const teamPoints: { [team: string]: number } = {};
    teams.forEach((team) => {
      teamPoints[team] = 0;
    });

    groupPredictions.forEach((match) => {
      if (match.score1 !== undefined && match.score2 !== undefined) {
        if (match.score1 > match.score2) {
          teamPoints[match.team1] = (teamPoints[match.team1] || 0) + 3;
        } else if (match.score2 > match.score1) {
          teamPoints[match.team2] = (teamPoints[match.team2] || 0) + 3;
        } else {
          teamPoints[match.team1] = (teamPoints[match.team1] || 0) + 1;
          teamPoints[match.team2] = (teamPoints[match.team2] || 0) + 1;
        }
      }
    });

    return Object.entries(teamPoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([team]) => team);
  };

  const handleSubmit = () => {
    setIsLocked(true);
    setShowConfirmDialog(false);
  };

  const allGroupsCompleted = GROUPS.every((group) => {
    const groupPreds = predictions[group] || [];
    return groupPreds.every((match) => match.score1 !== undefined && match.score2 !== undefined);
  });

  const completedGroups = GROUPS.filter((group) => {
    const groupPreds = predictions[group] || [];
    return groupPreds.every((match) => match.score1 !== undefined && match.score2 !== undefined);
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Formulario de Predicción</h1>
        <p className="text-gray-600">
          Completa los marcadores para todos los partidos de la fase de grupos. Una vez enviada, tu predicción será inmutable.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-900">Progreso de Predicción</span>
          <span className="text-sm text-orange-600">{completedGroups} / {GROUPS.length} grupos</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedGroups / GROUPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Side - Groups */}
        <div>
          {isLocked && (
            <Alert className="mb-6 border-red-300 bg-red-50">
              <Lock className="size-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Tu predicción ha sido bloqueada y enviada exitosamente. No se pueden realizar cambios.
              </AlertDescription>
            </Alert>
          )}

          <Accordion type="multiple" className="space-y-3">
            {groupFixtures.map((fixture) => {
              const groupPredictions = predictions[fixture.group] || fixture.matches;
              const winners = getGroupWinners(fixture.group);
              const isComplete = groupPredictions.every(
                (m) => m.score1 !== undefined && m.score2 !== undefined
              );

              return (
                <AccordionItem
                  key={fixture.group}
                  value={fixture.group}
                  className="border border-gray-200 rounded-xl bg-white px-4 shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white text-lg">{fixture.group}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-gray-900 block">Grupo {fixture.group}</span>
                          <span className="text-xs text-gray-500">3 partidos</span>
                        </div>
                      </div>
                      {isComplete ? (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="size-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700">Completado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                          <span className="text-xs text-gray-600">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-3">
                      {groupPredictions.map((match) => (
                        <div
                          key={match.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Calendar className="size-3" />
                            {match.date}
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                            {/* Team 1 */}
                            <div className="text-right">
                              <div className="text-gray-900 mb-2">{match.team1}</div>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={match.score1 ?? ''}
                                onChange={(e) =>
                                  updateScore(fixture.group, match.id, 'team1', e.target.value)
                                }
                                disabled={isLocked}
                                className="w-20 text-center bg-white border-gray-300 text-gray-900 text-lg ml-auto focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>

                            {/* VS */}
                            <div className="text-gray-400 text-sm">vs</div>

                            {/* Team 2 */}
                            <div className="text-left">
                              <div className="text-gray-900 mb-2">{match.team2}</div>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={match.score2 ?? ''}
                                onChange={(e) =>
                                  updateScore(fixture.group, match.id, 'team2', e.target.value)
                                }
                                disabled={isLocked}
                                className="w-20 text-center bg-white border-gray-300 text-gray-900 text-lg focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          </div>

                          {/* Winner Display */}
                          {match.score1 !== undefined && match.score2 !== undefined && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-500">Resultado:</div>
                              <div className="text-orange-600 mt-1">{getWinner(match)}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!allGroupsCompleted || isLocked}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 shadow-lg disabled:opacity-50"
              size="lg"
            >
              <Lock className="size-5 mr-2" />
              Enviar y Bloquear Predicción
            </Button>

            {!allGroupsCompleted && !isLocked && (
              <Alert className="mt-4 border-amber-300 bg-amber-50">
                <AlertCircle className="size-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  Completa todos los grupos ({completedGroups}/{GROUPS.length}) antes de enviar tu predicción
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Right Side - Round of 32 Bracket Preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-gray-900 mb-2 flex items-center gap-2">
              <Trophy className="size-5 text-orange-500" />
              Clasificados a Dieciseisavos
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Los equipos aparecerán automáticamente según tus predicciones
            </p>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {GROUPS.map((group) => {
                const winners = getGroupWinners(group);
                const isGroupComplete = winners.length > 0;
                return (
                  <div
                    key={group}
                    className={`border rounded-lg p-4 transition-colors ${
                      isGroupComplete
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs">
                        {group}
                      </div>
                      <span className="text-xs text-gray-600">Grupo {group}</span>
                    </div>
                    <div className="space-y-1.5">
                      {winners.length > 0 ? (
                        winners.map((winner, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-900 bg-white rounded px-3 py-2 border border-gray-200"
                          >
                            {idx + 1}° {winner}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Completa el grupo...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircle className="size-5 text-orange-500" />
              Confirmar Envío de Predicción
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Esta acción es irreversible. Una vez enviada, tu predicción quedará bloqueada permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
            <p className="text-sm text-orange-900">
              ⚠️ ¿Estás seguro de que deseas enviar tu predicción? Asegúrate de haber revisado todos los marcadores cuidadosamente.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Lock className="size-4 mr-2" />
              Confirmar y Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
