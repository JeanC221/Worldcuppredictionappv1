import { jsPDF } from 'jspdf';
import { SCORING, PHASES, TournamentPhase } from './constants';

interface PollaData {
  userName: string;
  email: string;
  submittedAt: string;
  totalPoints: number;
  exactMatches?: number;
  correctWinners?: number;
  teamsBonus?: number;
  // Nuevo sistema de fases
  groupPredictions?: { [matchId: string]: { score1: number; score2: number } };
  teamsAdvancing?: string[];
  phases?: {
    [key in TournamentPhase]?: {
      matchPredictions: { [matchId: string]: { score1: number; score2: number } };
      teamsAdvancing: string[];
    };
  };
  scores?: {
    [key in TournamentPhase]?: {
      exactMatches: number;
      correctWinners: number;
      teamsAdvancedBonus: number;
      totalPoints: number;
    };
  };
  knockoutPredictions?: any;
  knockoutPicks?: { [key: string]: string };
}

interface MatchInfo {
  id: string;
  team1: string;
  team2: string;
  group: string;
  date: string;
  phase?: TournamentPhase;
  score1?: number | null;
  score2?: number | null;
}

// Colores del tema
const COLORS = {
  navy: [30, 58, 95] as [number, number, number],
  orange: [232, 93, 36] as [number, number, number],
  gold: [212, 168, 36] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  slate: [100, 116, 139] as [number, number, number],
  slateLight: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export async function generatePollaPDF(
  pollaData: PollaData, 
  allMatches: MatchInfo[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Helper para añadir nueva página si es necesario
  const checkNewPage = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  // Fondo del header
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 35, 4, 4, 'F');

  // Título
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('POLLA MUNDIALISTA 2026', pageWidth / 2, currentY + 14, { align: 'center' });

  // Nombre del usuario
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(pollaData.userName, pageWidth / 2, currentY + 24, { align: 'center' });

  // Fecha
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, currentY + 31, { align: 'center' });

  currentY += 42;

  // ===== STATS BOX =====
  const statsBoxHeight = 22;
  doc.setFillColor(...COLORS.slateLight);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, statsBoxHeight, 3, 3, 'F');

  const statsWidth = (pageWidth - margin * 2) / 5;
  const stats = [
    { label: 'PUNTOS', value: pollaData.totalPoints.toString(), color: COLORS.orange },
    { label: 'EXACTOS', value: (pollaData.exactMatches || 0).toString(), color: COLORS.emerald },
    { label: 'GANADOR', value: (pollaData.correctWinners || 0).toString(), color: COLORS.navy },
    { label: 'EQUIPOS', value: (pollaData.teamsBonus || 0).toString(), color: COLORS.gold },
    { label: 'ENVIADO', value: pollaData.submittedAt, color: COLORS.slate },
  ];

  stats.forEach((stat, i) => {
    const x = margin + statsWidth * i + statsWidth / 2;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...stat.color);
    doc.text(stat.value, x, currentY + 10, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate);
    doc.text(stat.label, x, currentY + 16, { align: 'center' });
  });

  currentY += statsBoxHeight + 8;

  // ===== OBTENER PREDICCIONES =====
  // Compatibilidad: nuevo sistema (phases) o antiguo (groupPredictions)
  const groupPredictions = pollaData.phases?.groups?.matchPredictions || pollaData.groupPredictions || {};
  const teamsAdvancing = pollaData.phases?.groups?.teamsAdvancing || pollaData.teamsAdvancing || [];

  // ===== AGRUPAR PARTIDOS POR GRUPO =====
  const matchesMap = new Map<string, MatchInfo>();
  allMatches.forEach(m => matchesMap.set(m.id, m));

  const predictionsByGroup: { [group: string]: Array<{ match: MatchInfo; pred: { score1: number; score2: number } }> } = {};
  
  for (const [matchId, pred] of Object.entries(groupPredictions)) {
    const match = matchesMap.get(matchId);
    if (match) {
      if (!predictionsByGroup[match.group]) predictionsByGroup[match.group] = [];
      predictionsByGroup[match.group].push({ match, pred });
    }
  }

  const groups = Object.keys(predictionsByGroup).sort();

  // ===== RENDER GRUPOS =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navy);
  doc.text('FASE DE GRUPOS', margin, currentY);
  currentY += 6;

  // Renderizar en 2 columnas
  const colWidth = (pageWidth - margin * 2 - 6) / 2;
  let col = 0;
  let colStartY = currentY;
  let maxColY = currentY;

  for (const group of groups) {
    const predictions = predictionsByGroup[group];
    const groupHeight = 10 + predictions.length * 7;

    // Check si necesitamos nueva página
    if (colStartY + groupHeight > pageHeight - margin) {
      if (col === 0) {
        col = 1;
        colStartY = currentY;
      } else {
        doc.addPage();
        currentY = margin;
        colStartY = margin;
        col = 0;
        maxColY = margin;
      }
    }

    const colX = margin + col * (colWidth + 6);
    let groupY = colStartY;

    // Header del grupo
    doc.setFillColor(...COLORS.navy);
    doc.roundedRect(colX, groupY, colWidth, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`GRUPO ${group}`, colX + 4, groupY + 5.5);

    // Puntos del grupo
    let groupPoints = 0;
    predictions.forEach(({ match, pred }) => {
      if (match.score1 !== null && match.score1 !== undefined) {
        const isExact = pred.score1 === match.score1 && pred.score2 === match.score2;
        if (isExact) {
          groupPoints += SCORING.EXACT_MATCH;
        } else {
          const predResult = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? -1 : 0;
          const actualResult = match.score1! > match.score2! ? 1 : match.score1! < match.score2! ? -1 : 0;
          if (predResult === actualResult) groupPoints += SCORING.CORRECT_WINNER;
        }
      }
    });

    if (groupPoints > 0) {
      doc.setFillColor(...COLORS.gold);
      doc.roundedRect(colX + colWidth - 18, groupY + 1.5, 15, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.white);
      doc.text(`${groupPoints} pts`, colX + colWidth - 10.5, groupY + 5, { align: 'center' });
    }

    groupY += 9;

    // Partidos del grupo
    predictions.forEach(({ match, pred }) => {
      const hasResult = match.score1 !== null && match.score1 !== undefined;
      const isExact = hasResult && pred.score1 === match.score1 && pred.score2 === match.score2;
      let isCorrectWinner = false;
      
      if (hasResult && !isExact) {
        const predResult = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? -1 : 0;
        const actualResult = match.score1! > match.score2! ? 1 : match.score1! < match.score2! ? -1 : 0;
        isCorrectWinner = predResult === actualResult;
      }

      // Fondo según resultado
      if (isExact) {
        doc.setFillColor(209, 250, 229); // emerald-100
      } else if (isCorrectWinner) {
        doc.setFillColor(219, 234, 254); // blue-100
      } else if (hasResult) {
        doc.setFillColor(254, 226, 226); // red-100
      } else {
        doc.setFillColor(...COLORS.slateLight);
      }
      doc.roundedRect(colX, groupY, colWidth, 6, 1, 1, 'F');

      // Equipos y marcador
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      // Team 1 (derecha alineado)
      const team1Short = match.team1.length > 12 ? match.team1.substring(0, 12) + '.' : match.team1;
      doc.text(team1Short, colX + colWidth / 2 - 14, groupY + 4, { align: 'right' });

      // Score predicho
      doc.setFont('helvetica', 'bold');
      const scoreText = `${pred.score1} - ${pred.score2}`;
      doc.text(scoreText, colX + colWidth / 2, groupY + 4, { align: 'center' });

      // Team 2 (izquierda alineado)
      doc.setFont('helvetica', 'normal');
      const team2Short = match.team2.length > 12 ? match.team2.substring(0, 12) + '.' : match.team2;
      doc.text(team2Short, colX + colWidth / 2 + 14, groupY + 4);

      // Resultado real si existe
      if (hasResult) {
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        doc.text(`(${match.score1}-${match.score2})`, colX + colWidth - 8, groupY + 4);
      }

      // Puntos ganados
      if (isExact) {
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.emerald);
        doc.text(`+${SCORING.EXACT_MATCH}`, colX + colWidth - 3, groupY + 4);
      } else if (isCorrectWinner) {
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.navy);
        doc.text(`+${SCORING.CORRECT_WINNER}`, colX + colWidth - 3, groupY + 4);
      }

      groupY += 7;
    });

    colStartY = groupY + 4;
    maxColY = Math.max(maxColY, colStartY);

    // Alternar columnas
    if (col === 0) {
      col = 1;
      colStartY = currentY;
    } else {
      col = 0;
      currentY = maxColY;
      colStartY = currentY;
    }
  }

  currentY = maxColY + 5;

  // ===== EQUIPOS QUE AVANZAN =====
  if (teamsAdvancing.length > 0) {
    checkNewPage(25);
    
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(`EQUIPOS QUE AVANZAN (${teamsAdvancing.length})`, margin + 4, currentY + 5.5);
    
    currentY += 10;
    
    // Mostrar equipos en grid
    const teamsPerRow = 6;
    const teamBoxWidth = (pageWidth - margin * 2) / teamsPerRow;
    
    teamsAdvancing.forEach((team, index) => {
      const row = Math.floor(index / teamsPerRow);
      const col = index % teamsPerRow;
      const x = margin + col * teamBoxWidth;
      const y = currentY + row * 8;
      
      if (y + 8 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFillColor(...COLORS.slateLight);
      doc.roundedRect(x + 1, y, teamBoxWidth - 2, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      const teamShort = team.length > 10 ? team.substring(0, 10) + '.' : team;
      doc.text(teamShort, x + teamBoxWidth / 2, y + 4.5, { align: 'center' });
    });
    
    const teamRows = Math.ceil(teamsAdvancing.length / teamsPerRow);
    currentY += teamRows * 8 + 5;
  }

  // ===== CAMPEÓN (si existe) =====
  if (pollaData.knockoutPicks && pollaData.knockoutPicks['F-1']) {
    checkNewPage(25);
    
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 3, 3, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.white);
    doc.text('TU CAMPEÓN', pageWidth / 2, currentY + 6, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pollaData.knockoutPicks['F-1'], pageWidth / 2, currentY + 15, { align: 'center' });
    
    currentY += 25;
  }

  // ===== RESUMEN DE PUNTUACIÓN =====
  checkNewPage(30);
  
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('SISTEMA DE PUNTUACIÓN', margin + 4, currentY + 5.5);
  
  currentY += 12;
  
  const scoringInfo = [
    { label: 'Marcador Exacto', value: `+${SCORING.EXACT_MATCH} pts`, color: COLORS.emerald },
    { label: 'Ganador Correcto', value: `+${SCORING.CORRECT_WINNER} pts`, color: COLORS.navy },
    { label: 'Equipo que Avanza', value: `+${SCORING.TEAM_ADVANCED} pts`, color: COLORS.gold },
  ];
  
  scoringInfo.forEach((info, i) => {
    doc.setFillColor(...COLORS.slateLight);
    doc.roundedRect(margin + i * 60, currentY, 55, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...info.color);
    doc.text(info.value, margin + i * 60 + 27.5, currentY + 5, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.slate);
    doc.text(info.label, margin + i * 60 + 27.5, currentY + 10, { align: 'center' });
  });

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Polla Mundialista 2026 • ${pollaData.userName} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Descargar
  doc.save(`Polla_${pollaData.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Función auxiliar para descargar todas las pollas como PDFs individuales en un ZIP
export async function generateAllPollasPDFs(
  pollas: PollaData[],
  allMatches: MatchInfo[]
): Promise<void> {
  // Generar cada PDF individualmente
  for (const polla of pollas) {
    await generatePollaPDF(polla, allMatches);
    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}