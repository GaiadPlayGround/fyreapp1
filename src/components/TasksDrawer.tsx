import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, ExternalLink, Share2, Vote, Coins, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ReactNode;
}

const TasksDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'follow-zora', label: 'Follow FCBC on Zora', completed: false, icon: <ExternalLink className="w-3.5 h-3.5" /> },
    { id: 'follow-base', label: 'Follow FCBC on Base App', completed: false, icon: <ExternalLink className="w-3.5 h-3.5" /> },
    { id: 'follow-x', label: 'Follow FCBC on X', completed: false, icon: <ExternalLink className="w-3.5 h-3.5" /> },
    { id: 'vote-10', label: 'Vote for 10 species', completed: false, icon: <Vote className="w-3.5 h-3.5" /> },
    { id: 'vote-25', label: 'Vote for 25 species', completed: false, icon: <Vote className="w-3.5 h-3.5" /> },
    { id: 'share-5', label: 'Share 5 species', completed: false, icon: <Share2 className="w-3.5 h-3.5" /> },
    { id: 'share-25', label: 'Share 25 species', completed: false, icon: <Share2 className="w-3.5 h-3.5" /> },
    { id: 'refer-3', label: 'Refer 3 people', completed: false, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'refer-5', label: 'Refer 5 people', completed: false, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'buy-coin', label: 'Buy Creator Coin', completed: false, icon: <Coins className="w-3.5 h-3.5" /> },
  ]);

  const completedCount = tasks.filter(t => t.completed).length;

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-sans">{completedCount}/{tasks.length}</span>
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
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-2 w-full text-left group"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0",
                        task.completed
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}
                    >
                      {task.completed && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-muted-foreground",
                        task.completed && "opacity-50"
                      )}>
                        {task.icon}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-sans",
                          task.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {task.label}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksDrawer;