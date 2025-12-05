import { describe, it, expect } from 'vitest';
import { calculateGroupStandings, getBestThirds, generateRoundOf32 } from './bracketLogic';
import { Match } from './types';

describe('bracketLogic', () => {
  describe('calculateGroupStandings', () => {
    const createMatch = (
      id: string,
      team1: string,
      team2: string,
      score1?: number,
      score2?: number
    ): Match => ({
      id,
      team1,
      team2,
      score1,
      score2,
      date: '2026-06-11',
      group: 'A',
    });

    it('debe ordenar por puntos correctamente', () => {
      const matches = [
        createMatch('1', 'Argentina', 'Chile', 2, 0),    // ARG +3
        createMatch('2', 'Argentina', 'Peru', 1, 0),     // ARG +3
        createMatch('3', 'Chile', 'Peru', 1, 1),         // CHI +1, PER +1
        createMatch('4', 'Argentina', 'Canada', 3, 0),   // ARG +3
        createMatch('5', 'Chile', 'Canada', 2, 1),       // CHI +3
        createMatch('6', 'Peru', 'Canada', 2, 2),        // PER +1, CAN +1
      ];

      const standings = calculateGroupStandings(matches, 'A');

      expect(standings[0].team).toBe('Argentina'); // 9 pts
      expect(standings[1].team).toBe('Chile');     // 4 pts
      expect(standings[2].team).toBe('Peru');      // 2 pts
      expect(standings[3].team).toBe('Canada');    // 1 pt
    });

    it('debe usar diferencia de goles como desempate', () => {
      const matches = [
        createMatch('1', 'Brasil', 'Colombia', 3, 0),   // BRA +3, GD +3
        createMatch('2', 'Ecuador', 'Venezuela', 1, 0), // ECU +3, GD +1
      ];

      const standings = calculateGroupStandings(matches, 'A');

      // Ambos tienen 3 puntos, pero Brasil tiene mejor GD
      expect(standings[0].team).toBe('Brasil');
      expect(standings[1].team).toBe('Ecuador');
    });

    it('debe usar goles a favor como segundo desempate', () => {
      const matches = [
        createMatch('1', 'Mexico', 'USA', 2, 1),     // MEX +3, GD +1, GF 2
        createMatch('2', 'Canada', 'Jamaica', 3, 2), // CAN +3, GD +1, GF 3
      ];

      const standings = calculateGroupStandings(matches, 'A');

      // Mismos puntos y GD, pero Canada tiene más goles a favor
      expect(standings[0].team).toBe('Canada');
      expect(standings[1].team).toBe('Mexico');
    });

    it('debe manejar empates correctamente (1 punto cada uno)', () => {
      const matches = [
        createMatch('1', 'Spain', 'Italy', 1, 1),
      ];

      const standings = calculateGroupStandings(matches, 'A');

      expect(standings[0].points).toBe(1);
      expect(standings[1].points).toBe(1);
    });

    it('debe ignorar partidos sin resultado', () => {
      const matches = [
        createMatch('1', 'Germany', 'France', 2, 1),
        createMatch('2', 'Germany', 'Portugal', undefined, undefined),
      ];

      const standings = calculateGroupStandings(matches, 'A');

      expect(standings[0].team).toBe('Germany');
      expect(standings[0].points).toBe(3);
      expect(standings[0].played).toBe(1);
    });
  });

  describe('getBestThirds', () => {
    it('debe retornar los 8 mejores terceros ordenados', () => {
      const allGroupStandings = {
        'A': [
          { team: 'A1', points: 9, goalDiff: 5, goalsFor: 7, played: 3, group: 'A' },
          { team: 'A2', points: 6, goalDiff: 2, goalsFor: 5, played: 3, group: 'A' },
          { team: 'A3', points: 4, goalDiff: 1, goalsFor: 4, played: 3, group: 'A' }, // 3ro
          { team: 'A4', points: 0, goalDiff: -8, goalsFor: 1, played: 3, group: 'A' },
        ],
        'B': [
          { team: 'B1', points: 7, goalDiff: 4, goalsFor: 6, played: 3, group: 'B' },
          { team: 'B2', points: 5, goalDiff: 1, goalsFor: 4, played: 3, group: 'B' },
          { team: 'B3', points: 3, goalDiff: 0, goalsFor: 3, played: 3, group: 'B' }, // 3ro
          { team: 'B4', points: 1, goalDiff: -5, goalsFor: 2, played: 3, group: 'B' },
        ],
      };

      const bestThirds = getBestThirds(allGroupStandings);

      expect(bestThirds.length).toBeLessThanOrEqual(8);
      expect(bestThirds[0].team).toBe('A3'); // 4 pts > 3 pts
      expect(bestThirds[1].team).toBe('B3');
    });

    it('debe ordenar terceros por puntos, GD, GF', () => {
      const allGroupStandings = {
        'A': [
          { team: 'X', points: 9, goalDiff: 0, goalsFor: 0, played: 3, group: 'A' },
          { team: 'X', points: 6, goalDiff: 0, goalsFor: 0, played: 3, group: 'A' },
          { team: '3A', points: 3, goalDiff: 2, goalsFor: 5, played: 3, group: 'A' },
          { team: 'X', points: 0, goalDiff: 0, goalsFor: 0, played: 3, group: 'A' },
        ],
        'B': [
          { team: 'X', points: 9, goalDiff: 0, goalsFor: 0, played: 3, group: 'B' },
          { team: 'X', points: 6, goalDiff: 0, goalsFor: 0, played: 3, group: 'B' },
          { team: '3B', points: 3, goalDiff: 2, goalsFor: 6, played: 3, group: 'B' }, // Más GF
          { team: 'X', points: 0, goalDiff: 0, goalsFor: 0, played: 3, group: 'B' },
        ],
      };

      const bestThirds = getBestThirds(allGroupStandings);

      // Mismos puntos y GD, pero 3B tiene más goles a favor
      expect(bestThirds[0].team).toBe('3B');
      expect(bestThirds[1].team).toBe('3A');
    });
  });

  describe('generateRoundOf32', () => {
    it('debe generar 16 partidos para R32', () => {
      const mockStandings: { [group: string]: any[] } = {};
      const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      
      groups.forEach(g => {
        mockStandings[g] = [
          { team: `${g}1`, points: 9, goalDiff: 5, goalsFor: 7, played: 3, group: g },
          { team: `${g}2`, points: 6, goalDiff: 2, goalsFor: 5, played: 3, group: g },
          { team: `${g}3`, points: 3, goalDiff: 0, goalsFor: 3, played: 3, group: g },
          { team: `${g}4`, points: 0, goalDiff: -7, goalsFor: 1, played: 3, group: g },
        ];
      });

      const r32 = generateRoundOf32(mockStandings);

      expect(r32).toHaveLength(16);
      expect(r32.every(m => m.round === 'R32')).toBe(true);
      expect(r32.every(m => m.team1 && m.team2)).toBe(true);
    });

    it('cada partido debe tener ID único', () => {
      const mockStandings: { [group: string]: any[] } = {};
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(g => {
        mockStandings[g] = [
          { team: `${g}1`, points: 9, goalDiff: 5, goalsFor: 7, played: 3, group: g },
          { team: `${g}2`, points: 6, goalDiff: 2, goalsFor: 5, played: 3, group: g },
          { team: `${g}3`, points: 3, goalDiff: 0, goalsFor: 3, played: 3, group: g },
          { team: `${g}4`, points: 0, goalDiff: -7, goalsFor: 1, played: 3, group: g },
        ];
      });

      const r32 = generateRoundOf32(mockStandings);
      const ids = r32.map(m => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(16);
    });
  });
});