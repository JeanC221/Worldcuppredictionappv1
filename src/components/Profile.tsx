import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { User, LogOut, Trophy, Mail, Download, Loader2, CheckCircle, XCircle, Shield, Calendar, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { jsPDF } from 'jspdf';
import { Match } from '../utils/types';

// URL de imagen por defecto para usuarios sin foto
const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/7.x/initials/svg?backgroundColor=1E3A5F&textColor=ffffff&seed=';

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
        const pollaDoc = await getDoc(doc(db, 'polla_completa', user.uid));
        if (pollaDoc.exists()) {
          setUserPrediction(pollaDoc.data());
        }

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

  // Obtener URL del avatar (con fallback a DiceBear)
  const getAvatarUrl = () => {
    if (user?.photoURL) return user.photoURL;
    // Generar avatar con iniciales usando DiceBear
    const name = user?.displayName || user?.email || 'User';
    return `${DEFAULT_AVATAR_URL}${encodeURIComponent(name)}`;
  };

  const handleDownloadPDF = async () => {
    if (!userPrediction) return;
    
    setDownloading(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 0;
      const marginLeft = 15;
      const marginRight = 15;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Colores actualizados
      const navy = { r: 30, g: 58, b: 95 };
      const orange = { r: 232, g: 93, b: 36 };
      const gold = { r: 212, g: 168, b: 36 };
      const darkGray = { r: 55, g: 65, b: 81 };
      const lightGray = { r: 156, g: 163, b: 175 };
      const greenBg = { r: 220, g: 252, b: 231 };
      const greenText = { r: 22, g: 101, b: 52 };

      // Helper para dibujar rectángulo redondeado
      const roundedRect = (x: number, yPos: number, w: number, h: number, r: number, fill: {r: number, g: number, b: number}) => {
        pdf.setFillColor(fill.r, fill.g, fill.b);
        pdf.roundedRect(x, yPos, w, h, r, r, 'F');
      };

      // Helper para nueva página si es necesario
      const checkNewPage = (needed: number) => {
        if (y + needed > pageHeight - 20) {
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      // ========== HEADER ==========
      roundedRect(0, 0, pageWidth, 55, 0, navy);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POLLA MUNDIALISTA', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('FIFA World Cup 2026', pageWidth / 2, 38, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Prediccion Oficial', pageWidth / 2, 48, { align: 'center' });

      y = 70;

      // ========== TARJETA DE USUARIO ==========
      roundedRect(marginLeft, y, contentWidth, 45, 4, { r: 249, g: 250, b: 251 });
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(marginLeft, y, contentWidth, 45, 4, 4, 'S');

      // Avatar círculo
      pdf.setFillColor(navy.r, navy.g, navy.b);
      pdf.circle(marginLeft + 20, y + 22, 12, 'F');
      
      // Inicial del usuario
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const initial = (userPrediction.userName || user?.displayName || 'U').charAt(0).toUpperCase();
      pdf.text(initial, marginLeft + 20, y + 27, { align: 'center' });

      // Nombre y email
      pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(userPrediction.userName || user?.displayName || 'Usuario', marginLeft + 40, y + 18);
      
      pdf.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(user?.email || 'N/A', marginLeft + 40, y + 28);

      // Fecha de envío
      const submittedDate = userPrediction.submittedAt?.toDate?.() 
        ? userPrediction.submittedAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'N/A';
      pdf.text(`Enviado: ${submittedDate}`, marginLeft + 40, y + 38);

      y += 55;

      // ========== CAMPEÓN ==========
      roundedRect(marginLeft, y, contentWidth, 30, 4, greenBg);
      
      pdf.setTextColor(greenText.r, greenText.g, greenText.b);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TU CAMPEON PREDICHO', marginLeft + 10, y + 12);
      
      pdf.setFontSize(16);
      const champion = userPrediction.knockoutPicks?.['F-1'] || 'No seleccionado';
      pdf.text(`${champion}`, marginLeft + 10, y + 24);

      y += 40;

      // ========== FASE DE GRUPOS ==========
      pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FASE DE GRUPOS', marginLeft, y);
      
      pdf.setDrawColor(orange.r, orange.g, orange.b);
      pdf.setLineWidth(2);
      pdf.line(marginLeft, y + 4, marginLeft + 50, y + 4);

      y += 15;

      // Agrupar partidos
      const groupedMatches: { [group: string]: Match[] } = {};
      matches.forEach(m => {
        if (!groupedMatches[m.group]) groupedMatches[m.group] = [];
        groupedMatches[m.group].push(m);
      });

      const predictions = userPrediction.groupPredictions || {};
      const sortedGroups = Object.keys(groupedMatches).sort();

      // Dibujar grupos en grid de 2 columnas
      const colWidth = (contentWidth - 10) / 2;
      let col = 0;
      let rowY = y;

      for (let i = 0; i < sortedGroups.length; i++) {
        const group = sortedGroups[i];
        const groupMatches = groupedMatches[group].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const boxHeight = 10 + (groupMatches.length * 8) + 5;
        
        // Verificar nueva página
        if (col === 0) {
          checkNewPage(boxHeight + 5);
          rowY = y;
        }

        const xPos = marginLeft + (col * (colWidth + 10));

        // Fondo del grupo
        roundedRect(xPos, rowY, colWidth, boxHeight, 3, { r: 255, g: 255, b: 255 });
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(xPos, rowY, colWidth, boxHeight, 3, 3, 'S');

        // Header del grupo
        roundedRect(xPos, rowY, colWidth, 10, 3, navy);
        // Arreglar esquinas inferiores del header
        pdf.setFillColor(navy.r, navy.g, navy.b);
        pdf.rect(xPos, rowY + 7, colWidth, 3, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`GRUPO ${group}`, xPos + 5, rowY + 7);

        // Partidos
        pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        let matchY = rowY + 16;
        for (const match of groupMatches) {
          const pred = predictions[match.id];
          const score1 = pred?.score1 ?? '-';
          const score2 = pred?.score2 ?? '-';
          
          // Equipo 1 (alineado a la derecha)
          const team1Short = match.team1.length > 12 ? match.team1.substring(0, 11) + '.' : match.team1;
          pdf.text(team1Short, xPos + colWidth/2 - 18, matchY, { align: 'right' });
          
          // Score
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${score1} - ${score2}`, xPos + colWidth/2, matchY, { align: 'center' });
          pdf.setFont('helvetica', 'normal');
          
          // Equipo 2 (alineado a la izquierda)
          const team2Short = match.team2.length > 12 ? match.team2.substring(0, 11) + '.' : match.team2;
          pdf.text(team2Short, xPos + colWidth/2 + 18, matchY);

          matchY += 8;
        }

        col++;
        if (col >= 2) {
          col = 0;
          y = rowY + boxHeight + 5;
        }
      }

      // Ajustar Y si terminamos en columna impar
      if (col !== 0) {
        y = rowY + 60;
      }

      y += 10;

      // ========== FASE ELIMINATORIA ==========
      checkNewPage(80);

      pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FASE ELIMINATORIA', marginLeft, y);
      
      pdf.setDrawColor(orange.r, orange.g, orange.b);
      pdf.setLineWidth(2);
      pdf.line(marginLeft, y + 4, marginLeft + 60, y + 4);

      y += 15;

      const knockoutPicks = userPrediction.knockoutPicks || {};
      
      const rounds = [
        { key: 'R32', name: 'Dieciseisavos de Final', count: 16, cols: 4 },
        { key: 'R16', name: 'Octavos de Final', count: 8, cols: 4 },
        { key: 'QF', name: 'Cuartos de Final', count: 4, cols: 4 },
        { key: 'SF', name: 'Semifinales', count: 2, cols: 2 },
        { key: 'F', name: 'Final', count: 1, cols: 1 },
      ];

      for (const round of rounds) {
        const picks: string[] = [];
        for (let i = 1; i <= round.count; i++) {
          const pick = knockoutPicks[`${round.key}-${i}`];
          if (pick) picks.push(pick);
        }

        if (picks.length === 0) continue;

        const rowsNeeded = Math.ceil(picks.length / round.cols);
        const boxHeight = 12 + (rowsNeeded * 12);
        
        checkNewPage(boxHeight + 10);

        // Header de la ronda
        roundedRect(marginLeft, y, contentWidth, boxHeight, 4, { r: 249, g: 250, b: 251 });
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(marginLeft, y, contentWidth, boxHeight, 4, 4, 'S');

        pdf.setTextColor(orange.r, orange.g, orange.b);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(round.name.toUpperCase(), marginLeft + 5, y + 9);

        // Equipos en grid
        pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        const itemWidth = contentWidth / round.cols;
        let itemY = y + 18;
        let itemCol = 0;

        for (const pick of picks) {
          const xPos = marginLeft + (itemCol * itemWidth) + 5;
          
          // Bullet point
          pdf.setFillColor(orange.r, orange.g, orange.b);
          pdf.circle(xPos + 2, itemY - 2, 1.5, 'F');
          
          const pickShort = pick.length > 18 ? pick.substring(0, 17) + '.' : pick;
          pdf.text(pickShort, xPos + 7, itemY);

          itemCol++;
          if (itemCol >= round.cols) {
            itemCol = 0;
            itemY += 12;
          }
        }

        y += boxHeight + 8;
      }

      // ========== FOOTER ==========
      const footerY = pageHeight - 12;
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);

      pdf.setTextColor(lightGray.r, lightGray.g, lightGray.b);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Polla Mundialista 2026 - Documento generado automaticamente', pageWidth / 2, footerY, { align: 'center' });

      // Descargar
      const fileName = `polla-mundialista-${(userPrediction.userName || 'prediccion').toLowerCase().replace(/\s+/g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

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
      <div className="flex flex-col h-[60vh] items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin size-12 text-[#1E3A5F] mb-4" />
        <p className="text-slate-500 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] rounded-2xl flex items-center justify-center shadow-lg">
          <User className="size-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-slate-500 mt-1">Gestiona tu cuenta y predicciones</p>
        </div>
      </div>

      {/* Tarjeta de perfil principal */}
      <Card className="mb-6 border-0 shadow-lg rounded-2xl overflow-hidden">
        {/* Banner decorativo */}
        <div className="h-24 bg-gradient-to-r from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F]" />
        
        <CardContent className="pt-0 pb-8 -mt-12">
          <div className="flex flex-col items-center text-center">
            {/* Avatar grande con borde */}
            <Avatar className="size-28 mb-4 border-4 border-white shadow-xl ring-4 ring-[#1E3A5F]/20">
              <AvatarImage 
                src={getAvatarUrl()} 
                alt={user.displayName || 'Usuario'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] text-white text-4xl font-bold">
                {getInitial()}
              </AvatarFallback>
            </Avatar>

            {/* Nombre */}
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {user.displayName || 'Usuario'}
            </h2>

            {/* Email */}
            <div className="flex items-center gap-2 text-slate-500 mb-5">
              <Mail className="size-4" />
              <span>{user.email}</span>
            </div>

            {/* Badge de estado de predicción */}
            {userPrediction?.isLocked ? (
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl font-semibold">
                <CheckCircle className="size-5" />
                Predicción enviada
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-5 py-2.5 rounded-xl font-semibold">
                <XCircle className="size-5" />
                Predicción pendiente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de la cuenta */}
      <Card className="mb-6 border-0 shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
              <Shield className="size-5 text-[#1E3A5F]" />
            </div>
            Información de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Hash className="size-4 text-slate-400" />
              <span className="text-slate-600">ID de usuario</span>
            </div>
            <span className="text-slate-900 font-mono text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              {user.uid.slice(0, 12)}...
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <User className="size-4 text-slate-400" />
              <span className="text-slate-600">Método de acceso</span>
            </div>
            <span className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
              user.providerData[0]?.providerId === 'google.com' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
            </span>
          </div>

          {userPrediction && (
            <>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-slate-400" />
                  <span className="text-slate-600">Predicción enviada</span>
                </div>
                <span className="text-slate-900 text-sm font-medium">
                  {formatDate(userPrediction.submittedAt)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#D4A824]/10 to-[#D4A824]/5 rounded-xl border-2 border-[#D4A824]/20">
                <div className="flex items-center gap-3">
                  <Trophy className="size-5 text-[#D4A824]" />
                  <span className="text-slate-700 font-medium">Tu campeón</span>
                </div>
                <span className="text-[#1E3A5F] font-bold text-lg">
                  {userPrediction.knockoutPicks?.['F-1'] || 'No seleccionado'}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E85D24]/10 rounded-xl flex items-center justify-center">
              <Download className="size-5 text-[#E85D24]" />
            </div>
            Acciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userPrediction?.isLocked && (
            <Button
              variant="outline"
              className="w-full justify-start gap-4 h-16 rounded-xl border-2 border-slate-200 hover:border-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-all"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-[#1E3A5F]" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center">
                  <Download className="size-6 text-[#1E3A5F]" />
                </div>
              )}
              <div className="text-left">
                <div className="font-semibold text-slate-900">
                  {downloading ? 'Generando PDF...' : 'Descargar Predicción'}
                </div>
                <div className="text-sm text-slate-500">Guardar como PDF para compartir</div>
              </div>
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start gap-4 h-16 rounded-xl border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <LogOut className="size-6 text-red-500" />
              </div>
            )}
            <div className="text-left">
              <div className="font-semibold text-red-600">Cerrar Sesión</div>
              <div className="text-sm text-slate-500">Salir de tu cuenta de forma segura</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}