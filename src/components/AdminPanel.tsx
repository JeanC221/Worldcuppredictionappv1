import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, writeBatch, query, orderBy, deleteDoc, serverTimestamp, Timestamp, setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { groupFixtures } from '../utils/mockData';
import { Match, PhaseScore } from '../utils/types';
import { useAdmin } from '../hooks/useAdmin';
import { 
  Loader2, Trash2, Search, Download, Check, X, 
  ChevronDown, ChevronUp, RefreshCw, Database, Users, Trophy
} from 'lucide-react';
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

interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentMethod: 'nequi' | 'daviplata' | 'bancolombia';
  referenceNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const TABS = [
  { id: 'matches', label: 'Resultados' },
  { id: 'users', label: 'Usuarios' },
  { id: 'payments', label: 'Pagos' },
  { id: 'tools', label: 'Herramientas' },
];

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
  
  // Estados para pagos
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalMatches: 0,
    playedMatches: 0,
    totalUsers: 0,
    pendingPayments: 0
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
      const matchesSnap = await getDocs(query(collection(db, 'partidos'), orderBy('group'), orderBy('date')));
      const matchesList: MatchWithScore[] = [];
      let played = 0;
      
      matchesSnap.forEach((docSnap) => {
        const data = docSnap.data() as MatchWithScore;
        const match = { ...data, id: docSnap.id };
        matchesList.push(match);
        if (match.score1 !== null && match.score1 !== undefined) played++;
      });
      
      setAllMatches(matchesList);
      
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
      
      const paymentsSnap = await getDocs(query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc')));
      const paymentsList: PaymentRequest[] = [];

      paymentsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        paymentsList.push({
          id: docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName || 'Sin nombre',
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      setPaymentRequests(paymentsList);

      setStats({
        totalMatches: matchesSnap.size,
        playedMatches: played,
        totalUsers: usersSnap.size,
        pendingPayments: paymentsList.filter(p => p.status === 'pending').length
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

      if (score1 !== undefined && score2 !== undefined && matchData) {
        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        const allUserIds: string[] = [];
        
        for (const pollaDoc of pollasSnap.docs) {
          const userId = pollaDoc.data().userId;
          allUserIds.push(userId);
          
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
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
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
    if (!window.confirm(`¿Crear ${groupFixtures.reduce((acc, g) => acc + g.matches.length, 0)} partidos?`)) return;
    
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
      setSeedingStatus(`✓ ${count} partidos creados`);
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
      const matchesSnap = await getDocs(collection(db, 'partidos'));
      const allMatchesData: Match[] = matchesSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Match[];
      
      const groupMatches = allMatchesData.filter(m => !m.phase || m.phase === 'groups');
      
      const matchesByGroup: { [group: string]: Match[] } = {};
      for (const match of groupMatches) {
        if (!matchesByGroup[match.group]) matchesByGroup[match.group] = [];
        matchesByGroup[match.group].push(match);
      }
      
      const realPredictions: { [matchId: string]: { score1: number; score2: number } } = {};
      for (const match of groupMatches) {
        if (match.score1 !== undefined && match.score1 !== null && 
            match.score2 !== undefined && match.score2 !== null) {
          realPredictions[match.id] = { score1: match.score1, score2: match.score2 };
        }
      }
      
      const actualTeamsAdvancing = getTeamsAdvancingFromGroups(realPredictions, matchesByGroup);
      
      setRecalculateProgress('Recalculando usuarios...');
      
      const pollasSnap = await getDocs(collection(db, 'polla_completa'));
      const batch = writeBatch(db);
      let processedCount = 0;
      
      for (const pollaDoc of pollasSnap.docs) {
        const data = pollaDoc.data();
        
        if (data.phases) {
          const phaseScores: { [key in TournamentPhase]?: PhaseScore } = {};
          
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
          
          const totals = calculateTotalScore(phaseScores);
          
          batch.update(doc(db, 'polla_completa', pollaDoc.id), {
            scores: phaseScores,
            totalPoints: totals.totalPoints,
            totalExactMatches: totals.totalExactMatches,
            totalCorrectWinners: totals.totalCorrectWinners,
            totalTeamsBonus: totals.totalTeamsBonus
          });
          
        } else {
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
        setRecalculateProgress(`${processedCount}/${pollasSnap.size} usuarios...`);
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
      
      const pdfData = {
        userName: user.userName,
        email: user.email,
        submittedAt: user.submittedAt,
        totalPoints: user.totalPoints,
        exactMatches: pollaData.totalExactMatches || pollaData.exactMatches || 0,
        correctWinners: pollaData.totalCorrectWinners || pollaData.correctWinners || 0,
        teamsBonus: pollaData.totalTeamsBonus || 0,
        groupPredictions: pollaData.phases?.groups?.matchPredictions || pollaData.groupPredictions || {},
        teamsAdvancing: pollaData.phases?.groups?.teamsAdvancing || [],
        knockoutPredictions: pollaData.knockoutPredictions || {},
        knockoutPicks: pollaData.knockoutPicks || {}
      };

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

  const handleApprovePayment = async (request: PaymentRequest) => {
    setProcessingPayment(request.id);
  
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);
      
      await setDoc(doc(db, 'subscriptions', request.userId), {
        userId: request.userId,
        status: 'active',
        paymentMethod: request.paymentMethod,
        transactionId: request.referenceNumber,
        amount: request.amount,
        currency: 'cop',
        paidAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      await updateDoc(doc(db, 'paymentRequests', request.id), {
        status: 'approved',
        processedAt: serverTimestamp(),
      });
      
      setPaymentRequests(prev => prev.map(p => 
        p.id === request.id ? { ...p, status: 'approved' as const } : p
      ));
      
      setStats(prev => ({ ...prev, pendingPayments: prev.pendingPayments - 1 }));
      
    } catch (error) {
      console.error('Error aprobando pago:', error);
      alert('Error al aprobar el pago');
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleRejectPayment = async (request: PaymentRequest) => {
    setProcessingPayment(request.id);
  
    try {
      await updateDoc(doc(db, 'paymentRequests', request.id), {
        status: 'rejected',
        processedAt: serverTimestamp(),
      });
      
      setPaymentRequests(prev => prev.map(p => 
        p.id === request.id ? { ...p, status: 'rejected' as const } : p
      ));
      
      setStats(prev => ({ ...prev, pendingPayments: prev.pendingPayments - 1 }));
      
    } catch (error) {
      console.error('Error rechazando pago:', error);
      alert('Error al rechazar el pago');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Loading
  if (adminLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  // No admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="size-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Acceso Denegado</h1>
        <p className="text-[#666] mb-6">No tienes permisos de administrador.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 border border-[#e0e0e0] text-[#1a1a1a] font-medium rounded-xl hover:bg-[#f5f5f5] transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const filteredMatches = allMatches.filter(m => m.group === selectedGroup);
  const filteredUsers = users.filter(u => 
    u.userName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Administración</h1>
        <p className="text-[#666]">Gestiona partidos, usuarios y pagos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Partidos</p>
          <p className="text-2xl font-bold text-[#1a1a1a]">{stats.playedMatches}/{stats.totalMatches}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Usuarios</p>
          <p className="text-2xl font-bold text-[#1a1a1a]">{stats.totalUsers}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Pagos pendientes</p>
          <p className="text-2xl font-bold text-[#E85D24]">{stats.pendingPayments}</p>
        </div>
        <div className="bg-white border border-[#eee] rounded-xl p-4">
          <p className="text-sm text-[#999] mb-1">Progreso</p>
          <p className="text-2xl font-bold text-green-600">
            {Math.round((stats.playedMatches / stats.totalMatches) * 100) || 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-white border border-[#eee] text-[#666] hover:bg-[#f5f5f5]'
            }`}
          >
            {tab.label}
            {tab.id === 'payments' && stats.pendingPayments > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.pendingPayments}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Resultados */}
      {activeTab === 'matches' && (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          {/* Selector de grupos */}
          <div className="p-4 border-b border-[#eee]">
            <p className="text-sm text-[#999] mb-3">Selecciona un grupo</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {GROUPS.map(group => {
                const groupMatches = allMatches.filter(m => m.group === group);
                const playedInGroup = groupMatches.filter(m => m.score1 !== null && m.score1 !== undefined).length;
                const isComplete = playedInGroup === groupMatches.length && groupMatches.length > 0;
                
                return (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center font-bold transition-colors ${
                      selectedGroup === group
                        ? 'bg-[#1a1a1a] text-white'
                        : isComplete
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
                    }`}
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

          {/* Lista de partidos */}
          <div className="divide-y divide-[#eee] max-h-[500px] overflow-y-auto">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center text-[#999]">
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
                    className={`flex items-center gap-3 px-4 py-3 ${hasResult ? 'bg-green-50' : ''}`}
                  >
                    {/* Equipos */}
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium text-[#1a1a1a] truncate">{match.team1}</span>
                    </div>
                    
                    {/* Inputs */}
                    <div className="flex items-center gap-1">
                      <input
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
                        className="w-10 h-9 text-center font-mono font-bold border border-[#ddd] rounded-lg focus:outline-none focus:border-[#1a1a1a]"
                        placeholder="-"
                      />
                      <span className="text-[#999]">:</span>
                      <input
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
                        className="w-10 h-9 text-center font-mono font-bold border border-[#ddd] rounded-lg focus:outline-none focus:border-[#1a1a1a]"
                        placeholder="-"
                      />
                    </div>
                    
                    {/* Equipo 2 */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1a1a1a] truncate">{match.team2}</span>
                    </div>
                    
                    {/* Guardar */}
                    <button
                      disabled={!isEditing || savingMatch === match.id}
                      onClick={() => handleSaveScore(match.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isEditing 
                          ? 'bg-[#1a1a1a] text-white hover:bg-[#333]' 
                          : 'bg-[#eee] text-[#ccc] cursor-not-allowed'
                      }`}
                    >
                      {savingMatch === match.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </button>
                    
                    {hasResult && <Check className="size-4 text-green-500" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Usuarios */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#eee] flex flex-col sm:flex-row gap-4 justify-between">
            <p className="text-sm text-[#666]">{users.length} usuarios con predicción</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#999]" />
              <input
                type="text"
                placeholder="Buscar..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="divide-y divide-[#eee] max-h-[500px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-[#999]">No se encontraron usuarios</div>
            ) : (
              filteredUsers.map((user, index) => (
                <div key={user.docId} className="flex items-center gap-4 px-4 py-3 hover:bg-[#fafafa]">
                  {/* Posición */}
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-[#f5f5f5] text-[#666]'
                  }`}>
                    {index + 1}
                  </span>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1a1a1a] truncate">{user.userName}</p>
                    <p className="text-xs text-[#999] truncate">{user.email}</p>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-[#E85D24]">{user.totalPoints} pts</p>
                    <p className="text-xs text-[#999]">
                      {user.exactMatches}E · {user.correctWinners}G
                    </p>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadPolla(user)}
                      disabled={downloadingUser === user.docId}
                      className="w-8 h-8 rounded-lg border border-[#eee] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                    >
                      {downloadingUser === user.docId ? (
                        <Loader2 className="size-4 animate-spin text-[#999]" />
                      ) : (
                        <Download className="size-4 text-[#666]" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteDialog(true);
                      }}
                      className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Pagos */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#eee]">
            <p className="text-sm text-[#666]">
              {paymentRequests.filter(p => p.status === 'pending').length} pagos pendientes
            </p>
          </div>

          <div className="divide-y divide-[#eee] max-h-[500px] overflow-y-auto">
            {paymentRequests.length === 0 ? (
              <div className="p-8 text-center text-[#999]">No hay solicitudes de pago</div>
            ) : (
              paymentRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`flex items-center gap-4 px-4 py-4 ${
                    request.status === 'approved' ? 'bg-green-50' :
                    request.status === 'rejected' ? 'bg-red-50' : ''
                  }`}
                >
                  {/* Estado */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    request.status === 'pending' ? 'bg-yellow-100' :
                    request.status === 'approved' ? 'bg-green-100' :
                    'bg-red-100'
                  }`}>
                    {request.status === 'pending' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                    {request.status === 'approved' && <Check className="size-5 text-green-600" />}
                    {request.status === 'rejected' && <X className="size-5 text-red-500" />}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1a1a1a]">{request.userName}</p>
                    <p className="text-xs text-[#999]">{request.userEmail}</p>
                  </div>
                  
                  {/* Método */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.paymentMethod === 'nequi' ? 'bg-pink-100 text-pink-700' :
                    request.paymentMethod === 'daviplata' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {request.paymentMethod}
                  </span>
                  
                  {/* Referencia y monto */}
                  <div className="text-right hidden sm:block">
                    <p className="font-mono text-sm text-[#1a1a1a]">{request.referenceNumber}</p>
                    <p className="text-xs text-[#999]">
                      {new Intl.NumberFormat('es-CO', { 
                        style: 'currency', 
                        currency: 'COP', 
                        minimumFractionDigits: 0 
                      }).format(request.amount)}
                    </p>
                  </div>
                  
                  {/* Acciones */}
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovePayment(request)}
                        disabled={processingPayment === request.id}
                        className="w-9 h-9 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                      >
                        {processingPayment === request.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectPayment(request)}
                        disabled={processingPayment === request.id}
                        className="w-9 h-9 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-sm font-medium ${
                      request.status === 'approved' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Herramientas */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          {/* Crear partidos */}
          <div className="bg-white border border-[#eee] rounded-xl p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-2">Inicializar Partidos</h3>
            <p className="text-sm text-[#666] mb-4">
              Crea los 72 partidos de fase de grupos del Mundial 2026.
            </p>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="px-4 py-2 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#333] disabled:bg-[#ccc] transition-colors flex items-center gap-2"
            >
              {isSeeding ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
              {isSeeding ? 'Creando...' : 'Crear Partidos'}
            </button>
            {seedingStatus && (
              <p className={`mt-3 text-sm ${seedingStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {seedingStatus}
              </p>
            )}
          </div>

          {/* Recalcular */}
          <div className="bg-white border border-[#eee] rounded-xl p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-2">Recalcular Rankings</h3>
            <p className="text-sm text-[#666] mb-4">
              Recalcula puntos de todos los usuarios basado en resultados actuales.
            </p>
            <button
              onClick={handleRecalculateRankings}
              disabled={isRecalculating}
              className="px-4 py-2 border border-[#1a1a1a] text-[#1a1a1a] font-medium rounded-lg hover:bg-[#f5f5f5] disabled:border-[#ccc] disabled:text-[#ccc] transition-colors flex items-center gap-2"
            >
              {isRecalculating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {isRecalculating ? 'Calculando...' : 'Recalcular'}
            </button>
            {recalculateProgress && (
              <p className="mt-3 text-sm text-[#666]">{recalculateProgress}</p>
            )}
          </div>

          {/* Sistema de puntos */}
          <div className="bg-[#f9f9f9] rounded-xl p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Sistema de Puntuación</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">+{SCORING.EXACT_MATCH}</p>
                <p className="text-xs text-[#666]">Marcador exacto</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">+{SCORING.CORRECT_WINNER}</p>
                <p className="text-xs text-[#666]">Ganador correcto</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-2xl font-bold text-[#E85D24]">+{SCORING.TEAM_ADVANCED}</p>
                <p className="text-xs text-[#666]">Equipo avanza</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar usuario */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">¿Eliminar polla?</h3>
            <p className="text-sm text-[#666] mb-6">
              Vas a eliminar la polla de <strong>{userToDelete?.userName}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 py-2 border border-[#e0e0e0] text-[#666] font-medium rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePolla}
                disabled={deletingUser !== null}
                className="flex-1 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:bg-red-300 transition-colors flex items-center justify-center gap-2"
              >
                {deletingUser ? <Loader2 className="size-4 animate-spin" /> : null}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}