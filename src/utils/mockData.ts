import { GroupFixture, ActualResults, Prediction, ParticipantScore } from './types';

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

/**
 * 48 EQUIPOS MUNDIAL 2026
 * ========================
 * 42 Clasificados confirmados + 6 por definir (TBD)
 * 
 * Distribución por Confederación:
 * - UEFA (Europa): 16 equipos
 * - CONMEBOL (Sudamérica): 6 equipos
 * - CONCACAF (Norte/Centroamérica): 6 equipos (3 automáticos + 3 por repechaje)
 * - CAF (África): 9 equipos
 * - AFC (Asia): 8 equipos
 * - OFC (Oceanía): 1 equipo
 * - Repechajes: 2 cupos adicionales
 */

const TEAMS_BY_GROUP: { [key: string]: string[] } = {
  // GRUPO A - Sede: Estados Unidos (Hosts + Pot 1)
  A: ['Estados Unidos', 'Países Bajos', 'Senegal', 'TBD1'],
  
  // GRUPO B
  B: ['Inglaterra', 'Alemania', 'Irán', 'Corea del Sur'],
  
  // GRUPO C
  C: ['Argentina', 'Polonia', 'Australia', 'Perú'],
  
  // GRUPO D - Sede: México (Host)
  D: ['México', 'Ecuador', 'Arabia Saudita', 'TBD2'],
  
  // GRUPO E
  E: ['Francia', 'Dinamarca', 'Túnez', 'Canadá'],
  
  // GRUPO F
  F: ['España', 'Croacia', 'Marruecos', 'Albania'],
  
  // GRUPO G
  G: ['Brasil', 'Suiza', 'Serbia', 'Camerún'],
  
  // GRUPO H
  H: ['Portugal', 'Uruguay', 'Ghana', 'TBD3'],
  
  // GRUPO I
  I: ['Bélgica', 'Colombia', 'Japón', 'Sudáfrica'],
  
  // GRUPO J
  J: ['Italia', 'Austria', 'Ucrania', 'Egipto'],
  
  // GRUPO K - Sede: Canadá (Host)
  K: ['Canadá', 'Noruega', 'Nigeria', 'TBD4'],
  
  // GRUPO L
  L: ['Países anfitrión rotativo', 'Qatar', 'Costa Rica', 'Nueva Zelanda'],
};

TEAMS_BY_GROUP['L'] = ['Estados Unidos B', 'Qatar', 'Costa Rica', 'Nueva Zelanda'];

// Lista completa de los 42 equipos CONFIRMADOS 
export const CONFIRMED_TEAMS = [
  // UEFA (16)
  'Alemania', 'España', 'Francia', 'Inglaterra', 'Portugal', 'Países Bajos',
  'Bélgica', 'Italia', 'Croacia', 'Dinamarca', 'Suiza', 'Austria',
  'Ucrania', 'Polonia', 'Serbia', 'Albania',
  
  // CONMEBOL (6)
  'Argentina', 'Brasil', 'Uruguay', 'Colombia', 'Ecuador', 'Perú',
  
  // CONCACAF (4 confirmados, 2 por repechaje)
  'Estados Unidos', 'México', 'Canadá', 'Costa Rica',
  
  // CAF (9)
  'Marruecos', 'Senegal', 'Nigeria', 'Camerún', 'Ghana', 'Egipto',
  'Sudáfrica', 'Túnez', 'TBD-CAF',
  
  // AFC (8)
  'Japón', 'Corea del Sur', 'Australia', 'Irán', 'Arabia Saudita', 'Qatar',
  'TBD-AFC1', 'TBD-AFC2',
  
  // OFC (1)
  'Nueva Zelanda',
  
  // Repechajes intercontinentales (2)
  'TBD-Repechaje1', 'TBD-Repechaje2'
];

