import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { User, LogOut, Trophy, Mail, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { jsPDF } from 'jspdf';
import { Match } from '../utils/types';

export function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        // Obtener predicción del usuario
        const pollaDoc = await getDoc(doc(db, 'polla_completa', user.uid));
        if (pollaDoc.exists()) {
          setUserPrediction(pollaDoc.data());
        }

        // Obtener partidos para el PDF
        const matchesSnap = await getDocs(collection(db, 'partidos'));
        const matchesData: Match[] = matchesSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Match[];
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!userPrediction) return;
    
    setDownloading(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;
      const lineHeight = 7;
      const marginLeft = 15;

      // Título
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(234, 88, 12); // Orange
      pdf.text('Polla Mundialista 2026', pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Subtítulo
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Predicción Oficial', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Línea separadora
      pdf.setDrawColor(234, 88, 12);
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 10;

      // Info del usuario
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Participante:', marginLeft, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(userPrediction.userName || user?.displayName || 'Usuario', marginLeft + 35, y);
      y += lineHeight;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', marginLeft, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(user?.email || 'N/A', marginLeft + 35, y);
      y += lineHeight;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Fecha de envío:', marginLeft, y);
      pdf.setFont('helvetica', 'normal');
      const submittedDate = userPrediction.submittedAt?.toDate?.() 
        ? userPrediction.submittedAt.toDate().toLocaleDateString('es-ES')
        : 'N/A';
      pdf.text(submittedDate, marginLeft + 40, y);
      y += lineHeight;

      // Campeón
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tu Campeón:', marginLeft, y);
      pdf.setTextColor(234, 88, 12);
      pdf.text(`🏆 ${userPrediction.knockoutPicks?.['F-1'] || 'No seleccionado'}`, marginLeft + 35, y);
      y += 15;

      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 10;

      // Predicciones por grupo
      pdf.setFontSize(14);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fase de Grupos', marginLeft, y);
      y += 10;

      // Agrupar partidos
      const groupedMatches: { [group: string]: Match[] } = {};
      matches.forEach(m => {
        if (!groupedMatches[m.group]) groupedMatches[m.group] = [];
        groupedMatches[m.group].push(m);
      });

      const predictions = userPrediction.groupPredictions || {};

      // Ordenar grupos
      const sortedGroups = Object.keys(groupedMatches).sort();

      pdf.setFontSize(9);

      for (const group of sortedGroups) {
        // Verificar si necesitamos nueva página
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }

        // Título del grupo
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text(`Grupo ${group}`, marginLeft, y);
        y += 6;

        pdf.setTextColor(80, 80, 80);
        pdf.setFont('helvetica', 'normal');

        const groupMatches = groupedMatches[group].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (const match of groupMatches) {
          const pred = predictions[match.id];
          const score1 = pred?.score1 ?? '-';
          const score2 = pred?.score2 ?? '-';
          
          const text = `${match.team1} ${score1} - ${score2} ${match.team2}`;
          pdf.text(text, marginLeft + 5, y);
          y += 5;
        }

        y += 5;
      }

      // Fase eliminatoria
      if (y > 240) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fase Eliminatoria', marginLeft, y);
      y += 10;

      pdf.setFontSize(10);
      const knockoutPicks = userPrediction.knockoutPicks || {};
      
      const rounds = [
        { key: 'R32', name: 'Dieciseisavos', count: 16 },
        { key: 'R16', name: 'Octavos de Final', count: 8 },
        { key: 'QF', name: 'Cuartos de Final', count: 4 },
        { key: 'SF', name: 'Semifinales', count: 2 },
        { key: 'F', name: 'Final', count: 1 },
      ];

      for (const round of rounds) {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${round.name}:`, marginLeft, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(50, 50, 50);

        const picks: string[] = [];
        for (let i = 1; i <= round.count; i++) {
          const pick = knockoutPicks[`${round.key}-${i}`];
          if (pick) picks.push(pick);
        }

        if (picks.length > 0) {
          // Dividir en columnas si hay muchos
          const text = picks.join(' | ');
          const lines = pdf.splitTextToSize(text, pageWidth - 2 * marginLeft - 10);
          for (const line of lines) {
            pdf.text(line, marginLeft + 5, y);
            y += 5;
          }
        } else {
          pdf.text('Sin seleccionar', marginLeft + 5, y);
          y += 5;
        }

        y += 3;
      }

      // Footer
      y = pdf.internal.pageSize.getHeight() - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Generado por Polla Mundialista 2026', pageWidth / 2, y, { align: 'center' });

      // Descargar
      const fileName = `polla-mundialista-${userPrediction.userName || 'prediccion'}.pdf`;
      pdf.save(fileName.toLowerCase().replace(/\s+/g, '-'));

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Obtener inicial para el avatar fallback
  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  // Formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin size-10 text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      {/* Tarjeta de perfil principal */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar grande */}
            <Avatar className="size-24 mb-4 border-4 border-orange-200">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Usuario'} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-3xl font-bold">
                {getInitial()}
              </AvatarFallback>
            </Avatar>

            {/* Nombre */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user.displayName || 'Usuario'}
            </h2>

            {/* Email */}
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
              <Mail className="size-4" />
              {user.email}
            </div>

            {/* Badge de estado de predicción */}
            {userPrediction?.isLocked ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                <CheckCircle className="size-4" />
                Predicción enviada
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm">
                <XCircle className="size-4" />
                Predicción pendiente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de la cuenta */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-5 text-orange-500" />
            Información de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">ID de usuario</span>
            <span className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {user.uid.slice(0, 12)}...
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Método de acceso</span>
            <span className="text-gray-900">
              {user.providerData[0]?.providerId === 'google.com' ? '🔵 Google' : '📧 Email'}
            </span>
          </div>
          {userPrediction && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Predicción enviada</span>
                <span className="text-gray-900 text-sm">
                  {formatDate(userPrediction.submittedAt)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tu campeón</span>
                <span className="text-gray-900 font-semibold flex items-center gap-1">
                  🏆 {userPrediction.knockoutPicks?.['F-1'] || 'No seleccionado'}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="size-5 text-orange-500" />
            Acciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userPrediction?.isLocked && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="size-5 animate-spin text-blue-500" />
              ) : (
                <Download className="size-5 text-blue-500" />
              )}
              <div className="text-left">
                <div className="font-medium">
                  {downloading ? 'Generando PDF...' : 'Descargar Predicción'}
                </div>
                <div className="text-xs text-gray-500">Guardar como PDF</div>
              </div>
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="size-5 animate-spin text-red-500" />
            ) : (
              <LogOut className="size-5 text-red-500" />
            )}
            <div className="text-left">
              <div className="font-medium text-red-600">Cerrar Sesión</div>
              <div className="text-xs text-gray-500">Salir de tu cuenta</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}