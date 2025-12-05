import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Shield, Lock, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <Trophy className="size-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Polla Mundialista 2026</h1>
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

            {/* Login Tab */}
            <TabsContent value="login" className="p-6 m-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
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
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Juan Pérez"
                    className="bg-gray-50 border-gray-300 text-gray-900"
                    required
                  />
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
                      placeholder="••••••••"
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
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
                <h4 className="text-sm text-blue-900">
                  Seguridad y Privacidad
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Tus datos están protegidos con encriptación de nivel bancario. Nunca compartimos tu información personal.
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
