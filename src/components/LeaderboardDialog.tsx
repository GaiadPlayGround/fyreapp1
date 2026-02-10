import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalletLeaderboard } from '@/hooks/useWalletLeaderboard';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const LeaderboardDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'votes' | 'shares' | 'dna' | 'referrers'>('dna'); // DNA holders default
  const { topVoters, topSharers, topDnaHolders, topReferrers, loading } = useWalletLeaderboard(50);


  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getLeaderboardData = () => {
    if (tab === 'votes') {
      return topVoters.map((v, i) => ({
        rank: i + 1,
        address: v.address,
        count: v.total_votes,
      }));
    }
    if (tab === 'shares') {
      return topSharers.map((s, i) => ({
        rank: i + 1,
        address: s.address,
        count: s.total_shares,
      }));
    }
    if (tab === 'referrers') {
      return topReferrers.map((r, i) => ({
        rank: i + 1,
        address: r.address,
        count: r.referral_count,
      }));
    }
    // Top DNA holders
    return topDnaHolders.map((h, i) => ({
      rank: i + 1,
      address: h.address,
      count: h.totalDnaBalance,
    }));
  };

  const data = getLeaderboardData();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Leaderboard"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Top 50 Leaderboard
          </DialogTitle>
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setTab('votes')}
            className={cn(
              "flex-1 py-2 text-xs font-sans rounded-md transition-colors",
              tab === 'votes'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Voters
          </button>
          <button
            onClick={() => setTab('shares')}
            className={cn(
              "flex-1 py-2 text-xs font-sans rounded-md transition-colors",
              tab === 'shares'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Sharers
          </button>
          <button
            onClick={() => setTab('dna')}
            className={cn(
              "flex-1 py-2 text-xs font-sans rounded-md transition-colors",
              tab === 'dna'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            DNA Holders
          </button>
          <button
            onClick={() => setTab('referrers')}
            className={cn(
              "flex-1 py-2 text-xs font-sans rounded-md transition-colors",
              tab === 'referrers'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Referrers
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No data yet
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => (
                <motion.div
                  key={item.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md",
                    item.rank <= 3 ? "bg-primary/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.03 + 0.1, type: "spring" }}
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                        item.rank === 1 && "bg-yellow-500 text-black",
                        item.rank === 2 && "bg-gray-400 text-black",
                        item.rank === 3 && "bg-amber-700 text-white",
                        item.rank > 3 && "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.rank}
                    </motion.span>
                    <span className="font-mono text-sm text-foreground">
                      {truncateAddress(item.address)}
                    </span>
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 + 0.2 }}
                    className="font-sans text-sm font-medium text-foreground"
                  >
                    {tab === 'dna' 
                      ? formatBalance(item.count) 
                      : item.count.toLocaleString()}
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardDialog;