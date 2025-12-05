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
  CheckCircle, AlertTriangle, Loader2
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

  // Cargar datos cuando confirmamos que es admin
  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchData();
    } else if (!adminLoading) {
      setDataLoading(false);
    }
  }, [isAdmin, adminLoading]);

  // Cargar datos
  const fetchData = async () => {
    try {
      // Cargar partidos
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
      
      // Cargar stats de usuarios
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

  // Guardar resultado de un partido
  const handleSaveScore = async (matchId: string, group: string) => {
    const scores = editedScores[matchId];
    if (!scores) return;
    
    const score1 = scores.score1 === '' ? undefined : parseInt(scores.score1);
    const score2 = scores.score2 === '' ? undefined : parseInt(scores.score2);
    
    // Validación
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
      await updateDoc(doc(db, 'partidos', matchId), {
        score1: score1 ?? null,
        score2: score2 ?? null,
        status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED'
      });
      
      // Actualizar estado local
      setMatches(prev => {
        const updatedGroup = prev[group].map(m => 
          m.id === matchId 
            ? { ...m, score1, score2, status: score1 !== undefined ? 'FINISHED' : 'SCHEDULED' } as MatchWithScore
            : m
        );
        return { ...prev, [group]: updatedGroup };
      });
      
      // Limpiar edición
      setEditedScores(prev => {
        const newState = { ...prev };
        delete newState[matchId];
        return newState;
      });
      
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setSavingMatch(null);
    }
  };

  // Inicializar base de datos
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
      setSeedingStatus(`✅ ¡Éxito! ${count} partidos creados.`); // 👈 Corregido
      
      // Recargar datos
      await fetchData();
      
    } catch (error: any) {
      setSeedingStatus(`❌ Error: ${error.message}`); // 👈 Corregido
    } finally {
      setIsSeeding(false);
    }
  };

  // Loading
  if (adminLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Si no es admin
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Shield className="size-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">No tienes permisos para acceder al panel de administración.</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
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
        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
          <Shield className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona partidos, resultados y configuración</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Partidos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMatches}</p>
              </div>
              <Trophy className="size-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Partidos Jugados</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.playedMatches}</p>
              </div>
              <CheckCircle className="size-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Predicciones</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalPredictions}</p>
              </div>
              <Database className="size-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="matches">📋 Resultados</TabsTrigger>
          <TabsTrigger value="tools">🛠️ Herramientas</TabsTrigger>
        </TabsList>

        {/* Tab: Resultados */}
        <TabsContent value="matches">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertTriangle className="size-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Ingresa los resultados de cada partido. Los puntos de todos los usuarios se recalculan automáticamente.
            </AlertDescription>
          </Alert>

          <Accordion type="multiple" defaultValue={['A']} className="space-y-3">
            {groups.map((group) => (
              <AccordionItem 
                key={group} 
                value={group}
                className="border border-gray-200 rounded-xl bg-white px-4 shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{group}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-gray-900 font-semibold">Grupo {group}</span>
                      <span className="text-xs text-gray-500 block">
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
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            hasResult ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="text-xs text-gray-500 w-16">
                            {match.id}
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center gap-2">
                            <span className="text-sm text-right w-28 truncate">{match.team1}</span>
                            
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-14 h-9 text-center"
                              value={currentScore1}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: e.target.value, 
                                  score2: prev[match.id]?.score2 ?? match.score2?.toString() ?? '' 
                                }
                              }))}
                            />
                            
                            <span className="text-gray-400">-</span>
                            
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="w-14 h-9 text-center"
                              value={currentScore2}
                              onChange={(e) => setEditedScores(prev => ({
                                ...prev,
                                [match.id]: { 
                                  score1: prev[match.id]?.score1 ?? match.score1?.toString() ?? '', 
                                  score2: e.target.value 
                                }
                              }))}
                            />
                            
                            <span className="text-sm text-left w-28 truncate">{match.team2}</span>
                          </div>
                          
                          <Button
                            size="sm"
                            disabled={!isEditing || savingMatch === match.id}
                            onClick={() => handleSaveScore(match.id, group)}
                            className={isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
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
          {/* Inicializar DB */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5 text-orange-500" />
                Inicializar Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Crea todos los partidos del Mundial 2026 en Firebase. 
                Esto incluye <strong>12 grupos</strong> con <strong>6 partidos cada uno</strong> (72 partidos totales).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Los partidos existentes con el mismo ID serán sobrescritos. Los resultados ya ingresados se perderán.
                </p>
              </div>
              <Button 
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="bg-orange-600 hover:bg-orange-700"
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
                <p className={`text-sm font-medium ${
                  seedingStatus.includes('✅') ? 'text-emerald-600' : 
                  seedingStatus.includes('❌') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {seedingStatus}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recalcular Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="size-5 text-blue-500" />
                Recalcular Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Recalcula los puntos de todos los usuarios basándose en los resultados actuales.
                Esto es útil si hubo algún error en el cálculo automático.
              </p>
              <Button variant="outline" disabled>
                <RefreshCw className="size-4 mr-2" />
                Recalcular (Próximamente)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}