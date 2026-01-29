import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useHasPrediction } from '../hooks/useHasPrediction';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { NotificationBell } from './NotificationBell';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { hasPrediction } = useHasPrediction();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navItems = [
    { path: '/dashboard', label: 'Inicio' },
    { path: '/prediccion', label: 'Predicción' },
    { path: '/mi-polla', label: 'Mi Polla' },
    { path: '/ranking', label: 'Ranking', requiresPrediction: true },
    { path: '/comunidad', label: 'Comunidad', requiresPrediction: true },
    { path: '/instrucciones', label: 'Reglas' },
  ].filter(item => !item.requiresPrediction || hasPrediction || isAdmin);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-9 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="hidden sm:block font-semibold text-[#1a1a1a]">
                Polla Mundial
              </span>
            </Link>

            {/* Nav Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin')
                      ? 'bg-[#E85D24] text-white'
                      : 'text-[#E85D24] hover:bg-[#E85D24]/10'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <ChevronDown className={`hidden sm:block size-4 text-[#666] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#eee] rounded-lg shadow-lg z-50 py-1">
                      <div className="px-4 py-3 border-b border-[#eee]">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {user?.displayName || 'Usuario'}
                        </p>
                        <p className="text-xs text-[#999] truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/perfil"
                        className="block px-4 py-2.5 text-sm text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                      >
                        Mi perfil
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="size-5 text-[#1a1a1a]" />
                ) : (
                  <Menu className="size-5 text-[#1a1a1a]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#eee] bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#666] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/admin')
                      ? 'bg-[#E85D24] text-white'
                      : 'text-[#E85D24] hover:bg-[#E85D24]/10'
                  }`}
                >
                  Panel Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>

      {/* Footer - Minimalista */}
      <footer className="border-t border-[#eee] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#999]">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-6 w-auto opacity-50"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>Polla Mundialista 2026</span>
            </div>
            <span>© 2026 Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
