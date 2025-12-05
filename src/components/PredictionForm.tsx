import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Match } from '../utils/types';
import { calculateGroupStandings, generateRoundOf32, KnockoutPairing } from '../utils/bracketLogic';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertCircle, Trophy, CheckCircle, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function PredictionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Datos
  const [predictions, setPredictions] = useState<{ [key: string]: Match[] }>({});
  const [groupsList, setGroupsList] = useState<string[]>([]);
  const [knockoutPicks, setKnockoutPicks] = useState<{ [matchId: string]: string }>({});
  const [bracket, setBracket] = useState<KnockoutPairing[]>([]);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("groups");

  // 1. Cargar datos
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, 'partidos'), orderBy('group'), orderBy('date'));
        const snap = await getDocs(q);
        const grouped: { [key: string]: Match[] } = {};
        const groupsFound = new Set<string>();
        
        snap.forEach((doc) => {
          const d = doc.data();
          const m: Match = { 
            id: doc.id, team1: d.team1, team2: d.team2, date: d.date, group: d.group,
            score1: undefined, score2: undefined // Limpios para predecir
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
    const allStandings: any = {};
    groupsList.forEach(g => {
      allStandings[g] = calculateGroupStandings(predictions[g] || [], g);
    });

    const fullBracket = [...generateRoundOf32(allStandings)];
    const getWinner = (id: string) => knockoutPicks[id];

    // Función para construir rondas siguientes
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
  }, [predictions, knockoutPicks, groupsList]);

  const updateScore = (g: string, id: string, t: 'team1'|'team2', v: string) => {
    const s = v === '' ? undefined : parseInt(v);
    if (s !== undefined && (isNaN(s) || s < 0)) return;
    setPredictions(p => ({
      ...p, [g]: p[g].map(m => m.id === id ? { ...m, [t === 'team1'?'score1':'score2']: s } : m)
    }));
  };

  const pickWinner = (id: string, team: string) => {
    if (!team || team.includes('Ganador') || team.includes('TBD')) return;
    setKnockoutPicks(prev => ({ ...prev, [id]: team }));
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || !knockoutPicks['F-1']) { alert("Elige un campeón."); return; }
    try {
      await setDoc(doc(db, 'polla_completa', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        groupPredictions: predictions,
        knockoutPicks,
        isLocked: true,
        submittedAt: new Date().toISOString(),
        totalPoints: 0
      });
      navigate('/mi-polla');
    } catch (e) { alert("Error al guardar."); }
  };

  // UI Helpers
  const groupsCompleted = groupsList.length > 0 && groupsList.every(g => (predictions[g]||[]).every(m => m.score1 !== undefined && m.score2 !== undefined));
  
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500"/></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-6">Tu Predicción</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="groups">Fase de Grupos</TabsTrigger>
          <TabsTrigger value="knockout" disabled={!groupsCompleted}>Fase Final {groupsCompleted ? '🏆' : '🔒'}</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {!groupsCompleted && <Alert className="bg-orange-50 text-orange-800"><AlertCircle className="w-4 h-4"/> <AlertDescription>Llena todos los grupos para desbloquear la Fase Final.</AlertDescription></Alert>}
            <Accordion type="multiple" defaultValue={['A']}>
              {groupsList.map(g => (
                <AccordionItem key={g} value={g} className="bg-white border rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline"><span className="font-bold">Grupo {g}</span></AccordionTrigger>
                  <AccordionContent>
                    {predictions[g]?.map(m => (
                      <div key={m.id} className="flex justify-between items-center py-2">
                        <span className="w-1/3 text-right text-sm">{m.team1}</span>
                        <div className="flex gap-2 mx-2">
                          <Input type="number" className="w-10 h-8 text-center" min="0" value={m.score1??''} onChange={e=>updateScore(g,m.id,'team1',e.target.value)}/>
                          <Input type="number" className="w-10 h-8 text-center" min="0" value={m.score2??''} onChange={e=>updateScore(g,m.id,'team2',e.target.value)}/>
                        </div>
                        <span className="w-1/3 text-left text-sm">{m.team2}</span>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="hidden lg:block">
            <Card>
              <CardHeader><CardTitle className="text-sm">Progreso</CardTitle></CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                   {groupsList.filter(g => (predictions[g]||[]).every(m => m.score1 !== undefined && m.score2 !== undefined)).length} / 12
                </div>
                <div className="text-xs text-gray-500">Grupos Completados</div>
                {groupsCompleted && <Button className="w-full mt-4 bg-green-600" onClick={()=>setActiveTab('knockout')}>Ir a Fase Final <CheckCircle className="ml-2 w-4 h-4"/></Button>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knockout" className="space-y-8">
          <Alert className="bg-blue-50 text-blue-900"><Trophy className="w-4 h-4"/><AlertDescription>Haz clic en el equipo ganador de cada llave para avanzar.</AlertDescription></Alert>
          {['R32','R16','QF','SF','F'].map(r => (
            <div key={r}>
              <h3 className="font-bold border-b mb-4 pb-2 text-lg">{{'R32':'Dieciseisavos','R16':'Octavos','QF':'Cuartos','SF':'Semifinal','F':'Final'}[r]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {bracket.filter(m => m.round === r).map(m => (
                  <div key={m.id} className={`bg-white border-2 rounded p-3 ${knockoutPicks[m.id] ? 'border-orange-200' : 'border-slate-100'}`}>
                    {[m.team1, m.team2].map(t => (
                      <button key={t} onClick={()=>pickWinner(m.id,t)} className={`w-full text-left p-2 rounded text-sm mb-1 flex justify-between ${knockoutPicks[m.id]===t ? 'bg-orange-500 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}>
                        <span className="truncate">{t}</span>{knockoutPicks[m.id]===t && <CheckCircle className="w-3 h-3"/>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-4">
             <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 text-white" onClick={()=>setShowConfirmDialog(true)}><Save className="mr-2"/> Confirmar Predicción</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Enviar Definitiva?</DialogTitle><DialogDescription>No podrás hacer cambios después.</DialogDescription></DialogHeader>
          <div className="bg-slate-50 p-4 rounded text-center"><strong>Tu Campeón:</strong> {knockoutPicks['F-1'] || "Sin seleccionar"}</div>
          <DialogFooter><Button variant="outline" onClick={()=>setShowConfirmDialog(false)}>Cancelar</Button><Button onClick={handleSubmit} className="bg-orange-600 text-white">Enviar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}