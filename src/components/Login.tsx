import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Firebase Auth
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface LoginProps {
  onLogin?: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para los formularios
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Login con Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error con Google:", err);
      setError('Error al conectar con Google. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Email/Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error de login:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Si te registraste con Google, usa el botón de Google.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Recuperar contraseña
  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!loginEmail.trim()) {
      setError('Ingresa tu correo electrónico primero.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setSuccessMessage('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
    } catch (err: any) {
      console.error("Error enviando email:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else {
        setError('Error al enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Registro con Email/Password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!registerName.trim()) {
      setError('El nombre es obligatorio.');
      setIsLoading(false);
      return;
    }
    if (registerPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        registerEmail, 
        registerPassword
      );
      
      await updateProfile(userCredential.user, {
        displayName: registerName.trim()
      });

      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error de registro:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este correo. Si usaste Google, inicia sesión con Google.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El registro con email/contraseña no está habilitado.');
      } else {
        setError(`Error: ${err.code || err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          {/* Logo de la app */}
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Polla Mundialista 2026" 
              className="h-20 w-auto drop-shadow-lg"
              onError={(e) => {
                // Fallback si no existe el logo
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Fallback icon si no hay logo */}
            <div 
              className="hidden w-20 h-20 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl items-center justify-center shadow-xl"
            >
              <span className="text-white text-3xl font-bold">PM</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Polla Mundialista 2026</h1>
          <p className="text-slate-500 text-lg">Plataforma de predicciones deportivas</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b-2 border-slate-100 bg-slate-50 p-0 h-14">
              <TabsTrigger 
                value="login" 
                className="rounded-none h-full text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1E3A5F] data-[state=active]:border-b-3 data-[state=active]:border-[#E85D24] data-[state=active]:shadow-none text-slate-500"
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-none h-full text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-[#1E3A5F] data-[state=active]:border-b-3 data-[state=active]:border-[#E85D24] data-[state=active]:shadow-none text-slate-500"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mx-6 mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login" className="p-6 m-0">
              {/* Botón de Google */}
              <div className="mb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full relative h-14 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-semibold text-base transition-all"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 mr-3 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continuar con Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-white px-4 text-slate-400 font-medium">O con correo</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-700 font-medium">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-slate-700 font-medium">
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-[#E85D24] hover:text-[#D54D14] font-medium hover:underline transition-colors"
                      disabled={isLoading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-[#1E3A5F] hover:bg-[#152A45] text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#1E3A5F]/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-5 mr-2 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="p-6 m-0">
              {/* Botón de Google para registro */}
              <div className="mb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full relative h-14 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-semibold text-base transition-all"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 mr-3 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Registrarse con Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-white px-4 text-slate-400 font-medium">O con correo</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-slate-700 font-medium">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-slate-700 font-medium">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-slate-700 font-medium">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl text-base focus:border-[#1E3A5F] focus:ring-[#1E3A5F]/20"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-[#E85D24] hover:bg-[#D54D14] text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#E85D24]/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-5 mr-2 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Security Notice */}
          <div className="bg-[#1E3A5F]/5 border-t-2 border-[#1E3A5F]/10 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="size-5 text-[#1E3A5F]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1E3A5F]">
                  Seguridad y Privacidad
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  Tus datos están protegidos con Firebase Authentication. Nunca compartimos tu información personal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Al continuar, aceptas nuestros términos de servicio</p>
        </div>
      </div>
    </div>
  );
}