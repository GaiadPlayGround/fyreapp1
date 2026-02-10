import { X } from 'lucide-react';

interface OnchainSeoAdPopupProps {
  onClose: () => void;
}

const OnchainSeoAdPopup = ({ onClose }: OnchainSeoAdPopupProps) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-muted/50 hover:bg-muted rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="text-center space-y-3">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Onchain SEO
          </h2>
          <p className="text-sm font-sans text-foreground">
            Vote for your favourite PureBreeds to get them to the first page.
          </p>
          <p className="text-xs font-sans text-muted-foreground italic">
            This action maximises your onchain footprint on Base L2 for near free!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnchainSeoAdPopup;
