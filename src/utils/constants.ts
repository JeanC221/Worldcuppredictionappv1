export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Fases del torneo
export type TournamentPhase = 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';

export const PHASES: { 
  id: TournamentPhase; 
  name: string; 
  shortName: string;
  teamsAdvancing: number; // Cuántos equipos pasan de esta fase
  matchCount: number; // Número de partidos en esta fase
}[] = [
  { id: 'groups', name: 'Fase de Grupos', shortName: 'Grupos', teamsAdvancing: 32, matchCount: 72 },
  { id: 'r32', name: 'Dieciseisavos de Final', shortName: '32avos', teamsAdvancing: 16, matchCount: 16 },
  { id: 'r16', name: 'Octavos de Final', shortName: 'Octavos', teamsAdvancing: 8, matchCount: 8 },
  { id: 'qf', name: 'Cuartos de Final', shortName: 'Cuartos', teamsAdvancing: 4, matchCount: 4 },
  { id: 'sf', name: 'Semifinales', shortName: 'Semis', teamsAdvancing: 2, matchCount: 2 },
  { id: 'final', name: 'Final', shortName: 'Final', teamsAdvancing: 1, matchCount: 1 },
];

// Fechas de inicio de cada fase (cuando se desbloquea la predicción)
// Y fecha límite para enviar predicciones de esa fase
export const PHASE_DATES: { 
  [key in TournamentPhase]: { 
    start: Date;      // Cuando empieza la fase
    lockBefore: Date; // Fecha límite para enviar predicción (antes de que empiecen los partidos)
  } 
} = {
  groups: { 
    start: new Date('2026-06-11T00:00:00'),
    lockBefore: new Date('2026-06-10T23:59:59') 
  },
  r32: { 
    start: new Date('2026-06-28T00:00:00'),
    lockBefore: new Date('2026-06-27T23:59:59') 
  },
  r16: { 
    start: new Date('2026-07-01T00:00:00'),
    lockBefore: new Date('2026-06-30T23:59:59') 
  },
  qf: { 
    start: new Date('2026-07-04T00:00:00'),
    lockBefore: new Date('2026-07-03T23:59:59') 
  },
  sf: { 
    start: new Date('2026-07-08T00:00:00'),
    lockBefore: new Date('2026-07-07T23:59:59') 
  },
  final: { 
    start: new Date('2026-07-11T00:00:00'),
    lockBefore: new Date('2026-07-10T23:59:59') 
  },
};

// Sistema de puntuación
export const SCORING = {
  EXACT_MATCH: 5,      // Marcador exacto
  CORRECT_WINNER: 3,   // Ganador correcto (o empate)
  TEAM_ADVANCED: 2,    // Bonus por cada equipo que acierta que pasa de ronda
};

// Determina qué fase está activa actualmente (para predicciones)
export function getCurrentPhase(): TournamentPhase | null {
  const now = new Date();
  
  // Si aún no empieza el mundial
  if (now < PHASE_DATES.groups.start) {
    // Permitir llenar grupos antes del inicio
    if (now < PHASE_DATES.groups.lockBefore) {
      return 'groups';
    }
    return null;
  }
  
  // Buscar la fase activa (la última que ya empezó y cuya predicción aún se puede hacer)
  const phasesInOrder: TournamentPhase[] = ['groups', 'r32', 'r16', 'qf', 'sf', 'final'];
  
  for (let i = phasesInOrder.length - 1; i >= 0; i--) {
    const phase = phasesInOrder[i];
    const dates = PHASE_DATES[phase];
    
    // Si la fase ya empezó pero aún no llegó el lock de la siguiente, esta es la activa
    if (now >= dates.start && now < dates.lockBefore) {
      // La fase ya empezó, el lock ya pasó, no se puede predecir
      return null;
    }
    
    // Si estamos antes del lock de esta fase
    if (now < dates.lockBefore) {
      // Verificar que la fase anterior ya terminó (o es la primera)
      if (i === 0) return phase;
      const prevPhase = phasesInOrder[i - 1];
      if (now >= PHASE_DATES[prevPhase].start) {
        return phase;
      }
    }
  }
  
  return null;
}

// Determina si una fase puede ser predicha (aún no cerrada)
export function canPredictPhase(phase: TournamentPhase): boolean {
  const now = new Date();
  return now < PHASE_DATES[phase].lockBefore;
}

// Determina si una fase ya está bloqueada (ya pasó la fecha límite)
export function isPhaseLockedForPrediction(phase: TournamentPhase): boolean {
  const now = new Date();
  return now >= PHASE_DATES[phase].lockBefore;
}

// Determina si una fase ya terminó (todos sus partidos jugados)
export function isPhaseCompleted(phase: TournamentPhase): boolean {
  const now = new Date();
  const phasesInOrder: TournamentPhase[] = ['groups', 'r32', 'r16', 'qf', 'sf', 'final'];
  const currentIndex = phasesInOrder.indexOf(phase);
  
  // Si hay una fase siguiente y ya empezó, esta fase está completa
  if (currentIndex < phasesInOrder.length - 1) {
    const nextPhase = phasesInOrder[currentIndex + 1];
    return now >= PHASE_DATES[nextPhase].start;
  }
  
  // Para la final, verificar si ya pasó la fecha (un día después)
  return now > new Date('2026-07-12T00:00:00');
}

// Helper para obtener información de una fase
export function getPhaseInfo(phase: TournamentPhase) {
  return PHASES.find(p => p.id === phase);
}