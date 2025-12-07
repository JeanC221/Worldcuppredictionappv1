import { getCountryInfo } from '../utils/countryFlags';

interface TeamDisplayProps {
  team: string;
  reverse?: boolean;
  className?: string;
  flagSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFlag?: boolean;
}

// Función para obtener URL de bandera
const getFlagUrl = (countryCode: string): string | null => {
  if (countryCode === 'XX') return null;
  if (countryCode === 'GB-ENG') return 'https://flagcdn.com/w80/gb-eng.png';
  if (countryCode === 'GB-SCT') return 'https://flagcdn.com/w80/gb-sct.png';
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
};

export function TeamDisplay({ 
  team, 
  reverse = false, 
  className = '', 
  flagSize = 'md',
  showFlag = true 
}: TeamDisplayProps) {
  const { code } = getCountryInfo(team);
  
  // Tamaños ajustados para mejor visibilidad
  const sizeClasses = {
    xs: 'w-4 h-3',
    sm: 'w-6 h-4',
    md: 'w-8 h-6',
    lg: 'w-10 h-7',
    xl: 'w-12 h-8'
  };
  
  const flagUrl = getFlagUrl(code);
  
  if (!showFlag) {
    return <span className={className}>{team}</span>;
  }

  const FlagImage = flagUrl ? (
    <img 
      src={flagUrl} 
      alt={team}
      className={`${sizeClasses[flagSize]} object-cover rounded-sm shadow-sm inline-block flex-shrink-0`}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <span className={`${sizeClasses[flagSize]} bg-slate-200 rounded-sm inline-flex items-center justify-center text-xs text-slate-400 flex-shrink-0`}>
      ?
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {reverse ? (
        <>
          <span className="truncate">{team}</span>
          {FlagImage}
        </>
      ) : (
        <>
          {FlagImage}
          <span className="truncate">{team}</span>
        </>
      )}
    </span>
  );
}

export function FlagOnly({ team, size = 'md' }: { team: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const { code } = getCountryInfo(team);
  
  const sizeClasses = {
    xs: 'w-4 h-3',
    sm: 'w-6 h-4',
    md: 'w-8 h-6',
    lg: 'w-10 h-7',
    xl: 'w-12 h-8'
  };
  
  const flagUrl = getFlagUrl(code);
  
  if (!flagUrl) {
    return (
      <span className={`${sizeClasses[size]} bg-slate-200 rounded-sm inline-flex items-center justify-center text-xs text-slate-400`} title={team}>
        ?
      </span>
    );
  }
  
  return (
    <img 
      src={flagUrl} 
      alt={team}
      title={team}
      className={`${sizeClasses[size]} object-cover rounded-sm shadow-sm`}
      loading="lazy"
    />
  );
}