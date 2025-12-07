import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Match } from '../utils/types';
import { 
  TournamentPhase, PHASE_DATES, GROUPS,
  getCurrentPhase, isPhaseLockedForPrediction 
} from '../utils/constants';
import { getTeamsAdvancingFromGroups } from '../utils/scoring';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { 
  Trophy, CheckCircle, Loader2, Save, Lock, 
  CalendarX, Target, Clock
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Link } from 'react-router-dom';
import { TeamDisplay } from './TeamDisplay';

export function PredictionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase | null>(null);
  
  const [matchesByGroup, setMatchesByGroup] = useState<{ [group: string]: Match[] }>({});
  const [predictions, setPredictions] = useState<{ [matchId: string]: { score1: number | undefined; score2: number | undefined } }>({});
  const [userPhases, setUserPhases] = useState<{ [key in TournamentPhase]?: { isLocked: boolean } }>({});
  
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const phase = getCurrentPhase();
        setCurrentPhase(phase);

        const q = query(collection(db, 'partidos'), orderBy('group'), orderBy('date'));
        const snap = await getDocs(q);
        const grouped: { [group: string]: Match[] } = {};
        
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const m: Match = { id: docSnap.id, team1: d.team1, team2: d.team2, date: d.date, group: d.group };
          if (!grouped[m.group]) grouped[m.group] = [];
          grouped[m.group].push(m);
        });
        setMatchesByGroup(grouped);

        if (auth.currentUser) {
          const pollaDoc = await getDoc(doc(db, 'polla_completa', auth.currentUser.uid));
          if (pollaDoc.exists()) {
            const data = pollaDoc.data();
            if (data.groupPredictions) {
              const preds: { [matchId: string]: { score1: number | undefined; score2: number | undefined } } = {};
              for (const [matchId, pred] of Object.entries(data.groupPredictions)) {
                const p = pred as { score1: number; score2: number };
                preds[matchId] = { score1: p.score1, score2: p.score2 };
              }
              setPredictions(preds);
            }
            if (data.phases) {
              setUserPhases(data.phases);
            } else if (data.isLocked) {
              setUserPhases({ groups: { isLocked: true } });
            }
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateScore = (matchId: string, team: 'score1' | 'score2', value: string) => {
    if (value === '') {
      setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], [team]: undefined } }));
      return;
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 0 || num > 99) return;
    setPredictions(prev => ({
      ...prev,
      [matchId]: { score1: prev[matchId]?.score1, score2: prev[matchId]?.score2, [team]: num }
    }));
  };

  const isGroupComplete = (group: string): boolean => {
    const matches = matchesByGroup[group] || [];
    return matches.every(m => predictions[m.id]?.score1 !== undefined && predictions[m.id]?.score2 !== undefined);
  };

  const completedGroups = GROUPS.filter(g => isGroupComplete(g)).length;
  const allGroupsComplete = completedGroups === 12;

  const handleSubmit = async () => {
    if (!auth.currentUser) { alert('Debes iniciar sesión'); return; }
    if (!allGroupsComplete) { alert('Debes completar todos los grupos'); return; }

    setSubmitting(true);
    try {
      const groupPredictions: { [matchId: string]: { score1: number; score2: number } } = {};
      for (const [matchId, pred] of Object.entries(predictions)) {
        if (pred.score1 !== undefined && pred.score2 !== undefined) {
          groupPredictions[matchId] = { score1: pred.score1, score2: pred.score2 };
        }
      }

      const teamsAdvancing = getTeamsAdvancingFromGroups(groupPredictions, matchesByGroup);
      const docRef = doc(db, 'polla_completa', auth.currentUser.uid);
      const existingDoc = await getDoc(docRef);

      const phaseData = { isLocked: true, teamsAdvancing, submittedAt: new Date() };

      if (existingDoc.exists()) {
        await updateDoc(docRef, { groupPredictions, 'phases.groups': phaseData, updatedAt: new Date() });
      } else {
        await setDoc(docRef, {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email || 'Anónimo',
          userEmail: auth.currentUser.email,
          groupPredictions,
          phases: { groups: phaseData },
          totalPoints: 0,
          createdAt: new Date()
        });
      }

      setShowConfirmDialog(false);
      navigate('/mi-polla');
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeRemaining = (): string | null => {
    if (!currentPhase) return null;
    const deadline = PHASE_DATES[currentPhase].lockBefore;
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return `${Math.floor(days / 30)} meses`;
    if (days > 0) return `${days} días`;
    return `${Math.floor(diff / (1000 * 60 * 60))} horas`;
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-[#1E3A5F] size-10" /></div>;

  const groupsLocked = userPhases.groups?.isLocked || isPhaseLockedForPrediction('groups');
  
  if (groupsLocked) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Card className="border-0 shadow-lg rounded-2xl"><CardContent className="p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="size-10 text-emerald-500" /></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{userPhases.groups?.isLocked ? '¡Predicción Enviada!' : 'Fase Cerrada'}</h2>
          <p className="text-slate-600 mb-6">{userPhases.groups?.isLocked ? 'Tu predicción está bloqueada.' : 'El plazo terminó.'}</p>
          <Link to="/mi-polla"><Button className="bg-[#1E3A5F] hover:bg-[#152A45] text-white rounded-xl px-8">Ver Mi Predicción</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  if (!currentPhase) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Card className="border-0 shadow-lg rounded-2xl"><CardContent className="p-8">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><CalendarX className="size-10 text-slate-400" /></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sin Fase Activa</h2>
          <p className="text-slate-600">No hay fase disponible para predicciones.</p>
        </CardContent></Card>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining();
  const currentMatches = matchesByGroup[selectedGroup] || [];
  const groupMatchesComplete = currentMatches.filter(m => predictions[m.id]?.score1 !== undefined && predictions[m.id]?.score2 !== undefined).length;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl flex items-center justify-center shadow-lg"><Target className="size-7 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">Fase de Grupos</h1><p className="text-slate-500">Predice los 72 partidos</p></div>
      </div>

      {timeRemaining && (
        <Alert className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <Clock className="size-5 text-amber-600" />
          <AlertDescription className="text-amber-800"><strong>Tiempo restante:</strong> {timeRemaining}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* 12 Cuadrados de grupos */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Selecciona un Grupo</h2>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {GROUPS.map(g => {
                const isComplete = isGroupComplete(g);
                const isSelected = selectedGroup === g;
                return (
                  <button key={g} onClick={() => setSelectedGroup(g)}
                    className={`relative aspect-square rounded-xl font-bold text-lg transition-all ${
                      isSelected ? 'bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white shadow-lg scale-105' 
                      : isComplete ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-[#1E3A5F]'
                    }`}>
                    {g}
                    {isComplete && !isSelected && <CheckCircle className="absolute -top-1 -right-1 size-5 text-emerald-500 bg-white rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partidos del grupo */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] text-white py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xl">{selectedGroup}</span></div>
                  <div><CardTitle className="text-lg">Grupo {selectedGroup}</CardTitle><p className="text-white/70 text-sm">{currentMatches.length} partidos</p></div>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-lg"><span className="font-bold">{groupMatchesComplete}/{currentMatches.length}</span></div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {currentMatches.map(match => {
                const pred = predictions[match.id] || { score1: undefined, score2: undefined };
                const isComplete = pred.score1 !== undefined && pred.score2 !== undefined;
                return (
                  <div key={match.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isComplete ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-slate-50 border-2 border-slate-200'}`}>
                    <div className="flex-1 flex justify-end"><TeamDisplay team={match.team1} reverse className="text-sm font-medium text-slate-700" flagSize="md" /></div>
                    <div className="flex items-center gap-2">
                      <Input type="text" inputMode="numeric" maxLength={2} value={pred.score1 ?? ''} onChange={(e) => updateScore(match.id, 'score1', e.target.value)} className="w-14 h-12 text-center text-xl font-bold rounded-xl border-2" placeholder="-" />
                      <span className="text-slate-400 font-bold">-</span>
                      <Input type="text" inputMode="numeric" maxLength={2} value={pred.score2 ?? ''} onChange={(e) => updateScore(match.id, 'score2', e.target.value)} className="w-14 h-12 text-center text-xl font-bold rounded-xl border-2" placeholder="-" />
                    </div>
                    <div className="flex-1"><TeamDisplay team={match.team2} className="text-sm font-medium text-slate-700" flagSize="md" /></div>
                    {isComplete && <CheckCircle className="size-5 text-emerald-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar progreso */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl sticky top-24">
            <CardHeader className="bg-gradient-to-r from-[#E85D24] to-[#C44D1A] text-white rounded-t-2xl py-4"><CardTitle className="text-base flex items-center gap-2"><Trophy className="size-5" />Tu Progreso</CardTitle></CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold text-[#1E3A5F] mb-2">{completedGroups}/12</div>
              <div className="text-sm text-slate-500 mb-6">Grupos Completados</div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-6"><div className="bg-gradient-to-r from-[#1E3A5F] to-[#2D4A6F] h-3 rounded-full transition-all" style={{ width: `${(completedGroups / 12) * 100}%` }} /></div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {GROUPS.map(g => (<div key={g} className={`text-xs font-bold py-1.5 rounded-lg ${isGroupComplete(g) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{g}</div>))}
              </div>
              <Button onClick={() => setShowConfirmDialog(true)} disabled={!allGroupsComplete} className={`w-full h-12 rounded-xl text-base font-semibold ${allGroupsComplete ? 'bg-gradient-to-r from-[#E85D24] to-[#C44D1A]' : 'bg-slate-300'}`}>
                {allGroupsComplete ? <><Save className="mr-2 size-5" />Enviar Predicción</> : <><Lock className="mr-2 size-5" />Completa los 12 grupos</>}
              </Button>
              {!allGroupsComplete && <p className="text-xs text-slate-400 mt-3">Faltan {12 - completedGroups} grupos</p>}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl"><CardContent className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Sistema de Puntos</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Marcador exacto</span><span className="font-bold text-emerald-600">+5 pts</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Ganador correcto</span><span className="font-bold text-[#1E3A5F]">+3 pts</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Equipo que pasa</span><span className="font-bold text-[#D4A824]">+2 pts</span></div>
            </div>
          </CardContent></Card>
        </div>
      </div>

      {/* Dialog confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl">¿Confirmar Predicción?</DialogTitle><DialogDescription>No podrás modificar después.</DialogDescription></DialogHeader>
          <div className="bg-[#1E3A5F]/5 p-4 rounded-xl border-2 border-[#1E3A5F]/20 text-center"><div className="text-sm text-slate-500 mb-1">Grupos completados</div><div className="text-3xl font-bold text-[#1E3A5F]">12/12</div></div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={submitting} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#E85D24] hover:bg-[#C44D1A] rounded-xl">
              {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" />Enviando...</> : <><CheckCircle className="mr-2 size-4" />Confirmar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}