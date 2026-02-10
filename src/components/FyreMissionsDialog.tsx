import { useState, useEffect } from 'react';
import { Check, ExternalLink, Share2, Vote, Coins, Users, Copy, Headphones, ShoppingCart, Twitter, Flame, X, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useWalletDb } from '@/hooks/useWalletDb';

const CONTRACT_ADDRESS = '0x17d8d3c956a9b2d72257d7c9624cfcfd8ba8672b';

interface Task {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'redirect' | 'progress' | 'copy' | 'share';
  url?: string;
  requirement?: number;
  progressKey?: 'votes' | 'shares' | 'referrals' | 'genomes' | 'dna';
}

const formatNumber = (num: number): string => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const TASKS: (Task & { keys: number })[] = [
  { id: 'follow-zora', label: 'Follow FCBC on Zora', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://zora.co/@fcbcc', keys: 10 },
  { id: 'follow-base', label: 'Follow FCBC on Base App', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://base.app/profile/0xD7305c73f62B7713B74316613795C77E814Dea0f', keys: 10 },
  { id: 'follow-x', label: 'Follow FCBC on X', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://x.com/warplette', keys: 10 },
  { id: 'follow-farcaster', label: 'Follow on Farcaster', icon: <ExternalLink className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://farcaster.xyz/warplette', keys: 10 },
  { id: 'listen-ama', label: 'Listen to Founders AMA', icon: <Headphones className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://x.com/i/status/2007512266556702973', keys: 10 },
  { id: 'buy-enzyme', label: 'Buy 100+ Enzyme Consumables', icon: <ShoppingCart className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://opensea.io/collection/fcbrwa-enzyme', keys: 100 },
  { id: 'buy-dna', label: 'Buy your 1st DNA token', icon: <Coins className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://zora.co/@fcbcc', keys: 100 },
  { id: 'invite-10', label: 'Invite 10 people to FyreApp 0', icon: <Users className="w-3.5 h-3.5" />, type: 'redirect', url: 'https://fyreapp0.lovable.app/', keys: 250 },
  { id: 'fyre-posting', label: 'Start #FyreBasePosting!', icon: <Twitter className="w-3.5 h-3.5" />, type: 'share', keys: 10 },
  { id: 'vote-10', label: 'Vote for 10 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 10, progressKey: 'votes', keys: 10 },
  { id: 'vote-25', label: 'Vote for 25 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 25, progressKey: 'votes', keys: 25 },
  { id: 'vote-50', label: 'Vote for 50 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 50, progressKey: 'votes', keys: 50 },
  { id: 'vote-100', label: 'Vote for 100 species', icon: <Vote className="w-3.5 h-3.5" />, type: 'progress', requirement: 100, progressKey: 'votes', keys: 100 },
  { id: 'share-5', label: 'Share 5 species', icon: <Share2 className="w-3.5 h-3.5" />, type: 'progress', requirement: 5, progressKey: 'shares', keys: 5 },
  { id: 'share-25', label: 'Share 25 species', icon: <Share2 className="w-3.5 h-3.5" />, type: 'progress', requirement: 25, progressKey: 'shares', keys: 25 },
  { id: 'share-50', label: 'Share 50 species', icon: <Share2 className="w-3.5 h-3.5" />, type: 'progress', requirement: 50, progressKey: 'shares', keys: 50 },
  { id: 'refer-3', label: 'Refer 3 people', icon: <Users className="w-3.5 h-3.5" />, type: 'progress', requirement: 3, progressKey: 'referrals', keys: 30 },
  { id: 'refer-5', label: 'Refer 5 people', icon: <Users className="w-3.5 h-3.5" />, type: 'progress', requirement: 5, progressKey: 'referrals', keys: 50 },
  { id: 'genome-10', label: 'Own 10 genomes', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 10, progressKey: 'genomes', keys: 100 },
  { id: 'genome-25', label: 'Own 25 genomes', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 25, progressKey: 'genomes', keys: 25 },
  { id: 'genome-50', label: 'Own 50 genomes', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 50, progressKey: 'genomes', keys: 50 },
  { id: 'genome-100', label: 'Own 100 genomes', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 100, progressKey: 'genomes', keys: 1000 },
  { id: 'dna-100m', label: '100M DNA units', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 100000000, progressKey: 'dna', keys: 100 },
  { id: 'dna-500m', label: '500M DNA units', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 500000000, progressKey: 'dna', keys: 500 },
  { id: 'dna-1b', label: '1B DNA units', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 1000000000, progressKey: 'dna', keys: 1000 },
  { id: 'dna-10b', label: '10B DNA units', icon: <Coins className="w-3.5 h-3.5" />, type: 'progress', requirement: 10000000000, progressKey: 'dna', keys: 10000 },
  { id: 'buy-coin', label: 'Buy Creator Coin', icon: <Coins className="w-3.5 h-3.5" />, type: 'copy', keys: 500 },
];

interface FyreMissionsDialogProps {
  children: React.ReactNode;
}

const FyreMissionsDialog = ({ children }: FyreMissionsDialogProps) => {
  const [clickedRedirects, setClickedRedirects] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const { votes, shares, ownedGenomes, totalDnaTokens, address, isConnected, refreshFyreKeys, refreshCompletedTasksCount, fyreKeys } = useWallet();
  const walletDb = useWalletDb();
  
  // Get referrals from localStorage (invited users)
  const getReferralCount = (): number => {
    try {
      const inviteCode = localStorage.getItem('fyreapp-invite-code');
      if (!inviteCode) return 0;
      // In a real app, this would query the database for users invited by this code
      return 0;
    } catch {
      return 0;
    }
  };
  
  const referrals = getReferralCount();
  const genomes = ownedGenomes || 0;
  const dna = totalDnaTokens || 0;

  const getProgress = (key: 'votes' | 'shares' | 'referrals' | 'genomes' | 'dna'): number => {
    switch (key) {
      case 'votes': return votes.length;
      case 'shares': return shares;
      case 'referrals': return referrals;
      case 'genomes': return genomes;
      case 'dna': return dna;
      default: return 0;
    }
  };

  // Load task completions from database
  useEffect(() => {
    if (isConnected && address) {
      walletDb.getTaskCompletions(address).then((completions) => {
        setCompletedTasks(completions);
      });
    }
  }, [isConnected, address, walletDb.getTaskCompletions]);

  // Check for progress task completions whenever progress values change
  useEffect(() => {
    if (!isConnected || !address) return;

    const checkProgressTasks = async () => {
      const progressTasks = TASKS.filter(t => t.type === 'progress' && t.requirement && t.progressKey);
      
      for (const task of progressTasks) {
        // Skip if already completed
        if (completedTasks.has(task.id)) continue;
        
        const progress = getProgress(task.progressKey!);
        const isMet = progress >= task.requirement!;
        
        if (isMet) {
          const result = await walletDb.completeTask(address, task.id, 10);
          if (result.success) {
            setCompletedTasks(prev => new Set(prev).add(task.id));
            await refreshFyreKeys();
            await refreshCompletedTasksCount();
            toast({
              title: "Task Completed!",
              description: `+10 Fyre Keys awarded for: ${task.label}`,
              duration: 3000,
            });
          }
        }
      }
    };

    checkProgressTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes.length, shares, genomes, dna, isConnected, address]);

  const isTaskCompleted = (task: Task): boolean => {
    // First check database for permanent completion
    if (completedTasks.has(task.id)) {
      return true;
    }
    
    // For redirect/share tasks, check local state (will be saved to DB on click)
    if (task.type === 'redirect' || task.type === 'share') {
      return clickedRedirects.has(task.id);
    }
    
    // For progress tasks, check if requirement is met
    // (Completion is handled in useEffect to avoid async calls during render)
    if (task.type === 'progress' && task.requirement && task.progressKey) {
      const progress = getProgress(task.progressKey);
      return progress >= task.requirement;
    }
    
    return false;
  };

  const handleTaskClick = async (task: Task) => {
    // Check if wallet is connected
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to complete tasks.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check if already completed
    if (completedTasks.has(task.id)) {
      return; // Already completed, do nothing
    }

    try {
      if (task.type === 'redirect' && task.url) {
        window.open(task.url, '_blank');
        setClickedRedirects(prev => new Set(prev).add(task.id));
        
        // Record completion in database
        const result = await walletDb.completeTask(address, task.id, 10);
        if (result.success) {
          setCompletedTasks(prev => new Set(prev).add(task.id));
          await refreshFyreKeys();
          await refreshCompletedTasksCount();
          if (!result.alreadyCompleted) {
            toast({
              title: "Task Completed!",
              description: `+10 Fyre Keys awarded for: ${task.label}`,
              duration: 3000,
            });
          }
        } else {
          toast({
            title: "Error Completing Task",
            description: result.error || "Failed to save task completion. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      } else if (task.type === 'share') {
        const shareText = `I'm exploring endangered species and bio-RWAs with the FCBC Club! 🧬

DNA Markets are the new class of tokens representing real-world biodiversity.

Join the movement: https://fcbc.fun

#FyreBasePosting #FCBC #bioRWA`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        setClickedRedirects(prev => new Set(prev).add(task.id));
        
        // Record completion in database
        const result = await walletDb.completeTask(address, task.id, 10);
        if (result.success) {
          setCompletedTasks(prev => new Set(prev).add(task.id));
          await refreshFyreKeys();
          await refreshCompletedTasksCount();
          if (!result.alreadyCompleted) {
            toast({
              title: "Task Completed!",
              description: `+10 Fyre Keys awarded for: ${task.label}`,
              duration: 3000,
            });
          }
        } else {
          toast({
            title: "Error Completing Task",
            description: result.error || "Failed to save task completion. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      } else if (task.type === 'copy') {
        try {
          await navigator.clipboard.writeText(CONTRACT_ADDRESS);
          toast({
            title: "Contract Address Copied!",
            description: CONTRACT_ADDRESS,
            duration: 2000,
          });
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          toast({
            title: "Copy Failed",
            description: "Please copy the address manually: " + CONTRACT_ADDRESS,
            variant: "destructive",
            duration: 3000,
          });
        }
        
        // Record completion in database
        const result = await walletDb.completeTask(address, task.id, 10);
        if (result.success) {
          setCompletedTasks(prev => new Set(prev).add(task.id));
          await refreshFyreKeys();
          await refreshCompletedTasksCount();
          if (!result.alreadyCompleted) {
            toast({
              title: "Task Completed!",
              description: `+10 Fyre Keys awarded for: ${task.label}`,
              duration: 3000,
            });
          }
        } else {
          toast({
            title: "Error Completing Task",
            description: result.error || "Failed to save task completion. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      console.error('Error in handleTaskClick:', error);
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getProgressDisplay = (task: Task): string | null => {
    if (task.type !== 'progress' || !task.requirement || !task.progressKey) return null;
    const current = getProgress(task.progressKey);
    return `${formatNumber(current)}/${formatNumber(task.requirement)}`;
  };

  const completedCount = TASKS.filter(t => isTaskCompleted(t)).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Flame className="w-5 h-5 text-primary" />
            FYRE TASKS
            <span className="text-sm text-muted-foreground font-sans ml-auto">
              {completedCount}/{TASKS.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Fyre Keys Balance */}
        <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-primary/10 border border-primary/20 mt-2">
          <Key className="w-5 h-5 text-primary" />
          <div className="text-center">
            <div className="text-2xl font-bold font-serif text-foreground">{fyreKeys}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Fyre Keys</div>
          </div>
        </div>
        
        <div className="space-y-2 mt-3">
          {TASKS.map((task) => {
            const completed = isTaskCompleted(task);
            const isClickable = task.type === 'redirect' || task.type === 'copy' || task.type === 'share';
            const progressDisplay = getProgressDisplay(task);
            
            return (
              <button
                key={task.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isClickable || completed) {
                    handleTaskClick(task).catch((err) => {
                      console.error('Unhandled error in handleTaskClick:', err);
                    });
                  }
                }}
                disabled={!isClickable && !completed}
                className={cn(
                  "flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors",
                  isClickable && "hover:bg-muted cursor-pointer",
                  !isClickable && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0",
                    completed
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {completed && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={cn(
                    "text-muted-foreground flex-shrink-0",
                    completed && "opacity-50"
                  )}>
                    {task.type === 'copy' ? <Copy className="w-3.5 h-3.5" /> : task.icon}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-sans truncate",
                      completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {task.label}
                  </span>
                </span>
                {progressDisplay && (
                  <span
                    className={cn(
                      "text-xs font-mono flex-shrink-0",
                      completed ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {progressDisplay}
                  </span>
                )}
                <span className="text-[9px] font-sans text-primary/70 flex-shrink-0 whitespace-nowrap">
                  +{(task as any).keys} 🔑
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FyreMissionsDialog;