export const groupFixtures: GroupFixture[] = [
  {
    group: 'A',
    matches: [
      { id: 'A1', team1: 'Estados Unidos', team2: 'TBD1', date: '2026-06-11T12:00', group: 'A' },
      { id: 'A2', team1: 'Países Bajos', team2: 'Senegal', date: '2026-06-11T18:00', group: 'A' },
      { id: 'A3', team1: 'Estados Unidos', team2: 'Senegal', date: '2026-06-16T15:00', group: 'A' },
      { id: 'A4', team1: 'Países Bajos', team2: 'TBD1', date: '2026-06-16T18:00', group: 'A' },
      { id: 'A5', team1: 'Estados Unidos', team2: 'Países Bajos', date: '2026-06-21T18:00', group: 'A' },
      { id: 'A6', team1: 'Senegal', team2: 'TBD1', date: '2026-06-21T18:00', group: 'A' },
    ],
  },
  {
    group: 'B',
    matches: [
      { id: 'B1', team1: 'Inglaterra', team2: 'Corea del Sur', date: '2026-06-11T15:00', group: 'B' },
      { id: 'B2', team1: 'Alemania', team2: 'Irán', date: '2026-06-11T21:00', group: 'B' },
      { id: 'B3', team1: 'Inglaterra', team2: 'Irán', date: '2026-06-16T12:00', group: 'B' },
      { id: 'B4', team1: 'Alemania', team2: 'Corea del Sur', date: '2026-06-16T21:00', group: 'B' },
      { id: 'B5', team1: 'Inglaterra', team2: 'Alemania', date: '2026-06-21T15:00', group: 'B' },
      { id: 'B6', team1: 'Irán', team2: 'Corea del Sur', date: '2026-06-21T15:00', group: 'B' },
    ],
  },
  {
    group: 'C',
    matches: [
      { id: 'C1', team1: 'Argentina', team2: 'Perú', date: '2026-06-12T12:00', group: 'C' },
      { id: 'C2', team1: 'Polonia', team2: 'Australia', date: '2026-06-12T18:00', group: 'C' },
      { id: 'C3', team1: 'Argentina', team2: 'Australia', date: '2026-06-17T15:00', group: 'C' },
      { id: 'C4', team1: 'Polonia', team2: 'Perú', date: '2026-06-17T18:00', group: 'C' },
      { id: 'C5', team1: 'Argentina', team2: 'Polonia', date: '2026-06-22T18:00', group: 'C' },
      { id: 'C6', team1: 'Australia', team2: 'Perú', date: '2026-06-22T18:00', group: 'C' },
    ],
  },
  {
    group: 'D',
    matches: [
      { id: 'D1', team1: 'México', team2: 'TBD2', date: '2026-06-12T15:00', group: 'D' },
      { id: 'D2', team1: 'Ecuador', team2: 'Arabia Saudita', date: '2026-06-12T21:00', group: 'D' },
      { id: 'D3', team1: 'México', team2: 'Arabia Saudita', date: '2026-06-17T12:00', group: 'D' },
      { id: 'D4', team1: 'Ecuador', team2: 'TBD2', date: '2026-06-17T21:00', group: 'D' },
      { id: 'D5', team1: 'México', team2: 'Ecuador', date: '2026-06-22T15:00', group: 'D' },
      { id: 'D6', team1: 'Arabia Saudita', team2: 'TBD2', date: '2026-06-22T15:00', group: 'D' },
    ],
  },
  {
    group: 'E',
    matches: [
      { id: 'E1', team1: 'Francia', team2: 'Canadá', date: '2026-06-13T12:00', group: 'E' },
      { id: 'E2', team1: 'Dinamarca', team2: 'Túnez', date: '2026-06-13T18:00', group: 'E' },
      { id: 'E3', team1: 'Francia', team2: 'Túnez', date: '2026-06-18T15:00', group: 'E' },
      { id: 'E4', team1: 'Dinamarca', team2: 'Canadá', date: '2026-06-18T18:00', group: 'E' },
      { id: 'E5', team1: 'Francia', team2: 'Dinamarca', date: '2026-06-23T18:00', group: 'E' },
      { id: 'E6', team1: 'Túnez', team2: 'Canadá', date: '2026-06-23T18:00', group: 'E' },
    ],
  },
  {
    group: 'F',
    matches: [
      { id: 'F1', team1: 'España', team2: 'Albania', date: '2026-06-13T15:00', group: 'F' },
      { id: 'F2', team1: 'Croacia', team2: 'Marruecos', date: '2026-06-13T21:00', group: 'F' },
      { id: 'F3', team1: 'España', team2: 'Marruecos', date: '2026-06-18T12:00', group: 'F' },
      { id: 'F4', team1: 'Croacia', team2: 'Albania', date: '2026-06-18T21:00', group: 'F' },
      { id: 'F5', team1: 'España', team2: 'Croacia', date: '2026-06-23T15:00', group: 'F' },
      { id: 'F6', team1: 'Marruecos', team2: 'Albania', date: '2026-06-23T15:00', group: 'F' },
    ],
  },
  {
    group: 'G',
    matches: [
      { id: 'G1', team1: 'Brasil', team2: 'Camerún', date: '2026-06-14T12:00', group: 'G' },
      { id: 'G2', team1: 'Suiza', team2: 'Serbia', date: '2026-06-14T18:00', group: 'G' },
      { id: 'G3', team1: 'Brasil', team2: 'Serbia', date: '2026-06-19T15:00', group: 'G' },
      { id: 'G4', team1: 'Suiza', team2: 'Camerún', date: '2026-06-19T18:00', group: 'G' },
      { id: 'G5', team1: 'Brasil', team2: 'Suiza', date: '2026-06-24T18:00', group: 'G' },
      { id: 'G6', team1: 'Serbia', team2: 'Camerún', date: '2026-06-24T18:00', group: 'G' },
    ],
  },
  {
    group: 'H',
    matches: [
      { id: 'H1', team1: 'Portugal', team2: 'TBD3', date: '2026-06-14T15:00', group: 'H' },
      { id: 'H2', team1: 'Uruguay', team2: 'Ghana', date: '2026-06-14T21:00', group: 'H' },
      { id: 'H3', team1: 'Portugal', team2: 'Ghana', date: '2026-06-19T12:00', group: 'H' },
      { id: 'H4', team1: 'Uruguay', team2: 'TBD3', date: '2026-06-19T21:00', group: 'H' },
      { id: 'H5', team1: 'Portugal', team2: 'Uruguay', date: '2026-06-24T15:00', group: 'H' },
      { id: 'H6', team1: 'Ghana', team2: 'TBD3', date: '2026-06-24T15:00', group: 'H' },
    ],
  },
  {
    group: 'I',
    matches: [
      { id: 'I1', team1: 'Bélgica', team2: 'Sudáfrica', date: '2026-06-15T12:00', group: 'I' },
      { id: 'I2', team1: 'Colombia', team2: 'Japón', date: '2026-06-15T18:00', group: 'I' },
      { id: 'I3', team1: 'Bélgica', team2: 'Japón', date: '2026-06-20T15:00', group: 'I' },
      { id: 'I4', team1: 'Colombia', team2: 'Sudáfrica', date: '2026-06-20T18:00', group: 'I' },
      { id: 'I5', team1: 'Bélgica', team2: 'Colombia', date: '2026-06-25T18:00', group: 'I' },
      { id: 'I6', team1: 'Japón', team2: 'Sudáfrica', date: '2026-06-25T18:00', group: 'I' },
    ],
  },
  {
    group: 'J',
    matches: [
      { id: 'J1', team1: 'Italia', team2: 'Egipto', date: '2026-06-15T15:00', group: 'J' },
      { id: 'J2', team1: 'Austria', team2: 'Ucrania', date: '2026-06-15T21:00', group: 'J' },
      { id: 'J3', team1: 'Italia', team2: 'Ucrania', date: '2026-06-20T12:00', group: 'J' },
      { id: 'J4', team1: 'Austria', team2: 'Egipto', date: '2026-06-20T21:00', group: 'J' },
      { id: 'J5', team1: 'Italia', team2: 'Austria', date: '2026-06-25T15:00', group: 'J' },
      { id: 'J6', team1: 'Ucrania', team2: 'Egipto', date: '2026-06-25T15:00', group: 'J' },
    ],
  },
  {
    group: 'K',
    matches: [
      { id: 'K1', team1: 'Noruega', team2: 'TBD4', date: '2026-06-16T12:00', group: 'K' },
      { id: 'K2', team1: 'Nigeria', team2: 'TBD5', date: '2026-06-16T18:00', group: 'K' },
      { id: 'K3', team1: 'Noruega', team2: 'TBD5', date: '2026-06-21T15:00', group: 'K' },
      { id: 'K4', team1: 'Nigeria', team2: 'TBD4', date: '2026-06-21T18:00', group: 'K' },
      { id: 'K5', team1: 'Noruega', team2: 'Nigeria', date: '2026-06-26T18:00', group: 'K' },
      { id: 'K6', team1: 'TBD5', team2: 'TBD4', date: '2026-06-26T18:00', group: 'K' },
    ],
  },
  {
    group: 'L',
    matches: [
      { id: 'L1', team1: 'Qatar', team2: 'Nueva Zelanda', date: '2026-06-16T21:00', group: 'L' },
      { id: 'L2', team1: 'Costa Rica', team2: 'TBD6', date: '2026-06-17T12:00', group: 'L' },
      { id: 'L3', team1: 'Qatar', team2: 'TBD6', date: '2026-06-22T12:00', group: 'L' },
      { id: 'L4', team1: 'Costa Rica', team2: 'Nueva Zelanda', date: '2026-06-22T21:00', group: 'L' },
      { id: 'L5', team1: 'Qatar', team2: 'Costa Rica', date: '2026-06-27T18:00', group: 'L' },
      { id: 'L6', team1: 'Nueva Zelanda', team2: 'TBD6', date: '2026-06-27T18:00', group: 'L' },
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
