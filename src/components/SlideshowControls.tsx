import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideshowControlsProps {
  interval: number | null;
  onIntervalChange: (interval: number | null) => void;
}

const intervals: (number | null)[] = [3, 5, 7, 10, 30, null]; // null = off

const SlideshowControls = ({
  interval,
  onIntervalChange,
}: SlideshowControlsProps) => {
  const cycleInterval = () => {
    const currentIndex = intervals.indexOf(interval);
    const nextIndex = (currentIndex + 1) % intervals.length;
    onIntervalChange(intervals[nextIndex]);
  };

  return (
    <button
      onClick={cycleInterval}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-sm transition-all",
        interval === null 
          ? "bg-card/10 hover:bg-card/20 text-card/60"
          : "bg-card/20 hover:bg-card/30 text-card"
      )}
    >
      <Clock className="w-4 h-4" />
      <span className="text-xs font-sans">
        {interval === null ? 'off' : `${interval}s`}
      </span>
    </button>
  );
};

export default SlideshowControls;