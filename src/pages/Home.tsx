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

  // DNA Enzymes popup logic: only at 120 seconds and 10 minutes (twice total)
  useEffect(() => {
    const twoMinutes = 120 * 1000;
    const tenMinutes = 10 * 60 * 1000;

    // First popup at 120 seconds
    const firstTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, twoMinutes);

    // Second popup at 10 minutes
    const secondTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, tenMinutes);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(secondTimeout);
    };
  }, []);

  // Allow manual opening from Wallet dropdown
  useEffect(() => {
    const handler = (_e: Event) => setShowEnzymeAd(true);
    window.addEventListener('enzymeAd:open', handler);
    return () => window.removeEventListener('enzymeAd:open', handler);
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
