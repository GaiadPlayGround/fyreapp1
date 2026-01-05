import { ExternalLink } from 'lucide-react';
import { Species, getStatusColor } from '@/data/species';
import { cn } from '@/lib/utils';
import ElectricBorder from './ElectricBorder';
import { getHabitatColor } from '@/utils/habitatColors';

interface SpeciesCardProps {
  species: Species;
  onClick: () => void;
  compact?: boolean;
  animationEnabled?: boolean;
}

const SpeciesCard = ({ species, onClick, compact = false, animationEnabled = true }: SpeciesCardProps) => {
  const borderColor = getHabitatColor(species.region, species.id);

  const content = (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg cursor-pointer bg-muted active:scale-[0.98] transition-transform",
        compact ? "aspect-square" : "aspect-[4/5]",
        !animationEnabled && "border border-border"
      )}
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
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end",
          compact ? "p-1.5" : "p-3"
        )}
      >
        {/* Species info */}
        <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3
            className={cn(
              "font-serif font-semibold text-card leading-tight",
              compact ? "text-[10px] mb-0.5 line-clamp-1" : "text-sm sm:text-base mb-1"
            )}
          >
            {species.name}
          </h3>

          <div className="flex items-center gap-1">
            {/* Status badge */}
            <span
              className={cn(
                "rounded-sm font-sans font-medium",
                compact ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[10px]",
                getStatusColor(species.status),
                species.status === 'CR' ? 'text-card' : 'text-foreground'
              )}
            >
              {species.status}
            </span>

            {/* Ticker */}
            <span
              className={cn(
                "font-sans text-card/80",
                compact ? "text-[7px]" : "text-[10px]"
              )}
            >
              {species.ticker}
            </span>
          </div>
        </div>

        {/* FCBC Link - hide on compact */}
        {!compact && (
          <a
            href="https://fcbc.fun/gallery"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 p-1.5 bg-card/10 backdrop-blur-sm rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card/20"
          >
            <ExternalLink className="w-3 h-3 text-card" />
          </a>
        )}
      </div>
    </div>
  );

  if (!animationEnabled) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <ElectricBorder
      color={borderColor}
      speed={0.8}
      chaos={0.08}
      borderRadius={8}
      className="w-full"
    >
      {content}
    </ElectricBorder>
  );
};

export default SpeciesCard;
