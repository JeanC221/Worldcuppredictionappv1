import { Link, useLocation } from 'react-router-dom';
import { Trophy, ClipboardList, BarChart3, Users, Home, BookOpen, Menu, Shield, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAdmin } from '../hooks/useAdmin';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { NotificationBell } from './NotificationBell';

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Polla Mundialista" 
                  className="max-h-12 max-w-12 object-contain"
                  onError={(e) => {
                    // Fallback si no hay logo
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-[#1E3A5F] leading-tight">Polla Mundialista</h1>
                <p className="text-xs text-slate-500 font-medium">FIFA World Cup 2026</p>
              </div>
            </Link>

            {/* Navegación Desktop - Centrada */}
            <nav className="hidden lg:flex items-center flex-1 justify-center px-8">
              <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-[#1E3A5F] text-white shadow-md'
                          : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-white'
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Acciones de usuario */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-[#E85D24] text-white shadow-md'
                      : 'text-[#E85D24] border-2 border-[#E85D24] hover:bg-[#E85D24] hover:text-white'
                  }`}
                >
                  <Shield className="size-4" />
                  <span className="text-sm">Admin</span>
                </Link>
              )}

              {/* Separador */}
              <div className="w-px h-8 bg-slate-200" />

              {/* Campana de notificaciones */}
              <NotificationBell />

              {/* Avatar del usuario */}
              <Link
                to="/perfil"
                className={`p-1 rounded-full transition-all hover:ring-2 hover:ring-[#1E3A5F]/30 ${
                  location.pathname === '/perfil' ? 'ring-2 ring-[#1E3A5F]' : ''
                }`}
                title="Mi Perfil"
              >
                <Avatar className="size-10 border-2 border-slate-200 hover:border-[#1E3A5F] transition-colors">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Usuario'} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white text-sm font-bold">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationBell />
              <Link to="/perfil" className="p-1">
                <Avatar className="size-9 border-2 border-slate-200">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Usuario'} />
                  <AvatarFallback className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white text-xs font-bold">
                    {getInitial()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>

          {/* Menú móvil */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-200">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-[#1E3A5F] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      location.pathname === '/admin'
                        ? 'bg-[#E85D24] text-white'
                        : 'text-[#E85D24] hover:bg-orange-50'
                    }`}
                  >
                    <Shield className="size-5" />
                    <span>Panel Admin</span>
                  </Link>
                )}

                <Link
                  to="/perfil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    location.pathname === '/perfil'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
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

      {/* Main content - flex-1 para empujar el footer */}
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Trophy className="size-5 text-[#D4A824]" />
              </div>
              <div>
                <div className="text-sm font-semibold">Polla Mundialista 2026</div>
                <div className="text-xs text-slate-300">Sistema de Predicciones Deportivas</div>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              © 2026 Todos los derechos reservados
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
