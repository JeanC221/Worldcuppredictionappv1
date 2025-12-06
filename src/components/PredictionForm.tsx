import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Match } from '../utils/types';
import { calculateGroupStandings, generateRoundOf32, KnockoutPairing } from '../utils/bracketLogic';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from './ui/button';
import { AlertCircle, Trophy, CheckCircle, Loader2, Save, Lock, CalendarX, Users, Target } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Link } from 'react-router-dom';
import { broadcastNotification } from '../hooks/useNotifications';

const DEADLINE = new Date('2026-06-10T23:59:59');

export function PredictionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  
  // Datos
  const [predictions, setPredictions] = useState<{ [key: string]: Match[] }>({});
  const [groupsList, setGroupsList] = useState<string[]>([]);
  const [knockoutPicks, setKnockoutPicks] = useState<{ [matchId: string]: string }>({});
  const [bracket, setBracket] = useState<KnockoutPairing[]>([]);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("groups");

  // Verificar si la fecha límite ya pasó
  useEffect(() => {
    const now = new Date();
    if (now > DEADLINE) {
      setDeadlinePassed(true);
    }
  }, []);

  // 1. Cargar datos y verificar si ya envió
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        if (auth.currentUser) {
          const pollaDoc = await getDoc(doc(db, 'polla_completa', auth.currentUser.uid));
          if (pollaDoc.exists() && pollaDoc.data().isLocked) {
            setAlreadySubmitted(true);
            setLoading(false);
            return;
          }
        }

        const q = query(collection(db, 'partidos'), orderBy('group'), orderBy('date'));
        const snap = await getDocs(q);
        const grouped: { [key: string]: Match[] } = {};
        const groupsFound = new Set<string>();
        
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const m: Match = { 
            id: docSnap.id, team1: d.team1, team2: d.team2, date: d.date, group: d.group,
            score1: undefined, score2: undefined
          };
          if (!grouped[m.group]) grouped[m.group] = [];
          grouped[m.group].push(m);
          groupsFound.add(m.group);
        });
        setPredictions(grouped);
        setGroupsList(Array.from(groupsFound).sort());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchMatches();
  }, []);

  // 2. Calcular Bracket Dinámico
  useEffect(() => {
    if (alreadySubmitted || deadlinePassed) return;
    
    const allStandings: any = {};
    groupsList.forEach(g => {
      allStandings[g] = calculateGroupStandings(predictions[g] || [], g);
    });

    const fullBracket = [...generateRoundOf32(allStandings)];
    const getWinner = (id: string) => knockoutPicks[id];

    const buildRound = (name: string, count: number, prev: string) => {
      for (let i = 1; i <= count; i++) {
        const f1 = `${prev}-${(i * 2) - 1}`;
        const f2 = `${prev}-${(i * 2)}`;
        fullBracket.push({
          id: `${name}-${i}`, round: name as any,
          team1: getWinner(f1) || 'Ganador ' + f1,
          team2: getWinner(f2) || 'Ganador ' + f2
        });
      }
    };
    buildRound('R16', 8, 'R32');
    buildRound('QF', 4, 'R16');
    buildRound('SF', 2, 'QF');
    buildRound('F', 1, 'SF');
    setBracket(fullBracket);
  }, [predictions, knockoutPicks, groupsList, alreadySubmitted, deadlinePassed]);

  const updateScore = (g: string, id: string, t: 'team1'|'team2', v: string) => {
    if (v === '') {
      setPredictions(p => ({
        ...p, [g]: p[g].map(m => m.id === id ? { ...m, [t === 'team1'?'score1':'score2']: undefined } : m)
      }));
      return;
    }
    const num = parseInt(v);
    if (isNaN(num) || num < 0 || num > 99) return;
    setPredictions(p => ({
      ...p, [g]: p[g].map(m => m.id === id ? { ...m, [t === 'team1'?'score1':'score2']: num } : m)
    }));
  };

  const pickWinner = (id: string, team: string) => {
    if (!team || team.includes('Ganador') || team.includes('TBD')) return;
    setKnockoutPicks(prev => ({ ...prev, [id]: team }));
  };

  const handleSubmit = async () => {
    if (new Date() > DEADLINE) {
      alert("Lo sentimos, el plazo para enviar predicciones ha terminado.");
      setDeadlinePassed(true);
      setShowConfirmDialog(false);
      return;
    }

    if (!auth.currentUser) { 
      alert("Debes iniciar sesión."); 
      return; 
    }
    if (!knockoutPicks['F-1']) { 
      alert("Elige un campeón."); 
      return; 
    }
    
    setSubmitting(true);
    
    try {
      const groupPredictions: { [matchId: string]: { score1: number; score2: number } } = {};
      
      for (const group of Object.keys(predictions)) {
        for (const match of predictions[group]) {
          if (match.score1 !== undefined && match.score2 !== undefined) {
            groupPredictions[match.id] = {
              score1: match.score1,
              score2: match.score2,
            };
          }
        }
      }

      await setDoc(doc(db, 'polla_completa', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || 'Anónimo',
        groupPredictions,
        knockoutPicks,
        isLocked: true,
        submittedAt: new Date(),
      });

      // Notificar a otros usuarios que hay un nuevo participante
      const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Alguien';
      const pollasSnap = await getDocs(collection(db, 'polla_completa'));
      const otherUserIds = pollasSnap.docs
        .map(d => d.data().userId)
        .filter(id => id !== auth.currentUser!.uid);
      
      if (otherUserIds.length > 0) {
        await broadcastNotification(
          otherUserIds,
          'new_participant',
          '¡Nuevo participante!',
          `${userName} acaba de enviar su predicción. ¡Ya son ${pollasSnap.size} participantes!`,
          { participantName: userName }
        );
      }
      
      setShowConfirmDialog(false);
      navigate('/mi-polla');
    } catch (e) { 
      console.error('Error al guardar:', e);
      alert("Error al guardar: " + (e as Error).message); 
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular tiempo restante para mostrar
  const getTimeRemaining = () => {
    const now = new Date();
    const diff = DEADLINE.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    if (days > 0) {
      return `${days} ${days === 1 ? 'día' : 'días'}`;
    }
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  };

  const groupsCompleted = groupsList.length > 0 && groupsList.every(g => (predictions[g]||[]).every(m => m.score1 !== undefined && m.score2 !== undefined));
  
  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#1E3A5F] size-10"/>
    </div>
  );

  // Si la fecha límite ya pasó
  if (deadlinePassed) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarX className="size-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Inscripciones Cerradas</h2>
            <p className="text-slate-600 mb-4">
              El plazo para enviar predicciones terminó el <strong>10 de junio de 2026</strong>.
            </p>
            <p className="text-slate-500 text-sm mb-6">
              El Mundial ya comenzó. Puedes ver el ranking y las predicciones de otros participantes.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/ranking">
                <Button variant="outline" className="border-2 border-[#1E3A5F] text-[#1E3A5F] rounded-xl">
                  Ver Ranking
                </Button>
              </Link>
              <Link to="/comunidad">
                <Button className="bg-[#E85D24] hover:bg-[#C44D1A] text-white rounded-xl">
                  Ver Comunidad
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si ya envió
  if (alreadySubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="size-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Ya enviaste tu predicción!</h2>
            <p className="text-slate-600 mb-6">
              Tu polla está bloqueada y no puede ser modificada. 
              Los puntos se actualizarán automáticamente cuando empiecen los partidos.
            </p>
            <Link to="/mi-polla">
              <Button className="bg-[#1E3A5F] hover:bg-[#152A45] text-white rounded-xl px-8">
                Ver Mi Predicción
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl flex items-center justify-center shadow-lg">
          <Target className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tu Predicción</h1>
          <p className="text-slate-500">Llena todos los partidos para competir</p>
        </div>
      </div>
      
      {/* Alerta de tiempo restante */}
      {timeRemaining && (
        <Alert className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <AlertCircle className="size-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Tiempo restante:</strong> {timeRemaining} para enviar tu predicción. 
            Fecha límite: <strong>10 de junio de 2026</strong>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Tabs rediseñadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100 p-1.5 rounded-2xl h-auto">
          <TabsTrigger 
            value="groups"
            className="px-6 py-3 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            <Users className="size-4 mr-2" />
            Fase de Grupos
          </TabsTrigger>
          <TabsTrigger 
            value="knockout" 
            disabled={!groupsCompleted}
            className="px-6 py-3 rounded-xl data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white data-[state=active]:shadow-md disabled:opacity-50"
          >
            <Trophy className="size-4 mr-2" />
            Fase Final {groupsCompleted ? '' : '(Bloqueado)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {!groupsCompleted && (
              <Alert className="bg-[#E85D24]/10 border-2 border-[#E85D24]/20 text-[#C44D1A] rounded-xl">
                <AlertCircle className="w-5 h-5"/> 
                <AlertDescription>Llena todos los grupos para desbloquear la Fase Final.</AlertDescription>
              </Alert>
            )}
            <Accordion type="multiple" defaultValue={[]}>
              {groupsList.map(g => (
                <AccordionItem key={g} value={g} className="bg-white border-2 border-slate-200 rounded-2xl px-4 mb-3 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">{g}</span>
                      </div>
                      <span className="font-semibold text-slate-900">Grupo {g}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {predictions[g]?.map(m => (
                      <div key={m.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                        <span className="w-1/3 text-right text-sm truncate pr-3 font-medium text-slate-700">{m.team1}</span>
                        <div className="flex gap-2 mx-2">
                          <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            className="w-14 h-12 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] transition-all"
                            value={m.score1 ?? ''} 
                            onChange={e => updateScore(g, m.id, 'team1', e.target.value)}
                            placeholder="-"
                          />
                          <span className="flex items-center text-slate-400 font-bold text-lg">vs</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            className="w-14 h-12 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F] transition-all"
                            value={m.score2 ?? ''} 
                            onChange={e => updateScore(g, m.id, 'team2', e.target.value)}
                            placeholder="-"
                          />
                        </div>
                        <span className="w-1/3 text-left text-sm truncate pl-3 font-medium text-slate-700">{m.team2}</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Progress Card */}
          <div className="hidden lg:block">
            <Card className="border-0 shadow-md rounded-2xl sticky top-24">
              <CardHeader className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] text-white rounded-t-2xl">
                <CardTitle className="text-sm font-medium">Progreso</CardTitle>
              </CardHeader>
              <CardContent className="text-center p-6">
                <div className="text-4xl font-bold text-[#E85D24] mb-2">
                  {groupsList.filter(g => (predictions[g]||[]).every(m => m.score1 !== undefined && m.score2 !== undefined)).length} / 12
                </div>
                <div className="text-sm text-slate-500 mb-4">Grupos Completados</div>
                {groupsCompleted && (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl" 
                    onClick={() => setActiveTab('knockout')}
                  >
                    Ir a Fase Final 
                    <CheckCircle className="ml-2 w-4 h-4"/>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knockout" className="space-y-8">
          <Alert className="bg-[#1E3A5F]/5 border-2 border-[#1E3A5F]/20 text-[#1E3A5F] rounded-xl">
            <Trophy className="w-5 h-5"/>
            <AlertDescription>Haz clic en el equipo ganador de cada llave para avanzar.</AlertDescription>
          </Alert>
          
          {['R32','R16','QF','SF','F'].map(r => (
            <div key={r}>
              <h3 className="font-bold border-b-2 border-slate-200 mb-4 pb-3 text-lg text-slate-900">
                {{'R32':'Dieciseisavos','R16':'Octavos','QF':'Cuartos','SF':'Semifinal','F':'Final'}[r]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {bracket.filter(m => m.round === r).map(m => (
                  <div key={m.id} className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
                    knockoutPicks[m.id] ? 'border-[#1E3A5F]' : 'border-slate-200'
                  }`}>
                    {[m.team1, m.team2].map(t => (
                      <button 
                        key={t} 
                        onClick={() => pickWinner(m.id, t)} 
                        className={`w-full text-left p-3 rounded-xl text-sm mb-2 last:mb-0 flex justify-between items-center transition-all ${
                          knockoutPicks[m.id] === t 
                            ? 'bg-[#1E3A5F] text-white font-semibold shadow-md' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-2 border-slate-200'
                        }`}
                      >
                        <span className="truncate">{t}</span>
                        {knockoutPicks[m.id] === t && <CheckCircle className="w-4 h-4 flex-shrink-0"/>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center pt-6">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#E85D24] to-[#C44D1A] hover:from-[#C44D1A] hover:to-[#A43D10] text-white rounded-xl px-10 h-14 text-lg shadow-lg" 
              onClick={() => setShowConfirmDialog(true)}
            >
              <Save className="mr-2 size-5"/> 
              Confirmar Predicción
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={(open: boolean) => setShowConfirmDialog(open)}>
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">¿Enviar Definitiva?</DialogTitle>
            <DialogDescription>No podrás hacer cambios después.</DialogDescription>
          </DialogHeader>
          <div className="bg-[#1E3A5F]/5 p-6 rounded-xl text-center border-2 border-[#1E3A5F]/20">
            <div className="text-sm text-slate-500 mb-2">Tu Campeón</div>
            <div className="text-2xl font-bold text-[#1E3A5F]">{knockoutPicks['F-1'] || "Sin seleccionar"}</div>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)} 
              disabled={submitting}
              className="rounded-xl border-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-[#E85D24] hover:bg-[#C44D1A] text-white rounded-xl"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Enviando...
                </>
              ) : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}