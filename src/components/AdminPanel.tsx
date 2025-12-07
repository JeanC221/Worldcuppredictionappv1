import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, writeBatch, query, orderBy, deleteDoc 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { groupFixtures } from '../utils/mockData';
import { Match, PhaseScore } from '../utils/types';
import { useAdmin } from '../hooks/useAdmin';
import { 
  Shield, Database, Trophy, Users, RefreshCw, Save, 
  CheckCircle, AlertTriangle, Loader2, ClipboardList, Settings,
  Trash2, Search, Download 
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { broadcastNotification, createNotification } from '../hooks/useNotifications';
import { TeamDisplay } from './TeamDisplay';
import { generatePollaPDF } from '../utils/pdfGenerator';
import { 
  calculateScore, 
  calculatePhaseScore, 
  calculateTotalScore,
  getTeamsAdvancingFromGroups 
} from '../utils/scoring';
import { TournamentPhase, PHASES, SCORING } from '../utils/constants';

interface MatchWithScore extends Match {
  status?: string;
}

interface UserPolla {
  docId: string;
  userName: string;
  email: string;
  submittedAt: string;
  totalPoints: number;
  exactMatches?: number;
  correctWinners?: number;
  teamsBonus?: number;
}

// Los 12 grupos del Mundial 2026
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('matches');
  
  // Estados para partidos
  const [allMatches, setAllMatches] = useState<MatchWithScore[]>([]);
  const [editedScores, setEditedScores] = useState<{ [matchId: string]: { score1: string; score2: string } }>({});
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  
  // Estados para usuarios
  const [users, setUsers] = useState<UserPolla[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserPolla | null>(null);
  const [downloadingUser, setDownloadingUser] = useState<string | null>(null);
  
  // Estados para herramientas
  const [seedingStatus, setSeedingStatus] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateProgress, setRecalculateProgress] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalMatches: 0,
    playedMatches: 0,
    totalUsers: 0,
    totalPredictions: 0
  });

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchData();
    } else if (!adminLoading) {
      setDataLoading(false);
    }
  }, [isAdmin, adminLoading]);

  const fetchData = async () => {
    try {
      // Cargar partidos
      const matchesSnap = await getDocs(query(collection(db, 'partidos'), orderBy('group'), orderBy('date')));
      const matchesList: MatchWithScore[] = [];
      let played = 0;
      
      matchesSnap.forEach((docSnap) => {
        const data = docSnap.data() as MatchWithScore;
        const match = { ...data, id: docSnap.id };
        matchesList.push(match);
        if (match.score1 !== null && match.score1 !== undefined) {
          played++;
        }
      });
      
      setAllMatches(matchesList);
      
      // Cargar usuarios con pollas
      const usersSnap = await getDocs(collection(db, 'polla_completa'));
      const usersList: UserPolla[] = [];
      
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({
          docId: docSnap.id,
          userName: data.userName || 'Sin nombre',
          email: data.userEmail || '',
          submittedAt: data.submittedAt?.toDate?.()?.toLocaleDateString('es-ES') || 'N/A',
          totalPoints: data.totalPoints || 0,
          exactMatches: data.totalExactMatches || data.exactMatches || 0,
          correctWinners: data.totalCorrectWinners || data.correctWinners || 0,
          teamsBonus: data.totalTeamsBonus || 0
        });
      });
      
      setUsers(usersList.sort((a, b) => b.totalPoints - a.totalPoints));
      
      setStats({
        totalMatches: matchesSnap.size,
        playedMatches: played,
        totalUsers: usersSnap.size,
        totalPredictions: usersSnap.size
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveScore = async (matchId: string) => {
    const scores = editedScores[matchId];
    if (!scores) return;
    
    const score1 = scores.score1 === '' ? undefined : parseInt(scores.score1);
    const score2 = scores.score2 === '' ? undefined : parseInt(scores.score2);
    
    if (score1 !== undefined && (isNaN(score1) || score1 < 0 || score1 > 20)) {
      alert('Score 1 inválido');
      return;
    }
    if (score2 !== undefined && (isNaN(score2) || score2 < 0 || score2 > 20)) {
      alert('Score 2 inválido');
      return;
    }
    
    setSavingMatch(matchId);
    
    try {
      const matchData = allMatches.find(m => m.id === matchId);
      
      await updateDoc(doc(db, 'partidos', matchId), {
        score1: score1 ?? null,
        score2: score2 ?? null,
        status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED'
      });
      
      setAllMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, score1, score2, status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED' } as MatchWithScore
          : m
      ));
      
      setEditedScores(prev => {
        const newState = { ...prev };
        delete newState[matchId];
        return newState;
      });

      // Notificaciones si hay resultado
      if (score1 !== undefined && score2 !== undefined && matchData) {
        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        const allUserIds: string[] = [];
        
        for (const pollaDoc of pollasSnap.docs) {
          const userId = pollaDoc.data().userId;
          allUserIds.push(userId);
          
          // Buscar predicción en el nuevo sistema (phases) o el anterior (groupPredictions)
          const data = pollaDoc.data();
          let userPred = null;
          
          if (data.phases?.groups?.matchPredictions?.[matchId]) {
            userPred = data.phases.groups.matchPredictions[matchId];
          } else if (data.groupPredictions?.[matchId]) {
            userPred = data.groupPredictions[matchId];
          }
          
          if (userPred) {
            const isExact = userPred.score1 === score1 && userPred.score2 === score2;
            const predResult = userPred.score1 > userPred.score2 ? 1 : userPred.score1 < userPred.score2 ? -1 : 0;
            const actualResult = score1 > score2 ? 1 : score1 < score2 ? -1 : 0;
            const isCorrectWinner = !isExact && predResult === actualResult;
            
            if (isExact) {
              await createNotification(userId, 'exact_match', `¡Marcador Exacto! +${SCORING.EXACT_MATCH} pts`,
                `Acertaste ${matchData.team1} ${score1} - ${score2} ${matchData.team2}`, { matchId });
            } else if (isCorrectWinner) {
              await createNotification(userId, 'match_result', `¡Ganador Correcto! +${SCORING.CORRECT_WINNER} pts`,
                `Acertaste el ganador de ${matchData.team1} vs ${matchData.team2}`, { matchId });
            }
          }
        }
        
        await broadcastNotification(allUserIds, 'match_result', 'Resultado Actualizado',
          `${matchData.team1} ${score1} - ${score2} ${matchData.team2}`, { matchId });
      }
      
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setSavingMatch(null);
    }
  };

  const handleDeletePolla = async () => {
    if (!userToDelete) return;
    
    setDeletingUser(userToDelete.docId);
    
    try {
      await deleteDoc(doc(db, 'polla_completa', userToDelete.docId));
      setUsers(prev => prev.filter(u => u.docId !== userToDelete.docId));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1, totalPredictions: prev.totalPredictions - 1 }));
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error eliminando polla:', error);
      alert('Error al eliminar');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleSeedDatabase = async () => {
    const confirm = window.confirm(
      `¿Estás seguro? Esto creará ${groupFixtures.reduce((acc, g) => acc + g.matches.length, 0)} partidos en Firebase.`
    );
    if (!confirm) return;
    
    setIsSeeding(true);
    setSeedingStatus('Iniciando...');
    
    try {
      const batch = writeBatch(db);
      let count = 0;
      
      groupFixtures.forEach((groupData) => {
        groupData.matches.forEach((match) => {
          const matchRef = doc(db, 'partidos', match.id);
          batch.set(matchRef, {
            ...match,
            group: groupData.group,
            phase: 'groups' as TournamentPhase,
            score1: null,
            score2: null,
            status: 'SCHEDULED'
          });
          count++;
        });
      });
      
      await batch.commit();
      setSeedingStatus(`${count} partidos creados`);
      await fetchData();
      
    } catch (error: any) {
      setSeedingStatus(`Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRecalculateRankings = async () => {
    setIsRecalculating(true);
    setRecalculateProgress('Cargando datos...');
    
    try {
      // Obtener todos los partidos
      const matchesSnap = await getDocs(collection(db, 'partidos'));
      const allMatchesData: Match[] = matchesSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Match[];
      
      // Separar partidos por grupo para fase de grupos
      const groupMatches = allMatchesData.filter(m => !m.phase || m.phase === 'groups');
      
      // Agrupar partidos por grupo para getTeamsAdvancingFromGroups
      const matchesByGroup: { [group: string]: Match[] } = {};
      for (const match of groupMatches) {
        if (!matchesByGroup[match.group]) {
          matchesByGroup[match.group] = [];
        }
        matchesByGroup[match.group].push(match);
      }
      
      // Crear predicciones "reales" basadas en resultados actuales para calcular equipos que avanzaron
      const realPredictions: { [matchId: string]: { score1: number; score2: number } } = {};
      for (const match of groupMatches) {
        if (match.score1 !== undefined && match.score1 !== null && 
            match.score2 !== undefined && match.score2 !== null) {
          realPredictions[match.id] = { score1: match.score1, score2: match.score2 };
        }
      }
      
      // Calcular equipos que realmente avanzaron (basado en resultados reales)
      const actualTeamsAdvancing = getTeamsAdvancingFromGroups(realPredictions, matchesByGroup);
      
      setRecalculateProgress('Recalculando usuarios...');
      
      // Recalcular puntos de cada usuario
      const pollasSnap = await getDocs(collection(db, 'polla_completa'));
      const batch = writeBatch(db);
      let processedCount = 0;
      
      for (const pollaDoc of pollasSnap.docs) {
        const data = pollaDoc.data();
        
        // Determinar qué sistema usa el usuario
        if (data.phases) {
          // Nuevo sistema de fases
          const phaseScores: { [key in TournamentPhase]?: PhaseScore } = {};
          
          // Calcular puntuación para fase de grupos
          if (data.phases.groups) {
            const userGroupPredictions = data.phases.groups.matchPredictions || {};
            const userTeamsAdvancing = data.phases.groups.teamsAdvancing || [];
            
            const groupScore = calculatePhaseScore(
              'groups',
              userGroupPredictions,
              groupMatches,
              userTeamsAdvancing,
              actualTeamsAdvancing
            );
            
            phaseScores['groups'] = groupScore;
          }
          
          // TODO: Agregar cálculo para otras fases (r32, r16, qf, sf, final) cuando se implementen
          
          // Calcular totales
          const totals = calculateTotalScore(phaseScores);
          
          batch.update(doc(db, 'polla_completa', pollaDoc.id), {
            scores: phaseScores,
            totalPoints: totals.totalPoints,
            totalExactMatches: totals.totalExactMatches,
            totalCorrectWinners: totals.totalCorrectWinners,
            totalTeamsBonus: totals.totalTeamsBonus
          });
          
        } else {
          // Sistema anterior (groupPredictions directo)
          const predictions = data.groupPredictions || {};
          
          const predictionMap: { [matchId: string]: { score1: number; score2: number } } = {};
          for (const [matchId, pred] of Object.entries(predictions)) {
            const p = pred as { score1?: number; score2?: number };
            if (p.score1 !== undefined && p.score2 !== undefined) {
              predictionMap[matchId] = { score1: p.score1, score2: p.score2 };
            }
          }

          const score = calculateScore(predictionMap, groupMatches);

          batch.update(doc(db, 'polla_completa', pollaDoc.id), {
            totalPoints: score.totalPoints,
            exactMatches: score.exactMatches,
            correctWinners: score.correctWinners,
            totalTeamsBonus: 0
          });
        }
        
        processedCount++;
        setRecalculateProgress(`Procesando ${processedCount}/${pollasSnap.size} usuarios...`);
      }

      await batch.commit();
      setRecalculateProgress('');
      await fetchData();
      alert('Rankings recalculados correctamente');
      
    } catch (error) {
      console.error('Error recalculando:', error);
      alert('Error al recalcular');
      setRecalculateProgress('');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDownloadPolla = async (user: UserPolla) => {
    setDownloadingUser(user.docId);
    try {
      const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
      const pollaDoc = await getDoc(firestoreDoc(db, 'polla_completa', user.docId));
      
      if (!pollaDoc.exists()) {
        alert('No se encontró la polla');
        return;
      }

      const pollaData = pollaDoc.data();
      
      // Preparar datos para el PDF - compatible con ambos sistemas
      const pdfData = {
        userName: user.userName,
        email: user.email,
        submittedAt: user.submittedAt,
        totalPoints: user.totalPoints,
        exactMatches: pollaData.totalExactMatches || pollaData.exactMatches || 0,
        correctWinners: pollaData.totalCorrectWinners || pollaData.correctWinners || 0,
        teamsBonus: pollaData.totalTeamsBonus || 0,
        // Compatible con ambos sistemas
        groupPredictions: pollaData.phases?.groups?.matchPredictions || pollaData.groupPredictions || {},
        teamsAdvancing: pollaData.phases?.groups?.teamsAdvancing || [],
        knockoutPredictions: pollaData.knockoutPredictions || {},
        knockoutPicks: pollaData.knockoutPicks || {}
      };

      // Convertir allMatches al formato esperado
      const matchesInfo = allMatches.map(m => ({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        group: m.group,
        date: m.date,
        score1: m.score1,
        score2: m.score2
      }));

      await generatePollaPDF(pdfData, matchesInfo);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setDownloadingUser(null);
    }
  };

  const handleDownloadAllPollas = async () => {
    const confirm = window.confirm(
      `¿Descargar ${users.length} PDFs? Se generará un PDF por cada usuario.`
    );
    if (!confirm) return;

    try {
      const pollasSnap = await getDocs(collection(db, 'polla_completa'));
      
      const matchesInfo = allMatches.map(m => ({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        group: m.group,
        date: m.date,
        score1: m.score1,
        score2: m.score2
      }));

      let count = 0;
      for (const docSnap of pollasSnap.docs) {
        const data = docSnap.data();
        
        const pdfData = {
          userName: data.userName || 'Sin nombre',
          email: data.userEmail || '',
          submittedAt: data.submittedAt?.toDate?.()?.toLocaleDateString('es-ES') || 'N/A',
          totalPoints: data.totalPoints || 0,
          exactMatches: data.totalExactMatches || data.exactMatches || 0,
          correctWinners: data.totalCorrectWinners || data.correctWinners || 0,
          teamsBonus: data.totalTeamsBonus || 0,
          groupPredictions: data.phases?.groups?.matchPredictions || data.groupPredictions || {},
          teamsAdvancing: data.phases?.groups?.teamsAdvancing || [],
          knockoutPredictions: data.knockoutPredictions || {},
          knockoutPicks: data.knockoutPicks || {}
        };

        await generatePollaPDF(pdfData, matchesInfo);
        count++;
        
        // Pequeña pausa entre descargas
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      alert(`${count} PDFs generados exitosamente`);
      
    } catch (error) {
      console.error('Error generando PDFs:', error);
      alert('Error al generar PDFs');
    }
  };

  if (adminLoading || dataLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#1E3A5F]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="size-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
        <p className="text-slate-600 mb-6">No tienes permisos de administrador.</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  // Filtrar partidos por grupo seleccionado
  const filteredMatches = allMatches.filter(m => m.group === selectedGroup);

  // Filtrar usuarios
  const filteredUsers = users.filter(u => 
    u.userName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#E85D24] to-[#C44D1A] rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500">Gestiona partidos, usuarios y configuración</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Partidos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalMatches}</p>
              </div>
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                <Trophy className="size-6 text-[#1E3A5F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Jugados</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.playedMatches}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="size-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Usuarios</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-[#1E3A5F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Predicciones</p>
                <p className="text-3xl font-bold text-[#D4A824]">{stats.totalPredictions}</p>
              </div>
              <div className="w-12 h-12 bg-[#D4A824]/10 rounded-xl flex items-center justify-center">
                <Database className="size-6 text-[#D4A824]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100 p-1.5 rounded-2xl h-auto flex-wrap">
          <TabsTrigger value="matches" className="px-5 py-2.5 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <ClipboardList className="size-4 mr-2" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="users" className="px-5 py-2.5 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Users className="size-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="tools" className="px-5 py-2.5 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white">
            <Settings className="size-4 mr-2" />
            Herramientas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resultados */}
        <TabsContent value="matches">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-4">
                <CardTitle className="text-lg">Ingresar Resultados - Fase de Grupos</CardTitle>
                
                {/* Selector de 12 grupos como grid de cuadrados */}
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {GROUPS.map(group => {
                    const groupMatches = allMatches.filter(m => m.group === group);
                    const playedInGroup = groupMatches.filter(m => m.score1 !== null && m.score1 !== undefined).length;
                    const isComplete = playedInGroup === groupMatches.length && groupMatches.length > 0;
                    
                    return (
                      <button
                        key={group}
                        onClick={() => setSelectedGroup(group)}
                        className={`
                          aspect-square rounded-xl flex flex-col items-center justify-center
                          transition-all duration-200 font-bold text-lg
                          ${selectedGroup === group
                            ? 'bg-[#1E3A5F] text-white shadow-lg scale-105'
                            : isComplete
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }
                        `}
                      >
                        <span>{group}</span>
                        <span className="text-[10px] font-normal opacity-75">
                          {playedInGroup}/{groupMatches.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredMatches.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No hay partidos en el Grupo {selectedGroup}
                  </div>
                ) : (
                  filteredMatches.map((match) => {
                    const isEditing = editedScores[match.id] !== undefined;
                    const currentScore1 = isEditing ? editedScores[match.id].score1 : (match.score1?.toString() ?? '');
                    const currentScore2 = isEditing ? editedScores[match.id].score2 : (match.score2?.toString() ?? '');
                    const hasResult = match.score1 !== null && match.score1 !== undefined;
                    
                    return (
                      <div 
                        key={match.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                          hasResult ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        {/* Grupo badge */}
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{match.group}</span>
                        </div>
                        
                        {/* Equipos y scores */}
                        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                          <TeamDisplay team={match.team1} reverse className="flex-1 justify-end text-sm font-medium text-slate-700" flagSize="sm" />
                          
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              value={currentScore1}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: e.target.value, 
                                  score2: prev[match.id]?.score2 ?? match.score2?.toString() ?? '' 
                                }
                              }))}
                              className="w-12 h-9 text-center font-bold rounded-lg border-2"
                              placeholder="-"
                            />
                            <span className="text-slate-400 font-medium">-</span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={2}
                              value={currentScore2}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: prev[match.id]?.score1 ?? match.score1?.toString() ?? '', 
                                  score2: e.target.value 
                                }
                              }))}
                              className="w-12 h-9 text-center font-bold rounded-lg border-2"
                              placeholder="-"
                            />
                          </div>
                          
                          <TeamDisplay team={match.team2} className="flex-1 justify-start text-sm font-medium text-slate-700" flagSize="sm" />
                        </div>
                        
                        {/* Botón guardar */}
                        <Button
                          size="sm"
                          disabled={!isEditing || savingMatch === match.id}
                          onClick={() => handleSaveScore(match.id)}
                          className={`h-9 w-9 p-0 rounded-lg ${
                            isEditing ? 'bg-[#E85D24] hover:bg-[#C44D1A]' : 'bg-slate-200'
                          }`}
                        >
                          {savingMatch === match.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}
                        </Button>
                        
                        {/* Indicador de completado */}
                        {hasResult && (
                          <CheckCircle className="size-5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuarios */}
        <TabsContent value="users">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Usuarios con Polla ({users.length})</CardTitle>
                
                <div className="flex items-center gap-3">
                  {/* Download All Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadAllPollas}
                    className="h-9 rounded-xl border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5"
                  >
                    <Download className="size-4 mr-2" />
                    Descargar Todas
                  </Button>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      placeholder="Buscar usuario..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 w-64 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No se encontraron usuarios
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <div key={user.docId} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                      {/* Posición */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-[#D4A824] text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{user.userName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      {/* Puntos y stats */}
                      <div className="text-right">
                        <p className="font-bold text-[#E85D24]">{user.totalPoints} pts</p>
                        <p className="text-xs text-slate-400">
                          {user.exactMatches || 0}E | {user.correctWinners || 0}G | {user.teamsBonus || 0}B
                        </p>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        {/* Download Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-[#1E3A5F]/30 text-[#1E3A5F] hover:bg-[#1E3A5F]/10"
                          onClick={() => handleDownloadPolla(user)}
                          disabled={downloadingUser === user.docId}
                        >
                          {downloadingUser === user.docId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Download className="size-4" />
                          )}
                        </Button>
                        
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Herramientas */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inicializar BD */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] text-white py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="size-5" />
                  Inicializar Partidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-slate-600">
                  Crea los 72 partidos de fase de grupos del Mundial 2026.
                </p>
                <Button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="w-full bg-[#E85D24] hover:bg-[#C44D1A] rounded-xl"
                >
                  {isSeeding ? <Loader2 className="size-4 animate-spin mr-2" /> : <Database className="size-4 mr-2" />}
                  {isSeeding ? 'Creando...' : 'Crear Partidos'}
                </Button>
                {seedingStatus && (
                  <p className={`text-sm ${seedingStatus.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {seedingStatus}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recalcular Rankings */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="size-5" />
                  Recalcular Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-slate-600">
                  Recalcula puntos de todos los usuarios incluyendo bonus por equipos que avanzan (+{SCORING.TEAM_ADVANCED} pts c/u).
                </p>
                <Button 
                  onClick={handleRecalculateRankings}
                  disabled={isRecalculating}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                >
                  {isRecalculating ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                  {isRecalculating ? 'Calculando...' : 'Recalcular'}
                </Button>
                {recalculateProgress && (
                  <p className="text-sm text-[#1E3A5F]">{recalculateProgress}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info de puntuación */}
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#D4A824]/10 py-4">
              <CardTitle className="flex items-center gap-2 text-base text-[#D4A824]">
                <Trophy className="size-5" />
                Sistema de Puntuación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-3xl font-bold text-emerald-600">+{SCORING.EXACT_MATCH}</div>
                  <div className="text-sm text-slate-600">Marcador Exacto</div>
                </div>
                <div className="text-center p-4 bg-[#1E3A5F]/10 rounded-xl">
                  <div className="text-3xl font-bold text-[#1E3A5F]">+{SCORING.CORRECT_WINNER}</div>
                  <div className="text-sm text-slate-600">Ganador Correcto</div>
                </div>
                <div className="text-center p-4 bg-[#D4A824]/10 rounded-xl">
                  <div className="text-3xl font-bold text-[#D4A824]">+{SCORING.TEAM_ADVANCED}</div>
                  <div className="text-sm text-slate-600">Equipo que Avanza</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona de peligro */}
          <Card className="border-2 border-red-200 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-red-50 py-4">
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertTriangle className="size-5" />
                Zona de Peligro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Acciones irreversibles. Usar con precaución.
              </p>
              <Button 
                variant="outline"
                disabled
                className="border-red-300 text-red-500 rounded-xl"
              >
                <Trash2 className="size-4 mr-2" />
                Eliminar Todos los Partidos (Próximamente)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog confirmar eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Eliminar polla?</DialogTitle>
            <DialogDescription>
              Vas a eliminar la polla de <strong>{userToDelete?.userName}</strong>. 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleDeletePolla}
              disabled={deletingUser !== null}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              {deletingUser ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}