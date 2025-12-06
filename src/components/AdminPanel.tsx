import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, writeBatch, query, orderBy 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { groupFixtures } from '../utils/mockData';
import { Match } from '../utils/types';
import { useAdmin } from '../hooks/useAdmin';
import { 
  Shield, Database, Trophy, Users, RefreshCw, Save, 
  CheckCircle, AlertTriangle, Loader2, ClipboardList, Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { broadcastNotification, createNotification } from '../hooks/useNotifications';

interface MatchWithScore extends Match {
  status?: string;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('matches');
  
  // Estados para partidos
  const [matches, setMatches] = useState<{ [group: string]: MatchWithScore[] }>({});
  const [editedScores, setEditedScores] = useState<{ [matchId: string]: { score1: string; score2: string } }>({});
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Estados para herramientas
  const [seedingStatus, setSeedingStatus] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  
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
      const matchesSnap = await getDocs(query(collection(db, 'partidos'), orderBy('group'), orderBy('date')));
      const groupedMatches: { [group: string]: MatchWithScore[] } = {};
      let played = 0;
      
      matchesSnap.forEach((doc) => {
        const data = doc.data() as MatchWithScore;
        const match = { ...data, id: doc.id };
        
        if (!groupedMatches[match.group]) {
          groupedMatches[match.group] = [];
        }
        groupedMatches[match.group].push(match);
        
        if (match.score1 !== null && match.score1 !== undefined) {
          played++;
        }
      });
      
      setMatches(groupedMatches);
      
      const usersSnap = await getDocs(collection(db, 'polla_completa'));
      
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

  const handleSaveScore = async (matchId: string, group: string) => {
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
      const matchData = matches[group]?.find(m => m.id === matchId);
      
      await updateDoc(doc(db, 'partidos', matchId), {
        score1: score1 ?? null,
        score2: score2 ?? null,
        status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED'
      });
      
      setMatches(prev => {
        const updatedGroup = prev[group].map(m => 
          m.id === matchId 
            ? { ...m, score1, score2, status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED' } as MatchWithScore
            : m
        );
        return { ...prev, [group]: updatedGroup };
      });
      
      setEditedScores(prev => {
        const newState = { ...prev };
        delete newState[matchId];
        return newState;
      });

      if (score1 !== undefined && score2 !== undefined && matchData) {
        const pollasSnap = await getDocs(collection(db, 'polla_completa'));
        
        for (const pollaDoc of pollasSnap.docs) {
          const userId = pollaDoc.data().userId;
          const userPredictions = pollaDoc.data().groupPredictions || {};
          const userPred = userPredictions[matchId];
          
          if (userPred) {
            const isExact = userPred.score1 === score1 && userPred.score2 === score2;
            const predResult = userPred.score1 > userPred.score2 ? 1 : userPred.score1 < userPred.score2 ? -1 : 0;
            const actualResult = score1 > score2 ? 1 : score1 < score2 ? -1 : 0;
            const isCorrectWinner = !isExact && predResult === actualResult;
            
            if (isExact) {
              await createNotification(
                userId,
                'exact_match',
                '¡Marcador Exacto! +5 pts',
                `Acertaste ${matchData.team1} ${score1} - ${score2} ${matchData.team2}`,
                { matchId }
              );
            } else if (isCorrectWinner) {
              await createNotification(
                userId,
                'match_result',
                '¡Ganador Correcto! +3 pts',
                `Acertaste el ganador de ${matchData.team1} vs ${matchData.team2}`,
                { matchId }
              );
            }
          }
        }
        
        const allUserIds = pollasSnap.docs.map(d => d.data().userId);
        await broadcastNotification(
          allUserIds,
          'match_result',
          'Resultado Actualizado',
          `${matchData.team1} ${score1} - ${score2} ${matchData.team2}`,
          { matchId }
        );
      }
      
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setSavingMatch(null);
    }
  };

  const handleSeedDatabase = async () => {
    const confirm = window.confirm(
      `¿Estás seguro? Esto creará ${groupFixtures.reduce((acc, g) => acc + g.matches.length, 0)} partidos en Firebase.\n\nLos partidos existentes con el mismo ID serán sobrescritos.`
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
      setSeedingStatus(`${count} partidos creados exitosamente`);
      await fetchData();
      
    } catch (error: any) {
      setSeedingStatus(`Error: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  if (adminLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
        <p className="text-slate-600 mb-6">No tienes permisos para acceder al panel de administración.</p>
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="outline"
          className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white"
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const groups = Object.keys(matches).sort();

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#E85D24] to-[#C44D1A] rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500">Gestiona partidos, resultados y configuración</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Partidos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalMatches}</p>
              </div>
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                <Trophy className="size-6 text-[#1E3A5F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Partidos Jugados</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.playedMatches}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="size-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Usuarios</p>
                <p className="text-3xl font-bold text-[#1E3A5F]">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-[#1E3A5F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Predicciones</p>
                <p className="text-3xl font-bold text-[#D4A824]">{stats.totalPredictions}</p>
              </div>
              <div className="w-12 h-12 bg-[#D4A824]/10 rounded-xl flex items-center justify-center">
                <Database className="size-6 text-[#D4A824]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Rediseñadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100 p-1.5 rounded-2xl h-auto">
          <TabsTrigger 
            value="matches" 
            className="px-6 py-3 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <ClipboardList className="size-4 mr-2" />
            Resultados
          </TabsTrigger>
          <TabsTrigger 
            value="tools"
            className="px-6 py-3 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Settings className="size-4 mr-2" />
            Herramientas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resultados */}
        <TabsContent value="matches">
          <Alert className="mb-6 border-[#1E3A5F]/20 bg-[#1E3A5F]/5 rounded-xl">
            <AlertTriangle className="size-4 text-[#1E3A5F]" />
            <AlertDescription className="text-[#1E3A5F]">
              Ingresa los resultados de cada partido. Los puntos de todos los usuarios se recalculan automáticamente.
            </AlertDescription>
          </Alert>

          <Accordion type="multiple" defaultValue={[]} className="space-y-3">
            {groups.map((group) => (
              <AccordionItem 
                key={group} 
                value={group}
                className="border border-slate-200 rounded-2xl bg-white px-4 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">{group}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-900 font-semibold">Grupo {group}</span>
                      <span className="text-xs text-slate-500 block">
                        {matches[group]?.filter(m => m.score1 !== null && m.score1 !== undefined).length || 0} / {matches[group]?.length || 0} jugados
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-3">
                    {matches[group]?.map((match) => {
                      const isEditing = editedScores[match.id] !== undefined;
                      const currentScore1 = isEditing ? editedScores[match.id].score1 : (match.score1?.toString() ?? '');
                      const currentScore2 = isEditing ? editedScores[match.id].score2 : (match.score2?.toString() ?? '');
                      const hasResult = match.score1 !== null && match.score1 !== undefined;
                      
                      return (
                        <div 
                          key={match.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                            hasResult 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="text-xs text-slate-400 font-mono w-14">
                            {match.id}
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center gap-3">
                            <span className="text-sm font-medium text-right w-28 truncate">{match.team1}</span>
                            
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-14 h-10 text-center font-bold rounded-xl border-2 border-slate-200 focus:border-[#1E3A5F]"
                              value={currentScore1}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: e.target.value, 
                                  score2: prev[match.id]?.score2 ?? match.score2?.toString() ?? '' 
                                }
                              }))}
                            />
                            
                            <span className="text-slate-400 font-bold">vs</span>
                            
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-14 h-10 text-center font-bold rounded-xl border-2 border-slate-200 focus:border-[#1E3A5F]"
                              value={currentScore2}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: prev[match.id]?.score1 ?? match.score1?.toString() ?? '', 
                                  score2: e.target.value 
                                }
                              }))}
                            />
                            
                            <span className="text-sm font-medium text-left w-28 truncate">{match.team2}</span>
                          </div>
                          
                          <Button
                            size="sm"
                            disabled={!isEditing || savingMatch === match.id}
                            onClick={() => handleSaveScore(match.id, group)}
                            className={`rounded-xl px-4 ${
                              isEditing 
                                ? 'bg-[#E85D24] hover:bg-[#C44D1A] text-white' 
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {savingMatch === match.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Save className="size-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Tab: Herramientas */}
        <TabsContent value="tools" className="space-y-6">
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] text-white">
              <CardTitle className="flex items-center gap-3">
                <Database className="size-5" />
                Inicializar Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-slate-600">
                Crea todos los partidos del Mundial 2026 en Firebase. 
                Esto incluye <strong>12 grupos</strong> con <strong>6 partidos cada uno</strong> (72 partidos totales).
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Los partidos existentes con el mismo ID serán sobrescritos. Los resultados ya ingresados se perderán.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="bg-[#E85D24] hover:bg-[#C44D1A] text-white rounded-xl px-6"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Database className="size-4 mr-2" />
                    Inicializar Partidos
                  </>
                )}
              </Button>
              {seedingStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${
                  seedingStatus.includes('Error') 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {seedingStatus.includes('Error') ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  <span className="text-sm font-medium">{seedingStatus}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <RefreshCw className="size-5" />
                Recalcular Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-slate-600">
                Recalcula los puntos de todos los usuarios basándose en los resultados actuales.
                Esto es útil si hubo algún error en el cálculo automático.
              </p>
              <Button 
                variant="outline" 
                disabled
                className="border-2 border-slate-300 text-slate-400 rounded-xl"
              >
                <RefreshCw className="size-4 mr-2" />
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}