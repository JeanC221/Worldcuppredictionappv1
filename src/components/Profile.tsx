import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, LogOut, Check } from 'lucide-react';

interface UserStats {
  totalPoints: number;
  exactMatches: number;
  correctWinners: number;
  position: number;
  hasPrediction: boolean;
  submittedAt?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    exactMatches: 0,
    correctWinners: 0,
    position: 0,
    hasPrediction: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        setPhotoURL(user.photoURL || '');

        try {
          // Cargar datos de la polla
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);

          if (pollaSnap.exists()) {
            const data = pollaSnap.data();
            let submittedAtFormatted: string | undefined;
            
            if (data.submittedAt?.toDate) {
              submittedAtFormatted = data.submittedAt.toDate().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
            }

            setStats({
              totalPoints: data.totalPoints || 0,
              exactMatches: data.exactMatches || 0,
              correctWinners: data.correctWinners || 0,
              position: data.position || 0,
              hasPrediction: true,
              submittedAt: submittedAtFormatted
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#999]" />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Mi Perfil</h1>
        <p className="text-[#666]">Administra tu cuenta y preferencias</p>
      </div>

      {/* Avatar y nombre */}
      <div className="bg-white border border-[#eee] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {photoURL ? (
              <img src={photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <p className="text-xl font-semibold text-[#1a1a1a]">
              {displayName || 'Sin nombre'}
            </p>
            <p className="text-[#666]">{email}</p>
            {stats.submittedAt && (
              <p className="text-sm text-[#999] mt-1">
                Participando desde {stats.submittedAt}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.hasPrediction && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-[#eee] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#E85D24]">{stats.totalPoints}</p>
            <p className="text-xs text-[#999]">Puntos</p>
          </div>
          <div className="bg-white border border-[#eee] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#1a1a1a]">
              {stats.position > 0 ? `#${stats.position}` : '—'}
            </p>
            <p className="text-xs text-[#999]">Posición</p>
          </div>
          <div className="bg-white border border-[#eee] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.exactMatches}</p>
            <p className="text-xs text-[#999]">Exactos</p>
          </div>
          <div className="bg-white border border-[#eee] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.correctWinners}</p>
            <p className="text-xs text-[#999]">Ganador</p>
          </div>
        </div>
      )}

      {/* Editar nombre */}
      <div className="bg-white border border-[#eee] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Información</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e0e0e0] rounded-xl text-[#999] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[#999]">El email no se puede cambiar</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full py-3 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-[#333] disabled:bg-[#ccc] transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="size-4" />
              Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>

      {/* Cerrar sesión */}
      <div className="bg-white border border-[#eee] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Sesión</h2>
        <p className="text-sm text-[#666] mb-4">
          Cierra tu sesión en este dispositivo
        </p>
        <button
          onClick={handleSignOut}
          className="w-full py-3 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}