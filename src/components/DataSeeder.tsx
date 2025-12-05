import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { groupFixtures } from '../utils/mockData';
import { doc, writeBatch } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const DataSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleSeed = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que quieres subir los datos a Firestore? Esto sobrescribirá los partidos existentes con el ID del mock.'
    );
    if (!confirmacion) return;
    
    setLoading(true);
    setStatus('Iniciando carga...');

    try {
      const batch = writeBatch(db);
      let count = 0;

      groupFixtures.forEach((groupData) => {
        groupData.matches.forEach((match) => {
          const matchRef = doc(db, 'partidos', match.id);
          
          const matchData = {
            ...match,
            group: groupData.group, 
            score1: null, 
            score2: null,
            status: 'SCHEDULED', 
            winner: null
          };

          batch.set(matchRef, matchData);
          count++;
        });
      });

      await batch.commit();
      setStatus(`¡Éxito! Se han creado ${count} partidos en la colección 'partidos'.`);
    } catch (error: any) {
      console.error("Error al sembrar datos:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-orange-700 text-sm font-bold uppercase tracking-wider">
            🛠️ Zona de Configuración (Admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <p className="text-xs text-orange-800">
            Tu base de datos está vacía. Usa este botón para subir los partidos del archivo <code>mockData.ts</code>.
          </p>
          <Button 
            onClick={handleSeed} 
            disabled={loading}
            variant="default"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? 'Subiendo datos...' : 'Inicializar Base de Datos'}
          </Button>
          {status && (
            <p className={`text-xs font-bold ${status.includes('Error') ? 'text-red-600' : 'text-green-700'}`}>
              {status}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSeeder;