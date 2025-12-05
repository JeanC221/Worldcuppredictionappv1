import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';
import { Match } from './types';

describe('calculateScore', () => {
  // Partidos de ejemplo
  const createMatch = (id: string, score1?: number, score2?: number): Match => ({
    id,
    team1: 'Team A',
    team2: 'Team B',
    date: '2026-06-11',
    group: 'A',
    score1,
    score2,
  });

  describe('Marcador Exacto (+5 puntos)', () => {
    it('debe dar 5 puntos por marcador exacto', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 1 },
      };
      const matches = [createMatch('match-1', 2, 1)];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(1);
      expect(result.correctWinners).toBe(0);
      expect(result.totalPoints).toBe(5);
    });

    it('debe dar 5 puntos por empate exacto 0-0', () => {
      const predictions = {
        'match-1': { score1: 0, score2: 0 },
      };
      const matches = [createMatch('match-1', 0, 0)];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(1);
      expect(result.totalPoints).toBe(5);
    });

    it('debe dar 5 puntos por empate exacto 2-2', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 2 },
      };
      const matches = [createMatch('match-1', 2, 2)];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(1);
      expect(result.totalPoints).toBe(5);
    });
  });

  describe('Ganador Correcto (+3 puntos)', () => {
    it('debe dar 3 puntos por acertar ganador local', () => {
      const predictions = {
        'match-1': { score1: 3, score2: 0 }, // Predice gana equipo 1
      };
      const matches = [createMatch('match-1', 1, 0)]; // Gana equipo 1

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(0);
      expect(result.correctWinners).toBe(1);
      expect(result.totalPoints).toBe(3);
    });

    it('debe dar 3 puntos por acertar ganador visitante', () => {
      const predictions = {
        'match-1': { score1: 0, score2: 2 },
      };
      const matches = [createMatch('match-1', 1, 3)];

      const result = calculateScore(predictions, matches);

      expect(result.correctWinners).toBe(1);
      expect(result.totalPoints).toBe(3);
    });

    it('debe dar 3 puntos por acertar empate (diferente marcador)', () => {
      const predictions = {
        'match-1': { score1: 1, score2: 1 },
      };
      const matches = [createMatch('match-1', 0, 0)];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(0);
      expect(result.correctWinners).toBe(1);
      expect(result.totalPoints).toBe(3);
    });
  });

  describe('Predicción Incorrecta (0 puntos)', () => {
    it('debe dar 0 puntos si predice ganador equivocado', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 0 }, // Predice gana equipo 1
      };
      const matches = [createMatch('match-1', 0, 1)]; // Gana equipo 2

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(0);
      expect(result.correctWinners).toBe(0);
      expect(result.totalPoints).toBe(0);
    });

    it('debe dar 0 puntos si predice empate pero hay ganador', () => {
      const predictions = {
        'match-1': { score1: 1, score2: 1 },
      };
      const matches = [createMatch('match-1', 2, 1)];

      const result = calculateScore(predictions, matches);

      expect(result.totalPoints).toBe(0);
    });

    it('debe dar 0 puntos si predice ganador pero es empate', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 0 },
      };
      const matches = [createMatch('match-1', 1, 1)];

      const result = calculateScore(predictions, matches);

      expect(result.totalPoints).toBe(0);
    });
  });

  describe('Múltiples partidos', () => {
    it('debe sumar correctamente múltiples partidos', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 1 }, // Exacto: +5
        'match-2': { score1: 3, score2: 0 }, // Ganador correcto: +3
        'match-3': { score1: 0, score2: 2 }, // Incorrecto: 0
      };
      const matches = [
        createMatch('match-1', 2, 1), // Exacto
        createMatch('match-2', 1, 0), // Solo ganador
        createMatch('match-3', 1, 0), // Falló
      ];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(1);
      expect(result.correctWinners).toBe(1);
      expect(result.totalPoints).toBe(8); // 5 + 3 + 0
    });

    it('debe manejar 6 partidos de un grupo completo', () => {
      const predictions = {
        'm1': { score1: 1, score2: 0 }, // Exacto +5
        'm2': { score1: 2, score2: 2 }, // Exacto +5
        'm3': { score1: 0, score2: 1 }, // Ganador +3
        'm4': { score1: 3, score2: 1 }, // Ganador +3
        'm5': { score1: 0, score2: 0 }, // Incorrecto 0
        'm6': { score1: 2, score2: 0 }, // Incorrecto 0
      };
      const matches = [
        createMatch('m1', 1, 0),
        createMatch('m2', 2, 2),
        createMatch('m3', 0, 2),
        createMatch('m4', 2, 0),
        createMatch('m5', 1, 0),
        createMatch('m6', 0, 1),
      ];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(2);
      expect(result.correctWinners).toBe(2);
      expect(result.totalPoints).toBe(16); // 5+5+3+3+0+0
    });
  });

  describe('Casos especiales', () => {
    it('debe ignorar partidos sin resultado oficial', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 1 },
        'match-2': { score1: 1, score2: 0 },
      };
      const matches = [
        createMatch('match-1', 2, 1), // Con resultado
        createMatch('match-2', undefined, undefined), // Sin resultado
      ];

      const result = calculateScore(predictions, matches);

      expect(result.totalPoints).toBe(5); // Solo cuenta match-1
    });

    it('debe ignorar partidos sin predicción del usuario', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 1 },
        // match-2 no tiene predicción
      };
      const matches = [
        createMatch('match-1', 2, 1),
        createMatch('match-2', 1, 0),
      ];

      const result = calculateScore(predictions, matches);

      expect(result.totalPoints).toBe(5);
    });

    it('debe retornar 0 si no hay predicciones', () => {
      const predictions = {};
      const matches = [createMatch('match-1', 2, 1)];

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(0);
      expect(result.correctWinners).toBe(0);
      expect(result.totalPoints).toBe(0);
    });

    it('debe retornar 0 si no hay partidos', () => {
      const predictions = {
        'match-1': { score1: 2, score2: 1 },
      };
      const matches: Match[] = [];

      const result = calculateScore(predictions, matches);

      expect(result.totalPoints).toBe(0);
    });
  });

  describe('Puntuación máxima posible', () => {
    it('72 partidos exactos = 360 puntos (máximo fase de grupos)', () => {
      const predictions: { [id: string]: { score1: number; score2: number } } = {};
      const matches: Match[] = [];

      for (let i = 1; i <= 72; i++) {
        predictions[`m${i}`] = { score1: 1, score2: 0 };
        matches.push(createMatch(`m${i}`, 1, 0));
      }

      const result = calculateScore(predictions, matches);

      expect(result.exactMatches).toBe(72);
      expect(result.totalPoints).toBe(360); // 72 * 5
    });
  });
});