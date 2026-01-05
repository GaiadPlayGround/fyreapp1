import { Species } from '@/data/species';
import { useWallet } from '@/contexts/WalletContext';

interface ShareButtonsProps {
  species: Species;
}

const CONTRACT_ADDRESS = '0xbfca039bbda0bd750c2b83d666810b1bb4d31b38';

const ShareButtons = ({ species }: ShareButtonsProps) => {
  const { addShare } = useWallet();
  
  // Truncate description to ~50 words
  const truncateToWords = (text: string, maxWords: number = 50) => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };
  
  const truncatedDesc = truncateToWords(species.description, 50);
  const speciesUrl = `https://www.fcbc.fun/species/${species.id}?code=${(species as any).code || '19832/233712210'}`;
  
  // X share format
  const xShareText = `The ${species.name} is an endangered animal brought onchain to Base by the FCBC Club. 

Buy DNA and Create Hybrids:

${speciesUrl}`;

  // BaseApp/Farcaster share format
  const farcasterShareText = `Meet ${species.ticker}.

-THE ${species.name.toUpperCase()} 

"${truncatedDesc}" 

Explore and buy onchain DNA of this endangered animal, build your Fyre Portfolio and Create Hybrids.

Live on FCBCdotFUN.

contract: ${CONTRACT_ADDRESS}`;

  const handleShare = (url: string) => {
    addShare();
    window.open(url, '_blank');
  };

  const shareLinks = [
    {
      name: 'X',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}`,
    },
    {
      name: 'Farcaster',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" fill="url(#fc-grad-share)"/>
          <defs>
            <linearGradient id="fc-grad-share" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#855DCD"/>
              <stop offset="100%" stopColor="#2B5876"/>
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="10.5" rx="4" ry="3.5" fill="white" opacity="0.9"/>
          <circle cx="10.5" cy="10.5" r="1" fill="#333"/>
          <circle cx="13.5" cy="10.5" r="1" fill="#333"/>
        </svg>
      ),
      url: `https://warpcast.com/~/compose?text=${encodeURIComponent(farcasterShareText)}`,
    },
    {
      name: 'Base App',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#5B4FE9"/>
          <path d="M12 8v8M9 11l3-3 3 3M9 13l3 3 3-3" stroke="white" strokeWidth="1.2" fill="none"/>
        </svg>
      ),
      url: `https://warpcast.com/~/compose?text=${encodeURIComponent(farcasterShareText)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-2 bg-card/10 backdrop-blur-sm rounded-md">
      {shareLinks.map((link) => (
        <button
          key={link.name}
          onClick={() => handleShare(link.url)}
          className="flex items-center gap-2 px-3 py-2 text-card/90 hover:text-card hover:bg-card/10 rounded transition-colors"
        >
          {link.icon}
          <span className="text-xs font-sans">{link.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ShareButtons;