import { Match } from './types';

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

export function calculateScore(
  predictions: { [matchId: string]: { score1: number; score2: number } },
  actualMatches: Match[]
): ScoreResult {
  let exactMatches = 0;
  let correctWinners = 0;
  let totalPoints = 0;

  for (const match of actualMatches) {
    if (match.score1 === undefined || match.score2 === undefined) {
      continue;
    }

    const prediction = predictions[match.id];
    if (!prediction) {
      continue; 
    }

    const actualWinner = getWinner(match.score1, match.score2);
    const predictedWinner = getWinner(prediction.score1, prediction.score2);

    // ¿Marcador exacto?
    if (prediction.score1 === match.score1 && prediction.score2 === match.score2) {
      exactMatches++;
      totalPoints += 5;
    }
    // ¿Al menos acertó el ganador?
    else if (actualWinner === predictedWinner) {
      correctWinners++;
      totalPoints += 3;
    }
    // Falló completamente: 0 puntos
  }

  return { exactMatches, correctWinners, totalPoints };
}


function getWinner(score1: number, score2: number): number {
  if (score1 > score2) return 1;
  if (score2 > score1) return 2;
  return 0;
}