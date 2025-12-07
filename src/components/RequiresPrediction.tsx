import { Link } from 'react-router-dom';
import { useHasPrediction } from '../hooks/useHasPrediction';
import { useAdmin } from '../hooks/useAdmin';
import { Trophy, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface RequiresPredictionProps {
  children: React.ReactNode;
}

export function RequiresPrediction({ children }: RequiresPredictionProps) {
  const { hasPrediction, loading } = useHasPrediction();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (loading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-[#1E3A5F]" />
      </div>
    );
  }

  // Admin siempre tiene acceso
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasPrediction) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] p-8 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="size-10 text-[#D4A824]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              ¡Primero llena tu Polla!
            </h2>
            <p className="text-slate-300 text-lg mb-2">
              Para acceder a esta sección necesitas completar tus predicciones.
            </p>
          </div>
          
          <CardContent className="p-8 bg-white">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-[#E85D24]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="size-5 text-[#E85D24]" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">¿Cómo funciona?</h3>
                  <p className="text-sm text-slate-600">
                    Predice los resultados de la fase de grupos, octavos, cuartos, semifinales y la final. 
                    Una vez guardes tu polla, podrás ver el ranking y comparar con otros participantes.
                  </p>
                </div>
              </div>
              
              <Link to="/prediccion" className="block">
                <Button className="w-full h-14 bg-gradient-to-r from-[#E85D24] to-[#C44D1A] hover:from-[#C44D1A] hover:to-[#A43D10] text-white rounded-xl text-lg font-semibold shadow-lg">
                  <ClipboardList className="size-5 mr-2" />
                  Llenar mi Polla
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}