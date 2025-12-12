import { ExternalLink } from 'lucide-react';
import { Species, getStatusColor } from '@/data/species';
import { cn } from '@/lib/utils';

interface SpeciesCardProps {
  species: Species;
  onClick: () => void;
}

const SpeciesCard = ({ species, onClick }: SpeciesCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-[4/5] overflow-hidden rounded-sm cursor-pointer bg-muted"
    >
      {/* Image */}
      <img
        src={species.image}
        alt={species.name}
        className="w-full h-full object-cover card-zoom group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

      {/* Content overlay */}
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        {/* Species info */}
        <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-serif text-sm sm:text-base font-semibold text-card leading-tight mb-1">
            {species.name}
          </h3>
          
          <div className="flex items-center gap-2 text-xs">
            {/* Status badge */}
            <span className={cn(
              "px-1.5 py-0.5 rounded-sm text-[10px] font-sans font-medium",
              getStatusColor(species.status),
              species.status === 'CR' ? 'text-card' : 'text-foreground'
            )}>
              {species.status}
            </span>
            
            {/* Ticker */}
            <span className="font-sans text-card/80 text-[10px]">
              {species.ticker}
            </span>
          </div>
        </div>

        {/* FCBC Link */}
        <a
          href="https://fcbc.fun/gallery"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-1.5 bg-card/10 backdrop-blur-sm rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/20"
        >
          <ExternalLink className="w-3 h-3 text-card" />
        </a>
      </div>
    </div>
  );
};

export default SpeciesCard;