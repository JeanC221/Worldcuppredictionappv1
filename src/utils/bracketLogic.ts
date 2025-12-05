import { Match } from './types';

interface TeamStats {
  team: string;
  points: number;
  goalDiff: number;
  goalsFor: number;
  played: number;
  group: string;
}

export interface KnockoutPairing {
  id: string; 
  team1: string; 
  team2: string;
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F';
}

export const calculateGroupStandings = (matches: Match[], group: string): TeamStats[] => {
  const teams: { [key: string]: TeamStats } = {};

  // 1. Inicializar equipos
  matches.forEach(m => {
    if (!teams[m.team1]) teams[m.team1] = { team: m.team1, points: 0, goalDiff: 0, goalsFor: 0, played: 0, group };
    if (!teams[m.team2]) teams[m.team2] = { team: m.team2, points: 0, goalDiff: 0, goalsFor: 0, played: 0, group };
  });

  // 2. Calcular puntos
  matches.forEach(m => {
    if (m.score1 !== undefined && m.score2 !== undefined) {
      const t1 = teams[m.team1];
      const t2 = teams[m.team2];

      t1.played++;
      t2.played++;
      t1.goalsFor += m.score1;
      t2.goalsFor += m.score2;
      t2.goalDiff += m.score2 - m.score1;
      t1.goalDiff += m.score1 - m.score2;

      if (m.score1 > m.score2) {
        t1.points += 3;
      } else if (m.score2 > m.score1) {
        t2.points += 3;
      } else {
        t1.points += 1;
        t2.points += 1;
      }
    }
  });

  // 3. Ordenar según reglas FIFA: Puntos > Diferencia de Gol > Goles a Favor
  return Object.values(teams).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
};

 // Encontrar los 8 mejores terceros de todos los grupos
export const getBestThirds = (allGroupStandings: { [group: string]: TeamStats[] }): TeamStats[] => {
  const thirds: TeamStats[] = [];
  
  // Extraer el 3er lugar de cada grupo
  Object.keys(allGroupStandings).forEach(group => {
    const standings = allGroupStandings[group];
    if (standings.length >= 3) {
      thirds.push(standings[2]); 
    }
  });

  // Ordenar los terceros entre sí
  return thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  }).slice(0, 8); 
};

export const generateRoundOf32 = (
  allGroupStandings: { [group: string]: TeamStats[] }
): KnockoutPairing[] => {
  
  const getTeam = (pos: number, group: string) => {
    const standing = allGroupStandings[group];
    return standing && standing[pos] ? standing[pos].team : `TBD (${pos + 1}${group})`;
  };

  const bestThirds = getBestThirds(allGroupStandings);
  const qualifiedThirdsGroups = bestThirds.map(t => t.group);

  const getThird = (targetGroups: string[]) => {
    const foundGroup = targetGroups.find(g => qualifiedThirdsGroups.includes(g));
    if (foundGroup) {
      return getTeam(2, foundGroup);
    }
    return bestThirds.length > 0 ? bestThirds[0].team : "3ro Mejor";
  };

  
  return [
    // --- LADO IZQUIERDO ---
    { id: 'R32-1', team1: getTeam(0, 'A'), team2: getThird(['C','E','F','H','I']), round: 'R32' }, // 1A vs 3ro
    { id: 'R32-2', team1: getTeam(1, 'A'), team2: getTeam(1, 'B'), round: 'R32' },             // 2A vs 2B
    { id: 'R32-3', team1: getTeam(0, 'K'), team2: getTeam(1, 'L'), round: 'R32' },             // 1K vs 2L
    { id: 'R32-4', team1: getTeam(0, 'H'), team2: getTeam(1, 'J'), round: 'R32' },             // 1H vs 2J
    
    { id: 'R32-5', team1: getTeam(0, 'D'), team2: getThird(['B','E','F','I','J']), round: 'R32' }, // 1D vs 3ro
    { id: 'R32-6', team1: getTeam(1, 'C'), team2: getTeam(1, 'D'), round: 'R32' },             // 2C vs 2D
    { id: 'R32-7', team1: getTeam(0, 'E'), team2: getTeam(1, 'F'), round: 'R32' },             // 1E vs 2F
    { id: 'R32-8', team1: getTeam(0, 'I'), team2: getThird(['G','H','J','K','L']), round: 'R32' }, // 1I vs 3ro

    // --- LADO DERECHO ---
    { id: 'R32-9', team1: getTeam(0, 'B'), team2: getThird(['E','F','G','I','J']), round: 'R32' }, // 1B vs 3ro
    { id: 'R32-10', team1: getTeam(1, 'E'), team2: getTeam(1, 'I'), round: 'R32' },            // 2E vs 2I
    { id: 'R32-11', team1: getTeam(0, 'G'), team2: getThird(['A','H','I','J','K']), round: 'R32' },// 1G vs 3ro
    { id: 'R32-12', team1: getTeam(1, 'F'), team2: getTeam(1, 'C'), round: 'R32' },            // 2F vs 2C (?) - Ajuste visual

    { id: 'R32-13', team1: getTeam(0, 'F'), team2: getTeam(1, 'H'), round: 'R32' },            // 1F vs 2H
    { id: 'R32-14', team1: getTeam(0, 'C'), team2: getTeam(1, 'G'), round: 'R32' },            // 1C vs 2G (?)
    { id: 'R32-15', team1: getTeam(0, 'J'), team2: getTeam(1, 'K'), round: 'R32' },            // 1J vs 2K
    { id: 'R32-16', team1: getTeam(0, 'L'), team2: getThird(['A','B','C','D','G']), round: 'R32' }, // 1L vs 3ro
  ];
}; 