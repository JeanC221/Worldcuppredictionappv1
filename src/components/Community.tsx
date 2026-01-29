import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface UserPolla {
  docId: string;
  userId: string;
  userName: string;
  submittedAt?: any;
  groupPredictions?: Record<string, { score1: number; score2: number }>;
  phases?: Record<string, any>;
}

interface Match {
  id: string;
  team1: string;
  team2: string;
  group: string;
  date: string;
  score1?: number;
  score2?: number;
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function Community() {
  const [pollas, setPollas] = useState<UserPolla[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pollasSnap, matchesSnap] = await Promise.all([
          getDocs(collection(db, 'polla_completa')),
          getDocs(collection(db, 'partidos'))
        ]);

        const pollasData = pollasSnap.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        })) as UserPolla[];

        const matchesData = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        pollasData.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));

        setPollas(pollasData);
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPollas = pollas.filter(polla =>
    (polla.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMatchById = (matchId: string) => matches.find(m => m.id === matchId);

  const getMatchesByGroup = (group: string) => matches.filter(m => m.group === group);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getUserPredictions = (polla: UserPolla) => {
    if (polla.phases?.groups?.matchPredictions) {
      return polla.phases.groups.matchPredictions;
    }
    return polla.groupPredictions || {};
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Comunidad</h1>
        <p className="text-[#666]">
          Explora las predicciones de {pollas.length} participantes
        </p>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#999]" />
        <input
          type="text"
          placeholder="Buscar participante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#1a1a1a] transition-colors"
        />
      </div>

      {/* Lista */}
      {filteredPollas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#999]">
            {searchTerm ? 'No se encontraron participantes' : 'Aún no hay predicciones'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPollas.map((polla) => {
            const isExpanded = expandedUser === polla.docId;
            const predictions = getUserPredictions(polla);
            const predictionCount = Object.keys(predictions).length;

            return (
              <div
                key={polla.docId}
                className="bg-white border border-[#eee] rounded-xl overflow-hidden"
              >
                {/* Header del usuario */}
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : polla.docId)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-medium">
                      {(polla.userName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#1a1a1a]">
                        {polla.userName || 'Anónimo'}
                      </p>
                      <p className="text-sm text-[#999]">
                        {predictionCount} predicciones
                        {polla.submittedAt && ` · ${formatDate(polla.submittedAt)}`}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-[#999]" />
                  ) : (
                    <ChevronDown className="size-5 text-[#999]" />
                  )}
                </button>

                {/* Predicciones expandidas */}
                {isExpanded && (
                  <div className="border-t border-[#eee]">
                    {/* Selector de grupos */}
                    <div className="px-5 py-3 border-b border-[#eee] bg-[#fafafa]">
                      <div className="flex gap-1 overflow-x-auto">
                        {GROUPS.map(g => (
                          <button
                            key={g}
                            onClick={() => setSelectedGroup(g)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedGroup === g
                                ? 'bg-[#1a1a1a] text-white'
                                : 'text-[#666] hover:bg-[#eee]'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Partidos del grupo */}
                    <div className="px-5 py-4">
                      {getMatchesByGroup(selectedGroup).length === 0 ? (
                        <p className="text-sm text-[#999] text-center py-4">
                          No hay partidos en este grupo
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {getMatchesByGroup(selectedGroup).map((match) => {
                            const pred = predictions[match.id];
                            const hasResult = match.score1 !== undefined && match.score2 !== undefined;
                            
                            // Solo calcular status si hay resultado real
                            let status: 'pending' | 'exact' | 'correct' | 'wrong' = 'pending';
                            if (pred && hasResult) {
                              if (pred.score1 === match.score1 && pred.score2 === match.score2) {
                                status = 'exact';
                              } else {
                                const predWinner = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? -1 : 0;
                                const realWinner = match.score1! > match.score2! ? 1 : match.score1! < match.score2! ? -1 : 0;
                                status = predWinner === realWinner ? 'correct' : 'wrong';
                              }
                            }

                            return (
                              <div
                                key={match.id}
                                className={`flex items-center justify-between py-3 px-4 rounded-lg text-sm ${
                                  !hasResult ? 'bg-[#fafafa]' :
                                  status === 'exact' ? 'bg-green-50 border border-green-200' :
                                  status === 'correct' ? 'bg-blue-50 border border-blue-200' :
                                  status === 'wrong' ? 'bg-red-50 border border-red-200' :
                                  'bg-[#fafafa]'
                                }`}
                              >
                                <span className="text-[#1a1a1a] flex-1">
                                  {match.team1}
                                </span>
                                
                                <div className="flex items-center gap-3 mx-4">
                                  {/* Resultado real - solo si existe */}
                                  {hasResult && (
                                    <span className="text-xs text-[#666] font-mono bg-white px-2 py-0.5 rounded">
                                      {match.score1}-{match.score2}
                                    </span>
                                  )}
                                  
                                  {/* Predicción */}
                                  {pred ? (
                                    <span className={`font-mono font-semibold px-2 py-1 rounded ${
                                      !hasResult ? 'bg-[#e5e5e5] text-[#666]' :
                                      status === 'exact' ? 'bg-green-500 text-white' :
                                      status === 'correct' ? 'bg-blue-500 text-white' :
                                      status === 'wrong' ? 'bg-red-400 text-white' :
                                      'bg-[#e5e5e5] text-[#666]'
                                    }`}>
                                      {pred.score1} - {pred.score2}
                                    </span>
                                  ) : (
                                    <span className="text-[#ccc] text-xs">—</span>
                                  )}
                                </div>
                                
                                <span className="text-[#1a1a1a] flex-1 text-right">
                                  {match.team2}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}