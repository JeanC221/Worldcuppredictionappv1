import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Trophy, TrendingUp, Calendar, Award, ArrowRight, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

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
          // 1. Verificar si el usuario ya tiene su polla
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);

          let submittedAtFormatted: string | undefined;
          if (pollaSnap.exists()) {
            const data = pollaSnap.data();
            // Formatear el timestamp correctamente
            if (data.submittedAt) {
              if (data.submittedAt.toDate) {
                // Es un Timestamp de Firebase
                submittedAtFormatted = data.submittedAt.toDate().toLocaleDateString('es-ES');
              } else if (typeof data.submittedAt === 'string') {
                // Es un string ISO
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
        <Loader2 className="size-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola, {userStats.userName?.split(' ')[0] || 'Participante'}! 
        </h1>
        <p className="text-gray-600">
          {userStats.hasPrediction 
            ? "Aquí tienes el resumen de tu desempeño en la Copa."
            : "Bienvenido a la Polla Mundialista. ¡Es hora de jugar!"}
        </p>
      </div>

      {!userStats.hasPrediction ? (
        <div className="mb-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Trophy className="size-8 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">¡Aún no tienes predicciones!</h2>
                <p className="text-orange-100 opacity-90">Llena tu bracket completo para competir.</p>
              </div>
            </div>
          </div>
          <Link to="/mi-polla">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 h-12 text-lg shadow-md border-0">
              Llenar mi Polla <PlayCircle className="ml-2 size-5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="size-8 text-yellow-300" />
              <div className="text-right">
                <div className="text-xs opacity-90 font-medium uppercase">Tu Posición</div>
                <div className="text-4xl font-bold">{userStats.position > 0 ? userStats.position : '-'}</div>
              </div>
            </div>
            <div className="text-sm opacity-90">Ranking Global</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="size-8 text-blue-500" />
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium uppercase">Puntos Totales</div>
                <div className="text-4xl font-bold text-gray-900">{userStats.totalPoints}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Sistema 5-3-1</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium uppercase">Plenos</div>
                <div className="text-4xl font-bold text-gray-900">{userStats.exactMatches}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Marcadores Exactos</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Award className="size-8 text-purple-500" />
              <div className="text-right">
                <div className="text-xs text-gray-500 font-medium uppercase">Aciertos</div>
                <div className="text-4xl font-bold text-gray-900">{userStats.correctWinners}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Resultados</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-bold">Próximos Partidos</h3>
            <Calendar className="size-5 text-orange-500" />
          </div>
          
          {upcomingMatches.length === 0 ? (
             <div className="text-center py-6 text-gray-400">No hay partidos programados.</div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-orange-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Grupo {match.group}
                    </span>
                    <span className="text-xs text-gray-500">
                       {new Date(match.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{match.team1}</span>
                    <span className="text-gray-400 text-sm px-2">vs</span>
                    <span className="text-gray-900 font-medium text-right">{match.team2}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-gray-900 mb-6 font-bold">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link to="/mi-polla">
              <Button 
                className={`w-full justify-between border-2 text-gray-900 hover:border-orange-500 ${
                  !userStats.hasPrediction 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 border-transparent' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{userStats.hasPrediction ? "Ver Mi Predicción" : "Llenar mi Polla"}</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            
            <Link to="/ranking">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Ver Ranking Completo</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/comunidad">
              <Button className="w-full justify-between bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-orange-500">
                <span>Ver Otras Pollas</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/instrucciones">
              <Button variant="ghost" className="w-full justify-between text-gray-500 hover:text-orange-600">
                <span>Sistema de Puntuación</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {userStats.hasPrediction && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="size-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-blue-900 mb-1 font-semibold">
                Predicción Registrada
              </h4>
              <p className="text-sm text-blue-700">
                Tu polla fue enviada el {userStats.submittedAt || 'Recientemente'} y está bloqueada. Los puntos se actualizan automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}