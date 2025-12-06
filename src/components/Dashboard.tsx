import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Trophy, TrendingUp, Calendar, Award, ArrowRight, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';

interface Match {
  id: string;
  team1: string;
  team2: string;
  date: string;
  group: string;
}

interface UserStats {
  hasPrediction: boolean;
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
  position: number;
  userName: string | null;
  submittedAt?: string;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    hasPrediction: false,
    totalPoints: 0,
    exactMatches: 0,
    correctWinners: 0,
    position: 0,
    userName: null
  });
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);

          let submittedAtFormatted: string | undefined;
          if (pollaSnap.exists()) {
            const data = pollaSnap.data();
            if (data.submittedAt) {
              if (data.submittedAt.toDate) {
                submittedAtFormatted = data.submittedAt.toDate().toLocaleDateString('es-ES');
              } else if (typeof data.submittedAt === 'string') {
                submittedAtFormatted = new Date(data.submittedAt).toLocaleDateString('es-ES');
              }
            }
          }

          setUserStats({
            hasPrediction: pollaSnap.exists(),
            totalPoints: 0, 
            exactMatches: 0,
            correctWinners: 0,
            position: 0, 
            userName: user.displayName,
            submittedAt: submittedAtFormatted
          });

          const matchesRef = collection(db, 'partidos');
          const q = query(matchesRef, orderBy('date', 'asc'), limit(3));
          const querySnapshot = await getDocs(q);
          
          const matches: Match[] = [];
          querySnapshot.forEach((doc) => {
            matches.push({ id: doc.id, ...doc.data() } as Match);
          });
          setUpcomingMatches(matches);

        } catch (error) {
          console.error("Error cargando dashboard:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-10 animate-spin text-[#1E3A5F]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          ¡Hola, {userStats.userName?.split(' ')[0] || 'Participante'}! 
        </h1>
        <p className="text-slate-500">
          {userStats.hasPrediction 
            ? "Aquí tienes el resumen de tu desempeño en la Copa."
            : "Bienvenido a la Polla Mundialista. ¡Es hora de jugar!"}
        </p>
      </div>

      {/* CTA Banner si no tiene predicción */}
      {!userStats.hasPrediction ? (
        <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Trophy className="size-8 text-[#D4A824]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">¡Aún no tienes predicciones!</h2>
                  <p className="text-slate-300 mt-1">Llena tu bracket completo para competir.</p>
                </div>
              </div>
              <Link to="/mi-polla">
                <Button className="bg-[#E85D24] hover:bg-[#D54D14] text-white font-bold px-8 h-14 text-lg shadow-lg rounded-xl">
                  Llenar mi Polla
                  <PlayCircle className="ml-2 size-5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        /* Stats Cards si ya tiene predicción */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] p-6 text-white h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Trophy className="size-6 text-[#D4A824]" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{userStats.position > 0 ? userStats.position : '-'}</div>
              <div className="text-sm text-white/80">Tu Posición</div>
            </div>
          </Card>

          <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="size-6 text-[#1E3A5F]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 mb-1">{userStats.totalPoints}</div>
              <div className="text-sm text-slate-500">Puntos Totales</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-emerald-600 mb-1">{userStats.exactMatches}</div>
              <div className="text-sm text-slate-500">Marcadores Exactos</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-[#D4A824]/10 rounded-xl flex items-center justify-center">
                  <Award className="size-6 text-[#D4A824]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-[#D4A824] mb-1">{userStats.correctWinners}</div>
              <div className="text-sm text-slate-500">Resultados</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid de contenido */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos Partidos */}
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Próximos Partidos</h3>
              <Calendar className="size-5 text-slate-400" />
            </div>
          </div>
          <CardContent className="p-6">
            {upcomingMatches.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay partidos próximos</p>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <div 
                    key={match.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-[#1E3A5F] font-medium mb-2 bg-[#1E3A5F]/10 inline-block px-2 py-1 rounded-lg">
                        Grupo {match.group}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">{match.team1}</span>
                        <span className="text-xs text-slate-400 bg-slate-200 px-2 py-1 rounded">vs</span>
                        <span className="font-semibold text-slate-900">{match.team2}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {new Date(match.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Acciones Rápidas</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Link to="/mi-polla" className="block">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-all group">
                  <span className="font-medium text-slate-900">Ver Mi Predicción</span>
                  <ArrowRight className="size-5 text-slate-400 group-hover:text-[#1E3A5F] transition-colors" />
                </div>
              </Link>
              <Link to="/ranking" className="block">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-all group">
                  <span className="font-medium text-slate-900">Ver Ranking Completo</span>
                  <ArrowRight className="size-5 text-slate-400 group-hover:text-[#1E3A5F] transition-colors" />
                </div>
              </Link>
              <Link to="/comunidad" className="block">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-all group">
                  <span className="font-medium text-slate-900">Ver Otras Pollas</span>
                  <ArrowRight className="size-5 text-slate-400 group-hover:text-[#1E3A5F] transition-colors" />
                </div>
              </Link>
              <Link to="/instrucciones" className="block">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-all group">
                  <span className="font-medium text-slate-900">Sistema de Puntuación</span>
                  <ArrowRight className="size-5 text-slate-400 group-hover:text-[#1E3A5F] transition-colors" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de predicción registrada */}
      {userStats.hasPrediction && userStats.submittedAt && (
        <Card className="mt-8 border-0 shadow-md bg-emerald-50 border-2 border-emerald-200 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Trophy className="size-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">Predicción Registrada</h4>
                <p className="text-emerald-700 text-sm">
                  Tu polla fue enviada el {userStats.submittedAt} y está bloqueada. Los puntos se actualizan automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}