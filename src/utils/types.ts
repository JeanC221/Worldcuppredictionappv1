export interface Match {
  id: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  date: string;
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
}

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
}

export interface ParticipantScore {
  userId: string;
  userName: string;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
}
