import { GroupFixture, ActualResults, Prediction, ParticipantScore } from './types';

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

/**
 * MUNDIAL 2026 - SORTEO OFICIAL
 * ==============================
 * 48 equipos: 42 confirmados + 6 por Play-offs
 * 
 * Play-offs pendientes:
 * - Play-off A (Grupo B)
 * - Play-off B (Grupo F)
 * - Play-off C (Grupo D)
 * - Play-off D (Grupo A)
 * - Play-off 1 (Grupo K)
 * - Play-off 2 (Grupo I)
 */

export const TEAMS_BY_GROUP: { [key: string]: string[] } = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'Play-off D'],
  B: ['Canadá', 'Play-off A', 'Qatar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['Estados Unidos', 'Paraguay', 'Australia', 'Play-off C'],
  E: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Play-off B', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Play-off 2', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'Play-off 1', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

// Lista de los 42 equipos CONFIRMADOS
export const CONFIRMED_TEAMS = [
  // Anfitriones (3)
  'Estados Unidos', 'México', 'Canadá',
  
  // UEFA - Europa (13 + 3 por play-off)
  'Alemania', 'España', 'Francia', 'Inglaterra', 'Portugal', 'Países Bajos',
  'Bélgica', 'Croacia', 'Suiza', 'Austria', 'Escocia', 'Noruega',
  
  // CONMEBOL - Sudamérica (6)
  'Argentina', 'Brasil', 'Uruguay', 'Colombia', 'Ecuador', 'Paraguay',
  
  // CONCACAF - Norte/Centroamérica (4 + 2 por play-off)
  'Panamá', 'Haití', 'Curazao',
  
  // CAF - África (9)
  'Marruecos', 'Senegal', 'Costa de Marfil', 'Ghana', 'Egipto',
  'Sudáfrica', 'Argelia', 'Túnez', 'Cabo Verde',
  
  // AFC - Asia (8)
  'Japón', 'Corea del Sur', 'Australia', 'Irán', 'Arabia Saudita', 
  'Qatar', 'Uzbekistán', 'Jordania',
  
  // OFC - Oceanía (1)
  'Nueva Zelanda',
];

export const groupFixtures: GroupFixture[] = [
  // GRUPO A: México, Sudáfrica, Corea del Sur, Play-off D
  {
    group: 'A',
    matches: [
      { id: 'A1', team1: 'México', team2: 'Play-off D', date: '2026-06-11T12:00', group: 'A' },
      { id: 'A2', team1: 'Sudáfrica', team2: 'Corea del Sur', date: '2026-06-11T18:00', group: 'A' },
      { id: 'A3', team1: 'México', team2: 'Corea del Sur', date: '2026-06-16T15:00', group: 'A' },
      { id: 'A4', team1: 'Sudáfrica', team2: 'Play-off D', date: '2026-06-16T18:00', group: 'A' },
      { id: 'A5', team1: 'México', team2: 'Sudáfrica', date: '2026-06-21T18:00', group: 'A' },
      { id: 'A6', team1: 'Corea del Sur', team2: 'Play-off D', date: '2026-06-21T18:00', group: 'A' },
    ],
  },
  // GRUPO B: Canadá, Play-off A, Qatar, Suiza
  {
    group: 'B',
    matches: [
      { id: 'B1', team1: 'Canadá', team2: 'Suiza', date: '2026-06-11T15:00', group: 'B' },
      { id: 'B2', team1: 'Play-off A', team2: 'Qatar', date: '2026-06-11T21:00', group: 'B' },
      { id: 'B3', team1: 'Canadá', team2: 'Qatar', date: '2026-06-16T12:00', group: 'B' },
      { id: 'B4', team1: 'Play-off A', team2: 'Suiza', date: '2026-06-16T21:00', group: 'B' },
      { id: 'B5', team1: 'Canadá', team2: 'Play-off A', date: '2026-06-21T15:00', group: 'B' },
      { id: 'B6', team1: 'Qatar', team2: 'Suiza', date: '2026-06-21T15:00', group: 'B' },
    ],
  },
  // GRUPO C: Brasil, Marruecos, Haití, Escocia
  {
    group: 'C',
    matches: [
      { id: 'C1', team1: 'Brasil', team2: 'Escocia', date: '2026-06-12T12:00', group: 'C' },
      { id: 'C2', team1: 'Marruecos', team2: 'Haití', date: '2026-06-12T18:00', group: 'C' },
      { id: 'C3', team1: 'Brasil', team2: 'Haití', date: '2026-06-17T15:00', group: 'C' },
      { id: 'C4', team1: 'Marruecos', team2: 'Escocia', date: '2026-06-17T18:00', group: 'C' },
      { id: 'C5', team1: 'Brasil', team2: 'Marruecos', date: '2026-06-22T18:00', group: 'C' },
      { id: 'C6', team1: 'Haití', team2: 'Escocia', date: '2026-06-22T18:00', group: 'C' },
    ],
  },
  // GRUPO D: Estados Unidos, Paraguay, Australia, Play-off C
  {
    group: 'D',
    matches: [
      { id: 'D1', team1: 'Estados Unidos', team2: 'Play-off C', date: '2026-06-12T15:00', group: 'D' },
      { id: 'D2', team1: 'Paraguay', team2: 'Australia', date: '2026-06-12T21:00', group: 'D' },
      { id: 'D3', team1: 'Estados Unidos', team2: 'Australia', date: '2026-06-17T12:00', group: 'D' },
      { id: 'D4', team1: 'Paraguay', team2: 'Play-off C', date: '2026-06-17T21:00', group: 'D' },
      { id: 'D5', team1: 'Estados Unidos', team2: 'Paraguay', date: '2026-06-22T15:00', group: 'D' },
      { id: 'D6', team1: 'Australia', team2: 'Play-off C', date: '2026-06-22T15:00', group: 'D' },
    ],
  },
  // GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
  {
    group: 'E',
    matches: [
      { id: 'E1', team1: 'Alemania', team2: 'Ecuador', date: '2026-06-13T12:00', group: 'E' },
      { id: 'E2', team1: 'Curazao', team2: 'Costa de Marfil', date: '2026-06-13T18:00', group: 'E' },
      { id: 'E3', team1: 'Alemania', team2: 'Costa de Marfil', date: '2026-06-18T15:00', group: 'E' },
      { id: 'E4', team1: 'Curazao', team2: 'Ecuador', date: '2026-06-18T18:00', group: 'E' },
      { id: 'E5', team1: 'Alemania', team2: 'Curazao', date: '2026-06-23T18:00', group: 'E' },
      { id: 'E6', team1: 'Costa de Marfil', team2: 'Ecuador', date: '2026-06-23T18:00', group: 'E' },
    ],
  },
  // GRUPO F: Países Bajos, Japón, Play-off B, Túnez
  {
    group: 'F',
    matches: [
      { id: 'F1', team1: 'Países Bajos', team2: 'Túnez', date: '2026-06-13T15:00', group: 'F' },
      { id: 'F2', team1: 'Japón', team2: 'Play-off B', date: '2026-06-13T21:00', group: 'F' },
      { id: 'F3', team1: 'Países Bajos', team2: 'Play-off B', date: '2026-06-18T12:00', group: 'F' },
      { id: 'F4', team1: 'Japón', team2: 'Túnez', date: '2026-06-18T21:00', group: 'F' },
      { id: 'F5', team1: 'Países Bajos', team2: 'Japón', date: '2026-06-23T15:00', group: 'F' },
      { id: 'F6', team1: 'Play-off B', team2: 'Túnez', date: '2026-06-23T15:00', group: 'F' },
    ],
  },
  // GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
  {
    group: 'G',
    matches: [
      { id: 'G1', team1: 'Bélgica', team2: 'Nueva Zelanda', date: '2026-06-14T12:00', group: 'G' },
      { id: 'G2', team1: 'Egipto', team2: 'Irán', date: '2026-06-14T18:00', group: 'G' },
      { id: 'G3', team1: 'Bélgica', team2: 'Irán', date: '2026-06-19T15:00', group: 'G' },
      { id: 'G4', team1: 'Egipto', team2: 'Nueva Zelanda', date: '2026-06-19T18:00', group: 'G' },
      { id: 'G5', team1: 'Bélgica', team2: 'Egipto', date: '2026-06-24T18:00', group: 'G' },
      { id: 'G6', team1: 'Irán', team2: 'Nueva Zelanda', date: '2026-06-24T18:00', group: 'G' },
    ],
  },
  // GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
  {
    group: 'H',
    matches: [
      { id: 'H1', team1: 'España', team2: 'Uruguay', date: '2026-06-14T15:00', group: 'H' },
      { id: 'H2', team1: 'Cabo Verde', team2: 'Arabia Saudita', date: '2026-06-14T21:00', group: 'H' },
      { id: 'H3', team1: 'España', team2: 'Arabia Saudita', date: '2026-06-19T12:00', group: 'H' },
      { id: 'H4', team1: 'Cabo Verde', team2: 'Uruguay', date: '2026-06-19T21:00', group: 'H' },
      { id: 'H5', team1: 'España', team2: 'Cabo Verde', date: '2026-06-24T15:00', group: 'H' },
      { id: 'H6', team1: 'Arabia Saudita', team2: 'Uruguay', date: '2026-06-24T15:00', group: 'H' },
    ],
  },
  // GRUPO I: Francia, Senegal, Play-off 2, Noruega
  {
    group: 'I',
    matches: [
      { id: 'I1', team1: 'Francia', team2: 'Noruega', date: '2026-06-15T12:00', group: 'I' },
      { id: 'I2', team1: 'Senegal', team2: 'Play-off 2', date: '2026-06-15T18:00', group: 'I' },
      { id: 'I3', team1: 'Francia', team2: 'Play-off 2', date: '2026-06-20T15:00', group: 'I' },
      { id: 'I4', team1: 'Senegal', team2: 'Noruega', date: '2026-06-20T18:00', group: 'I' },
      { id: 'I5', team1: 'Francia', team2: 'Senegal', date: '2026-06-25T18:00', group: 'I' },
      { id: 'I6', team1: 'Play-off 2', team2: 'Noruega', date: '2026-06-25T18:00', group: 'I' },
    ],
  },
  // GRUPO J: Argentina, Argelia, Austria, Jordania
  {
    group: 'J',
    matches: [
      { id: 'J1', team1: 'Argentina', team2: 'Jordania', date: '2026-06-15T15:00', group: 'J' },
      { id: 'J2', team1: 'Argelia', team2: 'Austria', date: '2026-06-15T21:00', group: 'J' },
      { id: 'J3', team1: 'Argentina', team2: 'Austria', date: '2026-06-20T12:00', group: 'J' },
      { id: 'J4', team1: 'Argelia', team2: 'Jordania', date: '2026-06-20T21:00', group: 'J' },
      { id: 'J5', team1: 'Argentina', team2: 'Argelia', date: '2026-06-25T15:00', group: 'J' },
      { id: 'J6', team1: 'Austria', team2: 'Jordania', date: '2026-06-25T15:00', group: 'J' },
    ],
  },
  // GRUPO K: Portugal, Play-off 1, Uzbekistán, Colombia
  {
    group: 'K',
    matches: [
      { id: 'K1', team1: 'Portugal', team2: 'Colombia', date: '2026-06-16T12:00', group: 'K' },
      { id: 'K2', team1: 'Play-off 1', team2: 'Uzbekistán', date: '2026-06-16T18:00', group: 'K' },
      { id: 'K3', team1: 'Portugal', team2: 'Uzbekistán', date: '2026-06-21T15:00', group: 'K' },
      { id: 'K4', team1: 'Play-off 1', team2: 'Colombia', date: '2026-06-21T18:00', group: 'K' },
      { id: 'K5', team1: 'Portugal', team2: 'Play-off 1', date: '2026-06-26T18:00', group: 'K' },
      { id: 'K6', team1: 'Uzbekistán', team2: 'Colombia', date: '2026-06-26T18:00', group: 'K' },
    ],
  },
  // GRUPO L: Inglaterra, Croacia, Ghana, Panamá
  {
    group: 'L',
    matches: [
      { id: 'L1', team1: 'Inglaterra', team2: 'Panamá', date: '2026-06-16T21:00', group: 'L' },
      { id: 'L2', team1: 'Croacia', team2: 'Ghana', date: '2026-06-17T12:00', group: 'L' },
      { id: 'L3', team1: 'Inglaterra', team2: 'Ghana', date: '2026-06-22T12:00', group: 'L' },
      { id: 'L4', team1: 'Croacia', team2: 'Panamá', date: '2026-06-22T21:00', group: 'L' },
      { id: 'L5', team1: 'Inglaterra', team2: 'Croacia', date: '2026-06-27T18:00', group: 'L' },
      { id: 'L6', team1: 'Ghana', team2: 'Panamá', date: '2026-06-27T18:00', group: 'L' },
    ],
  },
];

export const actualResults: ActualResults = {
  groupResults: {},
  groupWinners: {},
};

export const mockPredictions: Prediction[] = [];

// Función para calcular puntuación
export function calculateScore(prediction: Prediction, actual: ActualResults): ParticipantScore {
  let totalPoints = 0;
  let exactMatches = 0;
  let correctWinners = 0;

  Object.keys(prediction.groupPredictions).forEach((groupId) => {
    const predMatches = prediction.groupPredictions[groupId];
    const actualMatches = actual.groupResults[groupId];

    if (actualMatches) {
      predMatches.forEach((predMatch) => {
        const actualMatch = actualMatches.find((m) => m.id === predMatch.id);
        if (actualMatch && actualMatch.score1 !== undefined && actualMatch.score2 !== undefined) {
          if (predMatch.score1 === actualMatch.score1 && predMatch.score2 === actualMatch.score2) {
            totalPoints += 5;
            exactMatches++;
          } else {
            const predDiff = (predMatch.score1 || 0) - (predMatch.score2 || 0);
            const actualDiff = actualMatch.score1 - actualMatch.score2;
            
            const sameResult = (predDiff > 0 && actualDiff > 0) || 
                               (predDiff < 0 && actualDiff < 0) || 
                               (predDiff === 0 && actualDiff === 0);

            if (sameResult) {
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

export const mockRanking: ParticipantScore[] = [];
