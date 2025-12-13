import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideshowControlsProps {
  isAutoPlay: boolean;
  interval: number;
  onIntervalChange: (interval: number) => void;
}

const intervals = [3, 5, 7, 10];

const SlideshowControls = ({
  isAutoPlay,
  interval,
  onIntervalChange,
}: SlideshowControlsProps) => {
  const cycleInterval = () => {
    const currentIndex = intervals.indexOf(interval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    onIntervalChange(intervals[nextIndex]);
  };

  if (!isAutoPlay) return null;

  return (
    <button
      onClick={cycleInterval}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-sm transition-all",
        "bg-card/20 hover:bg-card/30 text-card"
      )}
    >
      <Clock className="w-4 h-4" />
      <span className="text-xs font-sans">{interval}s</span>
    </button>
  );
};

export default SlideshowControls;
