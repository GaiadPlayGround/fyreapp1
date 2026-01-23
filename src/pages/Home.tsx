import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import EnzymeAdPopup from '@/components/EnzymeAdPopup';
import { useSpeciesApi } from '@/hooks/useSpeciesApi';
import { useMetaTags } from '@/hooks/useMetaTags';

const Home = () => {
  const navigate = useNavigate();
  const { onchain, total } = useSpeciesApi();
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showEnzymeAd, setShowEnzymeAd] = useState(false);

  // Use API data for onchain stats
  const onchainCount = onchain || 234;
  const totalCount = total || 1234;

  // Set meta tags for home page
  useMetaTags({
    title: 'PUREBREEDS EXPLORER | Tokenized Endangered Animals on Base L2',
    description: 'Browse, Vote and Share Tokenized Endangered Animals on Base L2',
    image: '/logo.png',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://www.fcbc.fun',
  });

  // DNA Enzymes popup logic: only at 180 seconds and 45 minutes (twice total)
  useEffect(() => {
    const threeMinutes = 180 * 1000;
    const fortyFiveMinutes = 45 * 60 * 1000;

    // First popup at 180 seconds
    const firstTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, threeMinutes);

    // Second popup at 45 minutes
    const secondTimeout = setTimeout(() => {
      setShowEnzymeAd(true);
    }, fortyFiveMinutes);

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
    navigate('/connect');
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
