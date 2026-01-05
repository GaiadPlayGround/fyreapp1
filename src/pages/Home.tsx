import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import EnzymeAdPopup from '@/components/EnzymeAdPopup';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';

const Home = () => {
  const navigate = useNavigate();
  const { onchain, total } = useSpeciesApi();
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showEnzymeAd, setShowEnzymeAd] = useState(false);

  // Use API data for onchain stats
  const onchainCount = onchain || 234;
  const totalCount = total || 1234;

  // DNA Enzymes popup logic: every 120s for first 10min, then every 30min
  useEffect(() => {
    const startTime = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const twoMinutes = 120 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextPopup = () => {
      const elapsed = Date.now() - startTime;
      const interval = elapsed < tenMinutes ? twoMinutes : thirtyMinutes;
      
      timeoutId = setTimeout(() => {
        setShowEnzymeAd(true);
        scheduleNextPopup();
      }, interval);
    };

    // Initial popup after 120 seconds
    timeoutId = setTimeout(() => {
      setShowEnzymeAd(true);
      scheduleNextPopup();
    }, twoMinutes);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleExplore = () => {
    navigate('/explore');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header 
        animationEnabled={animationEnabled}
        soundEnabled={soundEnabled}
        onToggleAnimation={() => setAnimationEnabled(!animationEnabled)}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
      
      <main className="flex-1">
        <HeroSection
          onchain={onchainCount}
          total={totalCount}
          onSwipeUp={handleExplore}
          animationEnabled={animationEnabled}
          soundEnabled={soundEnabled}
        />
      </main>

      <Footer />

      {/* DNA Enzymes Ad Popup */}
      {showEnzymeAd && (
        <EnzymeAdPopup onClose={() => setShowEnzymeAd(false)} />
      )}
    </div>
  );
};

export default Home;
