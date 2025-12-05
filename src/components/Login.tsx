import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Shield, Lock, Mail, User } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <Trophy className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Polla Mundialista 2026</h1>
          <p className="text-gray-600">Plataforma de predicciones deportivas</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-gray-200 bg-gray-50">
              <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login" className="p-6 m-0">
              {/* Botón de Google */}
              <div className="mb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full relative h-10 border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">O con correo</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-900">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-gray-900">
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-orange-600 hover:text-orange-700 hover:underline"
                      disabled={isLoading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="p-6 m-0">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-gray-900">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-900">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-900">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Security Notice */}
          <div className="bg-blue-50 border-t border-blue-100 px-6 py-4">
            <div className="flex items-start gap-3">
              <Shield className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Seguridad y Privacidad
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Tus datos están protegidos con Firebase Authentication. Nunca compartimos tu información personal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Al continuar, aceptas nuestros términos de servicio</p>
        </div>
      </div>
    </div>
  );
}