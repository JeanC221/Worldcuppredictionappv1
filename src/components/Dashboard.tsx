import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
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
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);

          let submittedAtFormatted: string | undefined;
          if (pollaSnap.exists()) {
            const data = pollaSnap.data();
            if (data.submittedAt) {
              if (data.submittedAt.toDate) {
                submittedAtFormatted = data.submittedAt.toDate().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
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
          const q = query(matchesRef, orderBy('date', 'asc'), limit(5));
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  const firstName = userStats.userName?.split(' ')[0] || 'Participante';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Saludo */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">
          Hola, {firstName}
        </h1>
        <p className="text-[#666]">
          {userStats.hasPrediction
            ? "Tu predicción está registrada. Aquí tienes tu resumen."
            : "Aún no has enviado tu predicción para el Mundial."}
        </p>
      </div>

      {/* CTA si no tiene predicción */}
      {!userStats.hasPrediction && (
        <Link
          to="/mi-polla"
          className="block mb-10 p-6 bg-[#1a1a1a] rounded-xl text-white hover:bg-[#333] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                Completa tu predicción
              </h2>
              <p className="text-white/60">
                Llena todos los partidos del Mundial 2026 y compite por premios.
              </p>
            </div>
            <ArrowRight className="size-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* Stats - Solo si tiene predicción */}
      {userStats.hasPrediction && (
        <div className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <p className="text-sm text-[#999] mb-1">Posición</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {userStats.position > 0 ? `#${userStats.position}` : '—'}
              </p>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <p className="text-sm text-[#999] mb-1">Puntos</p>
              <p className="text-3xl font-bold text-[#E85D24]">
                {userStats.totalPoints}
              </p>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <p className="text-sm text-[#999] mb-1">Exactos</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {userStats.exactMatches}
              </p>
            </div>
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <p className="text-sm text-[#999] mb-1">Acertados</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {userStats.correctWinners}
              </p>
            </div>
          </div>

          {userStats.submittedAt && (
            <p className="mt-4 text-sm text-[#999]">
              Predicción enviada el {userStats.submittedAt}
            </p>
          )}
        </div>
      )}

      {/* Dos columnas */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Próximos partidos */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Próximos partidos</h2>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="bg-white border border-[#eee] rounded-xl p-8 text-center">
              <p className="text-[#999]">No hay partidos programados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((match) => {
                const date = new Date(match.date);
                return (
                  <div
                    key={match.id}
                    className="bg-white border border-[#eee] rounded-xl p-4 flex items-center justify-between hover:border-[#ccc] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[50px]">
                        <p className="text-xs text-[#999] uppercase">
                          {date.toLocaleDateString('es-ES', { month: 'short' })}
                        </p>
                        <p className="text-xl font-bold text-[#1a1a1a]">
                          {date.getDate()}
                        </p>
                      </div>
                      <div className="w-px h-10 bg-[#eee]" />
                      <div>
                        <p className="font-medium text-[#1a1a1a]">
                          {match.team1} <span className="text-[#999] mx-2">vs</span> {match.team2}
                        </p>
                        <p className="text-sm text-[#999]">
                          Grupo {match.group} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Acceso rápido</h2>
          
          <div className="space-y-2">
            <Link
              to="/mi-polla"
              className="flex items-center justify-between p-4 bg-white border border-[#eee] rounded-xl hover:border-[#ccc] transition-colors group"
            >
              <span className="text-[#1a1a1a] font-medium">Ver mi predicción</span>
              <ArrowRight className="size-4 text-[#999] group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/ranking"
              className="flex items-center justify-between p-4 bg-white border border-[#eee] rounded-xl hover:border-[#ccc] transition-colors group"
            >
              <span className="text-[#1a1a1a] font-medium">Ver ranking</span>
              <ArrowRight className="size-4 text-[#999] group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/comunidad"
              className="flex items-center justify-between p-4 bg-white border border-[#eee] rounded-xl hover:border-[#ccc] transition-colors group"
            >
              <span className="text-[#1a1a1a] font-medium">Ver otras pollas</span>
              <ArrowRight className="size-4 text-[#999] group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/instrucciones"
              className="flex items-center justify-between p-4 bg-white border border-[#eee] rounded-xl hover:border-[#ccc] transition-colors group"
            >
              <span className="text-[#1a1a1a] font-medium">Reglas del juego</span>
              <ArrowRight className="size-4 text-[#999] group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}