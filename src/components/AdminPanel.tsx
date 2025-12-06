import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, writeBatch, query, orderBy, deleteDoc 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { groupFixtures } from '../utils/mockData';
import { Match } from '../utils/types';
import { useAdmin } from '../hooks/useAdmin';
import { 
  Shield, Database, Trophy, Users, RefreshCw, Save, 
  CheckCircle, AlertTriangle, Loader2, ClipboardList, Settings,
  Trash2, Search, Filter
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

interface MatchWithScore extends Match {
  status?: string;
}

interface UserPolla {
  docId: string;
  userName: string;
  email: string;
  submittedAt: string;
  totalPoints: number;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('matches');
  
  // Estados para partidos
  const [allMatches, setAllMatches] = useState<MatchWithScore[]>([]);
  const [editedScores, setEditedScores] = useState<{ [matchId: string]: { score1: string; score2: string } }>({});
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Estados para usuarios
  const [users, setUsers] = useState<UserPolla[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserPolla | null>(null);
  
  // Estados para herramientas
  const [seedingStatus, setSeedingStatus] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
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
          totalPoints: data.totalPoints || 0
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
          const userPredictions = pollaDoc.data().groupPredictions || {};
          const userPred = userPredictions[matchId];
          
          if (userPred) {
            const isExact = userPred.score1 === score1 && userPred.score2 === score2;
            const predResult = userPred.score1 > userPred.score2 ? 1 : userPred.score1 < userPred.score2 ? -1 : 0;
            const actualResult = score1 > score2 ? 1 : score1 < score2 ? -1 : 0;
            const isCorrectWinner = !isExact && predResult === actualResult;
            
            if (isExact) {
              await createNotification(userId, 'exact_match', '¡Marcador Exacto! +5 pts',
                `Acertaste ${matchData.team1} ${score1} - ${score2} ${matchData.team2}`, { matchId });
            } else if (isCorrectWinner) {
              await createNotification(userId, 'match_result', '¡Ganador Correcto! +3 pts',
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
    try {
      // Obtener todos los resultados reales
      const matchesSnap = await getDocs(collection(db, 'partidos'));
      const realResults: { [id: string]: { score1: number; score2: number } } = {};
      
      matchesSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.score1 !== null && data.score1 !== undefined) {
          realResults[docSnap.id] = { score1: data.score1, score2: data.score2 };
        }
      });

      // Recalcular puntos de cada usuario
      const pollasSnap = await getDocs(collection(db, 'polla_completa'));
      const batch = writeBatch(db);
      
      for (const pollaDoc of pollasSnap.docs) {
        const data = pollaDoc.data();
        const predictions = data.groupPredictions || {};
        let totalPoints = 0;
        let exactMatches = 0;
        let correctWinners = 0;

        for (const [matchId, result] of Object.entries(realResults)) {
          const pred = predictions[matchId];
          if (pred) {
            const isExact = pred.score1 === result.score1 && pred.score2 === result.score2;
            if (isExact) {
              totalPoints += 5;
              exactMatches++;
            } else {
              const predResult = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? -1 : 0;
              const actualResult = result.score1 > result.score2 ? 1 : result.score1 < result.score2 ? -1 : 0;
              if (predResult === actualResult) {
                totalPoints += 3;
                correctWinners++;
              }
            }
          }
        }

        batch.update(doc(db, 'polla_completa', pollaDoc.id), {
          totalPoints,
          exactMatches,
          correctWinners
        });
      }

      await batch.commit();
      await fetchData();
      alert('Rankings recalculados correctamente');
      
    } catch (error) {
      console.error('Error recalculando:', error);
      alert('Error al recalcular');
    } finally {
      setIsRecalculating(false);
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

  // Filtrar partidos por grupo
  const groups = [...new Set(allMatches.map(m => m.group))].sort();
  const filteredMatches = selectedGroup === 'all' 
    ? allMatches 
    : allMatches.filter(m => m.group === selectedGroup);

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Ingresar Resultados</CardTitle>
                
                {/* Filtro por grupo */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="size-4 text-slate-400" />
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedGroup === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedGroup('all')}
                      className={`h-8 px-3 rounded-lg text-xs ${selectedGroup === 'all' ? 'bg-[#1E3A5F]' : ''}`}
                    >
                      Todos
                    </Button>
                    {groups.map(g => (
                      <Button
                        key={g}
                        size="sm"
                        variant={selectedGroup === g ? 'default' : 'outline'}
                        onClick={() => setSelectedGroup(g)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs ${selectedGroup === g ? 'bg-[#1E3A5F]' : ''}`}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredMatches.map((match) => {
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
                        <span className="text-sm font-medium text-right truncate flex-1 max-w-[120px]">
                          {match.team1}
                        </span>
                        
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          className="w-12 h-9 text-center font-bold rounded-lg border-2 text-sm"
                          value={currentScore1}
                          placeholder="-"
                          onChange={(e) => setEditedScores(prev => ({
                            ...prev,
                            [match.id]: { 
                              score1: e.target.value, 
                              score2: prev[match.id]?.score2 ?? match.score2?.toString() ?? '' 
                            }
                          }))}
                        />
                        
                        <span className="text-slate-300 text-xs">-</span>
                        
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          className="w-12 h-9 text-center font-bold rounded-lg border-2 text-sm"
                          value={currentScore2}
                          placeholder="-"
                          onChange={(e) => setEditedScores(prev => ({
                            ...prev,
                            [match.id]: { 
                              score1: prev[match.id]?.score1 ?? match.score1?.toString() ?? '', 
                              score2: e.target.value 
                            }
                          }))}
                        />
                        
                        <span className="text-sm font-medium text-left truncate flex-1 max-w-[120px]">
                          {match.team2}
                        </span>
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
                })}
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
                      
                      {/* Puntos */}
                      <div className="text-right">
                        <p className="font-bold text-[#1E3A5F]">{user.totalPoints} pts</p>
                        <p className="text-xs text-slate-400">{user.submittedAt}</p>
                      </div>
                      
                      {/* Acciones */}
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
                  Recalcula los puntos de todos los usuarios basándose en los resultados actuales.
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
              </CardContent>
            </Card>
          </div>

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