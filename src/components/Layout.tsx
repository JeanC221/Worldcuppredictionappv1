import { Link, useLocation } from 'react-router-dom';
import { Trophy, ClipboardList, BarChart3, Users, Home, BookOpen, Menu, Shield, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAdmin } from '../hooks/useAdmin';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Obtener inicial para el avatar fallback
  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/prediccion', label: 'Predicción', icon: ClipboardList },
    { path: '/mi-polla', label: 'Mi Polla', icon: Trophy },
    { path: '/ranking', label: 'Ranking', icon: BarChart3 },
    { path: '/comunidad', label: 'Comunidad', icon: Users },
    { path: '/instrucciones', label: 'Instrucciones', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="size-6 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-base text-gray-900 leading-none">Polla Mundialista</h1>
                <p className="text-xs text-gray-500">FIFA 2026</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <Shield className="size-4" />
                  <span className="text-sm">Admin</span>
                </Link>
              )}

              {/* Avatar del usuario */}
              <Link
                to="/perfil"
                className={`ml-2 p-1 rounded-full transition-all hover:ring-2 hover:ring-orange-300 ${
                  location.pathname === '/perfil' ? 'ring-2 ring-orange-500' : ''
                }`}
                title="Mi Perfil"
              >
                <Avatar className="size-9 border-2 border-gray-200 hover:border-orange-300 transition-colors">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Usuario'} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              {/* Avatar móvil */}
              <Link to="/perfil" className="p-1">
                <Avatar className="size-8 border-2 border-gray-200">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Usuario'} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="border-gray-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === '/admin'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Shield className="size-5" />
                    <span>Panel Admin</span>
                  </Link>
                )}

                {/* Perfil en menú móvil */}
                <Link
                  to="/perfil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/perfil'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="size-5" />
                  <span>Mi Perfil</span>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="size-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-900">Polla Mundialista 2026</div>
                <div className="text-xs text-gray-500">Sistema de Predicciones Deportivas</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 Todos los derechos reservados
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
