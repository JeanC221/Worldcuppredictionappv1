import { TournamentPhase } from './constants';

export interface Match {
  id: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  date: string;
  group: string;
  phase?: TournamentPhase; // Para partidos knockout
}

export interface GroupFixture {
  group: string;
  matches: Match[];
}

export interface KnockoutMatch {
  id: string;
  team1?: string;
  team2?: string;
  score1?: number;
  score2?: number;
  winner?: string;
  phase: TournamentPhase;
}

// Predicción de un partido (score)
export interface MatchPrediction {
  score1: number;
  score2: number;
}

// Predicciones por fase
export interface PhasePredictions {
  // Para grupos: { matchId: { score1, score2 } }
  matchPredictions: { [matchId: string]: MatchPrediction };
  // Equipos que el usuario predice que pasan de esta fase
  teamsAdvancing: string[];
  // Si esta fase ya fue enviada/bloqueada
  isLocked: boolean;
  submittedAt?: Date;
}

// Puntuación por fase
export interface PhaseScore {
  phase: TournamentPhase;
  exactMatches: number;
  correctWinners: number;
  teamsAdvancedBonus: number; // Cantidad de equipos acertados que pasaron
  matchPoints: number;        // Puntos por partidos (exactos + ganadores)
  bonusPoints: number;        // Puntos por bonus de equipos
  totalPoints: number;        // matchPoints + bonusPoints
}

// Predicción completa del usuario (todas las fases)
export interface UserPrediction {
  userId: string;
  userName: string;
  userEmail?: string;
  
  // Predicciones por fase
  phases: {
    [key in TournamentPhase]?: PhasePredictions;
  };
  
  // Puntuación calculada por fase
  scores?: {
    [key in TournamentPhase]?: PhaseScore;
  };
  
  // Totales
  totalPoints: number;
  totalExactMatches: number;
  totalCorrectWinners: number;
  totalTeamsBonus: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Para compatibilidad con el sistema anterior
export interface Prediction {
  userId: string;
  userName: string;
  groupPredictions: {
    [groupId: string]: Match[];
  };
  groupWinners: {
    [groupId: string]: string[];
  };
  knockoutPredictions?: {
    [round: string]: KnockoutMatch[];
  };
  knockoutPicks?: {
    [matchId: string]: string;
  };
  isLocked: boolean;
  submittedAt?: string;
}

export interface ActualResults {
  groupResults: {
    [groupId: string]: Match[];
  };
  groupWinners: {
    [groupId: string]: string[];
  };
  knockoutResults?: {
    [round: string]: KnockoutMatch[];
  };
  // Equipos que realmente pasaron cada fase
  teamsAdvanced?: {
    [key in TournamentPhase]?: string[];
  };
}

export interface ParticipantScore {
  rank?: number;
  userId: string;
  userName: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
  teamsBonus?: number;
  // Desglose por fase
  phaseScores?: {
    [key in TournamentPhase]?: PhaseScore;
  };
}

// Para el ranking
export interface RankingEntry extends ParticipantScore {
  rank: number;
}
