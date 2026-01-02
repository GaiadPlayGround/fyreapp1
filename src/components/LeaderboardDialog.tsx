import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalletLeaderboard } from '@/hooks/useWalletLeaderboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const LeaderboardDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'votes' | 'shares'>('votes');
  const { topVoters, topSharers, loading } = useWalletLeaderboard(50);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getLeaderboardData = () => {
    if (tab === 'votes') {
      return topVoters.map((v, i) => ({
        rank: i + 1,
        address: v.address,
        count: v.total_votes,
      }));
    }
    return topSharers.map((s, i) => ({
      rank: i + 1,
      address: s.address,
      count: s.total_shares,
    }));
  };

  const data = getLeaderboardData();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Top 50 Leaderboard</DialogTitle>
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('votes')}
            className={cn(
              "flex-1 py-2 text-sm font-sans rounded-md transition-colors",
              tab === 'votes'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Top Voters
          </button>
          <button
            onClick={() => setTab('shares')}
            className={cn(
              "flex-1 py-2 text-sm font-sans rounded-md transition-colors",
              tab === 'shares'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Top Sharers
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
            data.map((item) => (
              <div
                key={item.address}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md",
                  item.rank <= 3 ? "bg-primary/10" : "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
                      item.rank === 1 && "bg-yellow-500 text-black",
                      item.rank === 2 && "bg-gray-400 text-black",
                      item.rank === 3 && "bg-amber-700 text-white",
                      item.rank > 3 && "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.rank}
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {truncateAddress(item.address)}
                  </span>
                </div>
                <span className="font-sans text-sm font-medium text-foreground">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardDialog;
