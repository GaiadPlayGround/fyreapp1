import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, ExternalLink, Share2, Vote, Coins, Users, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

const CONTRACT_ADDRESS = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b';

interface Task {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'redirect' | 'progress' | 'copy';
  url?: string;
  requirement?: number;
  progressKey?: 'votes' | 'shares' | 'referrals';
}

const TASKS: Task[] = [
  { id: 'follow-zora', label: 'Follow FCBC on Zora', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://zora.co/@fcbcc' },
  { id: 'follow-base', label: 'Follow FCBC on Base App', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://farcaster.xyz/warplette' },
  { id: 'follow-x', label: 'Follow FCBC on X', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://x.com/warplette' },
  { id: 'vote-10', label: 'Vote for 10 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 10, progressKey: 'votes' },
  { id: 'vote-25', label: 'Vote for 25 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 25, progressKey: 'votes' },
  { id: 'share-5', label: 'Share 5 species', icon: <Share2 className="w-3.5 h-3.5" />, type: 'progress', requirement: 5, progressKey: 'shares' },
  { id: 'share-25', label: 'Share 25 species', icon: <Share2 className="w-3.5 h-3.5" />, type: 'progress', requirement: 25, progressKey: 'shares' },
  { id: 'refer-3', label: 'Refer 3 people', icon: <Users className="w-3.5 h-3.5" />, type: 'progress', requirement: 3, progressKey: 'referrals' },
  { id: 'refer-5', label: 'Refer 5 people', icon: <Users className="w-3.5 h-3.5" />, type: 'progress', requirement: 5, progressKey: 'referrals' },
  { id: 'buy-coin', label: 'Buy Creator Coin', icon: <Coins className="w-3.5 h-3.5" />, type: 'copy' },
];

const TasksDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clickedRedirects, setClickedRedirects] = useState<Set<string>>(new Set());
  const { votes, shares } = useWallet();
  
  // Mock referrals count - in real app would come from context
  const referrals = 0;

  const getProgress = (key: 'votes' | 'shares' | 'referrals'): number => {
    switch (key) {
      case 'votes': return votes.length;
      case 'shares': return shares;
      case 'referrals': return referrals;
      default: return 0;
    }
  };

  const isTaskCompleted = (task: Task): boolean => {
    if (task.type === 'redirect') {
      return clickedRedirects.has(task.id);
    }
    if (task.type === 'progress' && task.requirement && task.progressKey) {
      return getProgress(task.progressKey) >= task.requirement;
    }
    return false;
  };

  const handleTaskClick = (task: Task) => {
    if (task.type === 'redirect' && task.url) {
      window.open(task.url, '_blank');
      setClickedRedirects(prev => new Set(prev).add(task.id));
    } else if (task.type === 'copy') {
      navigator.clipboard.writeText(CONTRACT_ADDRESS);
      toast({
        title: "Contract Address Copied!",
        description: CONTRACT_ADDRESS,
      });
    }
    // Progress tasks are read-only - they complete automatically
  };

  const completedCount = TASKS.filter(t => isTaskCompleted(t)).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-sans">{completedCount}/{TASKS.length}</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-md shadow-lg animate-fade-in max-h-80 overflow-y-auto z-50">
          <div className="p-3">
            <h3 className="font-serif text-sm font-medium text-foreground mb-3">
              FYRE MISSIONS
            </h3>
            <ul className="space-y-2">
              {TASKS.map((task) => {
                const completed = isTaskCompleted(task);
                const isClickable = task.type === 'redirect' || task.type === 'copy';
                
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => handleTaskClick(task)}
                      disabled={!isClickable && !completed}
                      className={cn(
                        "flex items-center gap-2 w-full text-left group",
                        isClickable && "cursor-pointer",
                        !isClickable && "cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0",
                          completed
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {completed && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-muted-foreground",
                          completed && "opacity-50"
                        )}>
                          {task.type === 'copy' ? <Copy className="w-3.5 h-3.5" /> : task.icon}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-sans",
                            completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          )}
                        >
                          {task.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksDrawer;
