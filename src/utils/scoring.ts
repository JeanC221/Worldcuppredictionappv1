import { Match, PhaseScore, MatchPrediction } from './types';
import { TournamentPhase, SCORING, PHASES } from './constants';

export interface UserPrediction {
  matchId: string;
  score1: number;
  score2: number;
}

export interface ScoreResult {
  exactMatches: number;
  correctWinners: number;
  totalPoints: number;
}

/**
 * Verifica si un partido tiene resultado oficial (no null, no undefined)
 */
function hasResult(match: Match): boolean {
  return match.score1 !== undefined && match.score1 !== null &&
         match.score2 !== undefined && match.score2 !== null;
}

/**
 * Determina el ganador: 1 = team1, 2 = team2, 0 = empate
 */
function getWinner(score1: number, score2: number): number {
  if (score1 > score2) return 1;
  if (score2 > score1) return 2;
  return 0;
}

/**
 * Calcula puntuación básica de partidos (sin bonus de equipos)
 * Compatible con el sistema anterior
 */
export function calculateScore(
  predictions: { [matchId: string]: { score1: number; score2: number } },
  actualMatches: Match[]
): ScoreResult {
  let exactMatches = 0;
  let correctWinners = 0;
  let totalPoints = 0;

  for (const match of actualMatches) {
    if (!hasResult(match)) continue;

    const prediction = predictions[match.id];
    if (!prediction) continue;

    const actualWinner = getWinner(match.score1!, match.score2!);
    const predictedWinner = getWinner(prediction.score1, prediction.score2);

    if (prediction.score1 === match.score1 && prediction.score2 === match.score2) {
      exactMatches++;
      totalPoints += SCORING.EXACT_MATCH;
    } else if (actualWinner === predictedWinner) {
      correctWinners++;
      totalPoints += SCORING.CORRECT_WINNER;
    }
  }

  return { exactMatches, correctWinners, totalPoints };
}

/**
 * Calcula el bonus por equipos que pasaron de ronda
 */
export function calculateTeamsBonus(
  predictedTeams: string[],
  actualTeams: string[]
): { teamsCorrect: number; bonusPoints: number } {
  if (!predictedTeams || !actualTeams || actualTeams.length === 0) {
    return { teamsCorrect: 0, bonusPoints: 0 };
  }

  // Normalizar nombres para comparación
  const normalizedActual = actualTeams.map(t => t.toLowerCase().trim());
  
  let teamsCorrect = 0;
  for (const team of predictedTeams) {
    if (normalizedActual.includes(team.toLowerCase().trim())) {
      teamsCorrect++;
    }
  }

  return {
    teamsCorrect,
    bonusPoints: teamsCorrect * SCORING.TEAM_ADVANCED
  };
}

/**
 * Calcula puntuación completa de una fase
 */
export function calculatePhaseScore(
  phase: TournamentPhase,
  matchPredictions: { [matchId: string]: MatchPrediction },
  actualMatches: Match[],
  predictedTeamsAdvancing: string[],
  actualTeamsAdvanced: string[]
): PhaseScore {
  // Calcular puntos por partidos
  const matchScore = calculateScore(matchPredictions, actualMatches);
  
  // Calcular bonus por equipos
  const teamsBonus = calculateTeamsBonus(predictedTeamsAdvancing, actualTeamsAdvanced);

  return {
    phase,
    exactMatches: matchScore.exactMatches,
    correctWinners: matchScore.correctWinners,
    teamsAdvancedBonus: teamsBonus.teamsCorrect,
    matchPoints: matchScore.totalPoints,
    bonusPoints: teamsBonus.bonusPoints,
    totalPoints: matchScore.totalPoints + teamsBonus.bonusPoints
  };
}

/**
 * Calcula puntuación total de todas las fases
 */
export function calculateTotalScore(
  phaseScores: { [key in TournamentPhase]?: PhaseScore }
): {
  totalPoints: number;
  totalExactMatches: number;
  totalCorrectWinners: number;
  totalTeamsBonus: number;
} {
  let totalPoints = 0;
  let totalExactMatches = 0;
  let totalCorrectWinners = 0;
  let totalTeamsBonus = 0;

  for (const phase of PHASES) {
    const score = phaseScores[phase.id];
    if (score) {
      totalPoints += score.totalPoints;
      totalExactMatches += score.exactMatches;
      totalCorrectWinners += score.correctWinners;
      totalTeamsBonus += score.teamsAdvancedBonus;
    }
  }

  return { totalPoints, totalExactMatches, totalCorrectWinners, totalTeamsBonus };
}

/**
 * Obtiene los equipos que pasan de fase según las predicciones de grupo
 * (Los 2 primeros de cada grupo basado en los marcadores predichos)
 */
export function getTeamsAdvancingFromGroups(
  groupPredictions: { [matchId: string]: MatchPrediction },
  matchesByGroup: { [group: string]: Match[] }
): string[] {
  const advancingTeams: string[] = [];

  for (const [group, matches] of Object.entries(matchesByGroup)) {
    // Calcular tabla de posiciones basada en predicciones
    const standings: { [team: string]: { points: number; gd: number; gf: number } } = {};

    for (const match of matches) {
      const pred = groupPredictions[match.id];
      if (!pred) continue;

      // Inicializar equipos
      if (!standings[match.team1]) standings[match.team1] = { points: 0, gd: 0, gf: 0 };
      if (!standings[match.team2]) standings[match.team2] = { points: 0, gd: 0, gf: 0 };

      // Calcular puntos
      if (pred.score1 > pred.score2) {
        standings[match.team1].points += 3;
      } else if (pred.score2 > pred.score1) {
        standings[match.team2].points += 3;
      } else {
        standings[match.team1].points += 1;
        standings[match.team2].points += 1;
      }

      // Diferencia de goles
      standings[match.team1].gd += pred.score1 - pred.score2;
      standings[match.team2].gd += pred.score2 - pred.score1;
      standings[match.team1].gf += pred.score1;
      standings[match.team2].gf += pred.score2;
    }

    // Ordenar por puntos, luego diferencia de goles, luego goles a favor
    const sorted = Object.entries(standings)
      .sort(([, a], [, b]) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

    // Los primeros 2 pasan (en Mundial 2026 son 32 equipos de 48, pero de 12 grupos pasan ~2.67 por grupo)
    // Simplificamos: 2 primeros + algunos terceros (pero para bonus contamos los 2 primeros)
    if (sorted.length >= 2) {
      advancingTeams.push(sorted[0][0], sorted[1][0]);
    }
    // Tercer lugar también puede pasar en algunos grupos
    if (sorted.length >= 3) {
      advancingTeams.push(sorted[2][0]);
    }
  }

  return advancingTeams;
}