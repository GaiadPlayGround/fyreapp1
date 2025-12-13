import { Clock, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideshowControlsProps {
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  interval: number;
  onIntervalChange: (interval: number) => void;
}

const intervals = [3, 5, 7, 10];

const SlideshowControls = ({
  isAutoPlay,
  onToggleAutoPlay,
  interval,
  onIntervalChange,
}: SlideshowControlsProps) => {
  const cycleInterval = () => {
    const currentIndex = intervals.indexOf(interval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    onIntervalChange(intervals[nextIndex]);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Clock / Interval control */}
      <button
        onClick={cycleInterval}
        disabled={!isAutoPlay}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-sm transition-all",
          isAutoPlay
            ? "bg-card/20 hover:bg-card/30 text-card"
            : "bg-card/10 text-card/50 cursor-not-allowed"
        )}
      >
        <Clock className="w-4 h-4" />
        <span className="text-xs font-sans">{interval}s</span>
      </button>

      {/* Lock / Unlock control */}
      <button
        onClick={onToggleAutoPlay}
        className={cn(
          "p-2 rounded-full backdrop-blur-sm transition-all",
          isAutoPlay
            ? "bg-primary/80 text-primary-foreground hover:bg-primary"
            : "bg-card/20 text-card hover:bg-card/30"
        )}
      >
        {isAutoPlay ? (
          <Unlock className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default SlideshowControls;
