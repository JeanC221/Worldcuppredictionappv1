import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Match {
  id: string;
  team1: string;
  team2: string;
  group: string;
  date: string;
}

interface Prediction {
  score1: number | '';
  score2: number | '';
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function PredictionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [expandedGroup, setExpandedGroup] = useState<string>('A');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName || '');

        try {
          // Cargar partidos
          const matchesSnap = await getDocs(collection(db, 'partidos'));
          const matchesData = matchesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Match))
            .sort((a, b) => a.date.localeCompare(b.date));
          setMatches(matchesData);

          // Cargar predicción existente
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);

          if (pollaSnap.exists()) {
            const data = pollaSnap.data();
            const existingPreds = data.groupPredictions || data.phases?.groups?.matchPredictions || {};
            
            const formattedPreds: Record<string, Prediction> = {};
            for (const [matchId, pred] of Object.entries(existingPreds)) {
              const p = pred as { score1: number; score2: number };
              formattedPreds[matchId] = { score1: p.score1, score2: p.score2 };
            }
            setPredictions(formattedPreds);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getMatchesByGroup = (group: string) => 
    matches.filter(m => m.group === group);

  const getGroupProgress = (group: string) => {
    const groupMatches = getMatchesByGroup(group);
    const completed = groupMatches.filter(m => {
      const pred = predictions[m.id];
      return pred && pred.score1 !== '' && pred.score2 !== '';
    }).length;
    return { completed, total: groupMatches.length };
  };

  const getTotalProgress = () => {
    let completed = 0;
    matches.forEach(m => {
      const pred = predictions[m.id];
      if (pred && pred.score1 !== '' && pred.score2 !== '') completed++;
    });
    return { completed, total: matches.length };
  };

  const handleScoreChange = (matchId: string, field: 'score1' | 'score2', value: string) => {
    const numValue = value === '' ? '' : Math.max(0, Math.min(99, parseInt(value) || 0));
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: numValue
      }
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      // Convertir predicciones a formato final
      const finalPredictions: Record<string, { score1: number; score2: number }> = {};
      for (const [matchId, pred] of Object.entries(predictions)) {
        if (pred.score1 !== '' && pred.score2 !== '') {
          finalPredictions[matchId] = {
            score1: Number(pred.score1),
            score2: Number(pred.score2)
          };
        }
      }

      await setDoc(doc(db, 'polla_completa', userId), {
        userId,
        userName,
        groupPredictions: finalPredictions,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      navigate('/mi-polla');
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  const progress = getTotalProgress();
  const progressPercent = Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Hacer Predicción</h1>
        <p className="text-[#666]">
          Completa los marcadores de todos los partidos de la fase de grupos
        </p>
      </div>

      {/* Barra de progreso sticky */}
      <div className="sticky top-16 z-40 bg-[#FAFAF8] py-4 mb-6 border-b border-[#eee]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#666]">
            {progress.completed} de {progress.total} partidos
          </span>
          <span className="text-sm font-medium text-[#1a1a1a]">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-[#eee] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Botón guardar en barra */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#999]">
            {progress.completed === progress.total 
              ? '✓ Todos los partidos completados'
              : `Faltan ${progress.total - progress.completed} partidos`
            }
          </p>
          <button
            onClick={handleSave}
            disabled={saving || progress.completed === 0}
            className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grupos */}
      <div className="space-y-2">
        {GROUPS.map((group) => {
          const groupMatches = getMatchesByGroup(group);
          const { completed, total } = getGroupProgress(group);
          const isExpanded = expandedGroup === group;
          const isComplete = completed === total && total > 0;

          return (
            <div
              key={group}
              className="bg-white border border-[#eee] rounded-xl overflow-hidden"
            >
              {/* Header del grupo */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? '' : group)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-full font-bold flex items-center justify-center ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : 'bg-[#1a1a1a] text-white'
                  }`}>
                    {isComplete ? <Check className="size-5" /> : group}
                  </span>
                  <div className="text-left">
                    <p className="font-medium text-[#1a1a1a]">Grupo {group}</p>
                    <p className="text-sm text-[#999]">
                      {completed} de {total} partidos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isComplete && (
                    <span className="text-xs text-green-600 font-medium">Completo</span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-[#999]" />
                  ) : (
                    <ChevronDown className="size-5 text-[#999]" />
                  )}
                </div>
              </button>

              {/* Partidos */}
              {isExpanded && (
                <div className="border-t border-[#eee] px-5 py-4 space-y-3">
                  {groupMatches.map((match) => {
                    const pred = predictions[match.id] || { score1: '', score2: '' };
                    const matchDate = new Date(match.date);
                    
                    return (
                      <div
                        key={match.id}
                        className="flex items-center gap-3 py-3 px-4 bg-[#fafafa] rounded-lg"
                      >
                        {/* Fecha */}
                        <div className="hidden sm:block text-center min-w-[50px]">
                          <p className="text-xs text-[#999] uppercase">
                            {matchDate.toLocaleDateString('es-ES', { month: 'short' })}
                          </p>
                          <p className="text-lg font-bold text-[#1a1a1a]">
                            {matchDate.getDate()}
                          </p>
                        </div>
                        
                        <div className="hidden sm:block w-px h-10 bg-[#e5e5e5]" />
                        
                        {/* Equipo 1 */}
                        <div className="flex-1 text-right">
                          <span className="font-medium text-[#1a1a1a] text-sm">
                            {match.team1}
                          </span>
                        </div>
                        
                        {/* Inputs */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={pred.score1}
                            onChange={(e) => handleScoreChange(match.id, 'score1', e.target.value)}
                            className="w-12 h-10 text-center font-mono font-bold text-lg border border-[#ddd] rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-colors"
                            placeholder="-"
                          />
                          <span className="text-[#999] font-medium">:</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={pred.score2}
                            onChange={(e) => handleScoreChange(match.id, 'score2', e.target.value)}
                            className="w-12 h-10 text-center font-mono font-bold text-lg border border-[#ddd] rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-colors"
                            placeholder="-"
                          />
                        </div>
                        
                        {/* Equipo 2 */}
                        <div className="flex-1">
                          <span className="font-medium text-[#1a1a1a] text-sm">
                            {match.team2}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón final */}
      <div className="mt-8 p-6 bg-white border border-[#eee] rounded-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium text-[#1a1a1a]">
              {progress.completed === progress.total 
                ? '¡Listo para enviar!'
                : `Te faltan ${progress.total - progress.completed} partidos`
              }
            </p>
            <p className="text-sm text-[#999]">
              Puedes guardar y editar hasta que cierre el plazo
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || progress.completed === 0}
            className="w-full sm:w-auto px-6 py-3 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-[#333] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar predicción'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}