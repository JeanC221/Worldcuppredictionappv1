import { GroupFixture, ActualResults, Prediction, ParticipantScore } from './types';

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const groupFixtures: GroupFixture[] = [
  {
    group: 'A',
    matches: [
      { id: 'A1', team1: 'México', team2: 'Canadá', date: '2026-06-11 12:00' },
      { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', date: '2026-06-12 15:00' },
      { id: 'A3', team1: 'México', team2: 'Estados Unidos', date: '2026-06-16 18:00' },
    ],
  },
  {
    group: 'B',
    matches: [
      { id: 'B1', team1: 'Inglaterra', team2: 'Irán', date: '2026-06-11 15:00' },
      { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', date: '2026-06-12 12:00' },
      { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', date: '2026-06-16 15:00' },
    ],
  },
  {
    group: 'C',
    matches: [
      { id: 'C1', team1: 'Argentina', team2: 'Polonia', date: '2026-06-11 18:00' },
      { id: 'C2', team1: 'Francia', team2: 'Australia', date: '2026-06-12 18:00' },
      { id: 'C3', team1: 'Argentina', team2: 'Francia', date: '2026-06-17 12:00' },
    ],
  },
  {
    group: 'D',
    matches: [
      { id: 'D1', team1: 'España', team2: 'Japón', date: '2026-06-12 21:00' },
      { id: 'D2', team1: 'Alemania', team2: 'Costa Rica', date: '2026-06-13 12:00' },
      { id: 'D3', team1: 'España', team2: 'Alemania', date: '2026-06-17 15:00' },
    ],
  },
  {
    group: 'E',
    matches: [
      { id: 'E1', team1: 'Brasil', team2: 'Serbia', date: '2026-06-13 15:00' },
      { id: 'E2', team1: 'Portugal', team2: 'Ghana', date: '2026-06-13 18:00' },
      { id: 'E3', team1: 'Brasil', team2: 'Portugal', date: '2026-06-17 18:00' },
    ],
  },
  {
    group: 'F',
    matches: [
      { id: 'F1', team1: 'Bélgica', team2: 'Marruecos', date: '2026-06-13 21:00' },
      { id: 'F2', team1: 'Croacia', team2: 'Canadá', date: '2026-06-14 12:00' },
      { id: 'F3', team1: 'Bélgica', team2: 'Croacia', date: '2026-06-18 12:00' },
    ],
  },
  {
    group: 'G',
    matches: [
      { id: 'G1', team1: 'Suiza', team2: 'Camerún', date: '2026-06-14 15:00' },
      { id: 'G2', team1: 'Uruguay', team2: 'Corea del Sur', date: '2026-06-14 18:00' },
      { id: 'G3', team1: 'Suiza', team2: 'Uruguay', date: '2026-06-18 15:00' },
    ],
  },
  {
    group: 'H',
    matches: [
      { id: 'H1', team1: 'Colombia', team2: 'Ecuador', date: '2026-06-14 21:00' },
      { id: 'H2', team1: 'Italia', team2: 'Túnez', date: '2026-06-15 12:00' },
      { id: 'H3', team1: 'Colombia', team2: 'Italia', date: '2026-06-18 18:00' },
    ],
  },
  {
    group: 'I',
    matches: [
      { id: 'I1', team1: 'Dinamarca', team2: 'Perú', date: '2026-06-15 15:00' },
      { id: 'I2', team1: 'Nigeria', team2: 'Arabia Saudita', date: '2026-06-15 18:00' },
      { id: 'I3', team1: 'Dinamarca', team2: 'Nigeria', date: '2026-06-19 12:00' },
    ],
  },
  {
    group: 'J',
    matches: [
      { id: 'J1', team1: 'Suecia', team2: 'Chile', date: '2026-06-15 21:00' },
      { id: 'J2', team1: 'Noruega', team2: 'Egipto', date: '2026-06-16 12:00' },
      { id: 'J3', team1: 'Suecia', team2: 'Noruega', date: '2026-06-19 15:00' },
    ],
  },
  {
    group: 'K',
    matches: [
      { id: 'K1', team1: 'Ucrania', team2: 'Panamá', date: '2026-06-16 21:00' },
      { id: 'K2', team1: 'Qatar', team2: 'Nueva Zelanda', date: '2026-06-17 21:00' },
      { id: 'K3', team1: 'Ucrania', team2: 'Qatar', date: '2026-06-19 18:00' },
    ],
  },
  {
    group: 'L',
    matches: [
      { id: 'L1', team1: 'Sudáfrica', team2: 'Honduras', date: '2026-06-17 12:00' },
      { id: 'L2', team1: 'Escocia', team2: 'Venezuela', date: '2026-06-18 21:00' },
      { id: 'L3', team1: 'Sudáfrica', team2: 'Escocia', date: '2026-06-19 21:00' },
    ],
  },
];

// Resultados reales (parciales para demostración)
export const actualResults: ActualResults = {
  groupResults: {
    A: [
      { id: 'A1', team1: 'México', team2: 'Canadá', score1: 2, score2: 1, date: '2026-06-11 12:00' },
      { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', score1: 1, score2: 1, date: '2026-06-12 15:00' },
      { id: 'A3', team1: 'México', team2: 'Estados Unidos', score1: 0, score2: 2, date: '2026-06-16 18:00' },
    ],
    B: [
      { id: 'B1', team1: 'Inglaterra', team2: 'Irán', score1: 3, score2: 0, date: '2026-06-11 15:00' },
      { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', score1: 2, score2: 0, date: '2026-06-12 12:00' },
      { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', score1: 1, score2: 1, date: '2026-06-16 15:00' },
    ],
  },
  groupWinners: {
    A: ['Estados Unidos', 'México'],
    B: ['Inglaterra', 'Países Bajos'],
  },
};

// Predicciones de ejemplo
export const mockPredictions: Prediction[] = [
  {
    userId: '1',
    userName: 'Carlos Rodríguez',
    groupPredictions: {
      A: [
        { id: 'A1', team1: 'México', team2: 'Canadá', score1: 2, score2: 1, date: '2026-06-11 12:00' },
        { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', score1: 1, score2: 2, date: '2026-06-12 15:00' },
        { id: 'A3', team1: 'México', team2: 'Estados Unidos', score1: 1, score2: 1, date: '2026-06-16 18:00' },
      ],
      B: [
        { id: 'B1', team1: 'Inglaterra', team2: 'Irán', score1: 3, score2: 0, date: '2026-06-11 15:00' },
        { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', score1: 2, score2: 1, date: '2026-06-12 12:00' },
        { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', score1: 2, score2: 1, date: '2026-06-16 15:00' },
      ],
    },
    groupWinners: {
      A: ['México', 'Uruguay'],
      B: ['Inglaterra', 'Países Bajos'],
    },
    isLocked: true,
    submittedAt: '2026-06-10 23:45',
  },
  {
    userId: '2',
    userName: 'María González',
    groupPredictions: {
      A: [
        { id: 'A1', team1: 'México', team2: 'Canadá', score1: 3, score2: 0, date: '2026-06-11 12:00' },
        { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', score1: 0, score2: 1, date: '2026-06-12 15:00' },
        { id: 'A3', team1: 'México', team2: 'Estados Unidos', score1: 2, score2: 1, date: '2026-06-16 18:00' },
      ],
      B: [
        { id: 'B1', team1: 'Inglaterra', team2: 'Irán', score1: 4, score2: 1, date: '2026-06-11 15:00' },
        { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', score1: 2, score2: 0, date: '2026-06-12 12:00' },
        { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', score1: 1, score2: 1, date: '2026-06-16 15:00' },
      ],
    },
    groupWinners: {
      A: ['México', 'Uruguay'],
      B: ['Inglaterra', 'Países Bajos'],
    },
    isLocked: true,
    submittedAt: '2026-06-11 08:30',
  },
  {
    userId: '3',
    userName: 'Juan Martínez',
    groupPredictions: {
      A: [
        { id: 'A1', team1: 'México', team2: 'Canadá', score1: 1, score2: 0, date: '2026-06-11 12:00' },
        { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', score1: 1, score2: 1, date: '2026-06-12 15:00' },
        { id: 'A3', team1: 'México', team2: 'Estados Unidos', score1: 0, score2: 2, date: '2026-06-16 18:00' },
      ],
      B: [
        { id: 'B1', team1: 'Inglaterra', team2: 'Irán', score1: 3, score2: 0, date: '2026-06-11 15:00' },
        { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', score1: 2, score2: 0, date: '2026-06-12 12:00' },
        { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', score1: 1, score2: 1, date: '2026-06-16 15:00' },
      ],
    },
    groupWinners: {
      A: ['Estados Unidos', 'México'],
      B: ['Inglaterra', 'Países Bajos'],
    },
    isLocked: true,
    submittedAt: '2026-06-10 19:15',
  },
  {
    userId: '4',
    userName: 'Ana López',
    groupPredictions: {
      A: [
        { id: 'A1', team1: 'México', team2: 'Canadá', score1: 2, score2: 1, date: '2026-06-11 12:00' },
        { id: 'A2', team1: 'Estados Unidos', team2: 'Uruguay', score1: 2, score2: 2, date: '2026-06-12 15:00' },
        { id: 'A3', team1: 'México', team2: 'Estados Unidos', score1: 1, score2: 3, date: '2026-06-16 18:00' },
      ],
      B: [
        { id: 'B1', team1: 'Inglaterra', team2: 'Irán', score1: 2, score2: 0, date: '2026-06-11 15:00' },
        { id: 'B2', team1: 'Países Bajos', team2: 'Senegal', score1: 1, score2: 0, date: '2026-06-12 12:00' },
        { id: 'B3', team1: 'Inglaterra', team2: 'Países Bajos', score1: 0, score2: 0, date: '2026-06-16 15:00' },
      ],
    },
    groupWinners: {
      A: ['Estados Unidos', 'México'],
      B: ['Inglaterra', 'Países Bajos'],
    },
    isLocked: true,
    submittedAt: '2026-06-11 10:00',
  },
];

// Calcular puntuación
export function calculateScore(prediction: Prediction, actual: ActualResults): ParticipantScore {
  let totalPoints = 0;
  let exactMatches = 0;
  let correctWinners = 0;

  // Calcular puntos por grupos
  Object.keys(prediction.groupPredictions).forEach((groupId) => {
    const predMatches = prediction.groupPredictions[groupId];
    const actualMatches = actual.groupResults[groupId];

    if (actualMatches) {
      predMatches.forEach((predMatch) => {
        const actualMatch = actualMatches.find((m) => m.id === predMatch.id);
        if (actualMatch && actualMatch.score1 !== undefined && actualMatch.score2 !== undefined) {
          // Marcador exacto: 5 puntos
          if (predMatch.score1 === actualMatch.score1 && predMatch.score2 === actualMatch.score2) {
            totalPoints += 5;
            exactMatches++;
          }
          // Ganador correcto: 3 puntos
          else {
            const predWinner =
              predMatch.score1! > predMatch.score2!
                ? predMatch.team1
                : predMatch.score1! < predMatch.score2!
                ? predMatch.team2
                : 'draw';
            const actualWinner =
              actualMatch.score1 > actualMatch.score2
                ? actualMatch.team1
                : actualMatch.score1 < actualMatch.score2
                ? actualMatch.team2
                : 'draw';

            if (predWinner === actualWinner) {
              totalPoints += 3;
              correctWinners++;
            }
          }
        }
      });
    }
  });

  return {
    userId: prediction.userId,
    userName: prediction.userName,
    totalPoints,
    exactMatches,
    correctWinners,
  };
}

export const mockRanking: ParticipantScore[] = mockPredictions
  .map((pred) => calculateScore(pred, actualResults))
  .sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
    return b.correctWinners - a.correctWinners;
  });
