// Mapa de equipos del Mundial 2026 a sus códigos de país ISO 3166-1 alpha-2
// y emojis de banderas

export interface CountryInfo {
  code: string;
  emoji: string;
}

export const COUNTRY_FLAGS: { [teamName: string]: CountryInfo } = {
  // Anfitriones
  'México': { code: 'MX', emoji: '🇲🇽' },
  'Estados Unidos': { code: 'US', emoji: '🇺🇸' },
  'Canadá': { code: 'CA', emoji: '🇨🇦' },
  
  // Europa (UEFA)
  'Alemania': { code: 'DE', emoji: '🇩🇪' },
  'España': { code: 'ES', emoji: '🇪🇸' },
  'Francia': { code: 'FR', emoji: '🇫🇷' },
  'Inglaterra': { code: 'GB-ENG', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Portugal': { code: 'PT', emoji: '🇵🇹' },
  'Países Bajos': { code: 'NL', emoji: '🇳🇱' },
  'Bélgica': { code: 'BE', emoji: '🇧🇪' },
  'Croacia': { code: 'HR', emoji: '🇭🇷' },
  'Suiza': { code: 'CH', emoji: '🇨🇭' },
  'Austria': { code: 'AT', emoji: '🇦🇹' },
  'Escocia': { code: 'GB-SCT', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Noruega': { code: 'NO', emoji: '🇳🇴' },
  
  // Sudamérica (CONMEBOL)
  'Argentina': { code: 'AR', emoji: '🇦🇷' },
  'Brasil': { code: 'BR', emoji: '🇧🇷' },
  'Uruguay': { code: 'UY', emoji: '🇺🇾' },
  'Colombia': { code: 'CO', emoji: '🇨🇴' },
  'Ecuador': { code: 'EC', emoji: '🇪🇨' },
  'Paraguay': { code: 'PY', emoji: '🇵🇾' },
  
  // Norte/Centroamérica (CONCACAF)
  'Panamá': { code: 'PA', emoji: '🇵🇦' },
  'Haití': { code: 'HT', emoji: '🇭🇹' },
  'Curazao': { code: 'CW', emoji: '🇨🇼' },
  
  // África (CAF)
  'Marruecos': { code: 'MA', emoji: '🇲🇦' },
  'Senegal': { code: 'SN', emoji: '🇸🇳' },
  'Costa de Marfil': { code: 'CI', emoji: '🇨🇮' },
  'Ghana': { code: 'GH', emoji: '🇬🇭' },
  'Egipto': { code: 'EG', emoji: '🇪🇬' },
  'Sudáfrica': { code: 'ZA', emoji: '🇿🇦' },
  'Argelia': { code: 'DZ', emoji: '🇩🇿' },
  'Túnez': { code: 'TN', emoji: '🇹🇳' },
  'Cabo Verde': { code: 'CV', emoji: '🇨🇻' },
  
  // Asia (AFC)
  'Japón': { code: 'JP', emoji: '🇯🇵' },
  'Corea del Sur': { code: 'KR', emoji: '🇰🇷' },
  'Australia': { code: 'AU', emoji: '🇦🇺' },
  'Irán': { code: 'IR', emoji: '🇮🇷' },
  'Arabia Saudita': { code: 'SA', emoji: '🇸🇦' },
  'Qatar': { code: 'QA', emoji: '🇶🇦' },
  'Uzbekistán': { code: 'UZ', emoji: '🇺🇿' },
  'Jordania': { code: 'JO', emoji: '🇯🇴' },
  
  // Oceanía (OFC)
  'Nueva Zelanda': { code: 'NZ', emoji: '🇳🇿' },
};

// Play-offs pendientes (sin bandera real)
const PLAYOFF_PLACEHOLDER: CountryInfo = { code: 'XX', emoji: '🏳️' };

/**
 * Obtiene la información del país (código y emoji) para un equipo
 * @param teamName Nombre del equipo en español
 * @returns CountryInfo con código y emoji, o placeholder para play-offs
 */
export function getCountryInfo(teamName: string): CountryInfo {
  // Si es un play-off, retornar placeholder
  if (teamName.startsWith('Play-off') || teamName.startsWith('Ganador')) {
    return PLAYOFF_PLACEHOLDER;
  }
  
  return COUNTRY_FLAGS[teamName] || PLAYOFF_PLACEHOLDER;
}

/**
 * Obtiene solo el emoji de la bandera
 */
export function getFlagEmoji(teamName: string): string {
  return getCountryInfo(teamName).emoji;
}