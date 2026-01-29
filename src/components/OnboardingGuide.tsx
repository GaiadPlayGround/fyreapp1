import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Filter, Grid, List, Clock, Share2, Info, ArrowLeft, MousePointer2, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const guideSteps: GuideStep[] = [
  {
    icon: <MousePointer2 className="w-5 h-5" />,
    title: "Quick Tip",
    description: "Tap any icon twice to remove it from the screen. This helps keep your view clean!"
  },
  {
    icon: <MousePointerClick className="w-5 h-5" />,
    title: "Double-Tap to Buy",
    description: "Double-tap any species image to buy $1 USDC worth of this species DNA tokens. Quick and easy!"
  },
  {
    icon: <Filter className="w-5 h-5" />,
    title: "Filter & Sort",
    description: "Tap to open filters. Sort by votes, shares, or filter by conservation status."
  },
  {
    icon: <Grid className="w-5 h-5" />,
    title: "Grid View",
    description: "Browse species in a compact grid layout. Tap any card to view details."
  },
  {
    icon: <List className="w-5 h-5" />,
    title: "List View",
    description: "Switch to list view for more detailed species information at a glance."
  },
  {
    icon: <Info className="w-5 h-5" />,
    title: "Species Info",
    description: "In slideshow, tap the info icon to see species details and conservation status."
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Autoplay Timer",
    description: "Control slideshow speed or turn off autoplay. Choose from 3s to 30s intervals."
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: "Share Species",
    description: "Share your favorite species on X, Farcaster, or Base App to earn rewards."
  },
  {
    icon: <ArrowLeft className="w-5 h-5" />,
    title: "Navigate",
    description: "Swipe or use arrow keys to browse between species in the slideshow."
  }
];

const ONBOARDING_KEY = 'purebreeds_onboarding_complete';

interface OnboardingGuideProps {
  forceShow?: boolean;
  onClose?: () => void;
}

const OnboardingGuide = ({ forceShow = false, onClose }: OnboardingGuideProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }
    
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Show after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose?.();
  };

  if (!isVisible) return null;

  const step = guideSteps[currentStep];

  // Render as portal to body to avoid positioning issues
  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 bg-muted/50 hover:bg-muted rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <span className="text-xs text-muted-foreground font-sans">
            {currentStep + 1} of {guideSteps.length}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-500">
              {step.icon}
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 my-4">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  index === currentStep ? "bg-blue-500" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 text-sm font-sans text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Skip All
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 text-sm font-sans text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {currentStep < guideSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at body level, not relative to parent
  return typeof window !== 'undefined' && document.body
    ? createPortal(content, document.body)
    : content;
};

export default OnboardingGuide;
