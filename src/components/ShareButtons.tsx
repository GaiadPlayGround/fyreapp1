import { Species } from '@/data/species';
import { useWallet } from '@/contexts/WalletContext';
import { useSpeciesStats } from '@/hooks/useSpeciesStats';

interface ShareButtonsProps {
  species: Species;
}

const CONTRACT_ADDRESS = '0xbfca039bbda0bd750c2b83d666810b1bb4d31b38';

const ShareButtons = ({ species }: ShareButtonsProps) => {
  const { addShare, address } = useWallet();
  const { recordShare } = useSpeciesStats();
  
  // Truncate description to ~15 words for share text
  const truncateToWords = (text: string, maxWords: number = 15) => {
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };
  
  const truncatedDesc = truncateToWords(species.description, 15);
  
  // Build species URL using symbol and code
  // symbol is like "FCBC3", code is like "68005/12881238"
  const speciesSymbol = species.symbol || `FCBC${species.id.replace(/\D/g, '')}`;
  const speciesCode = (species as any).code || `${species.id.replace(/\D/g, '')}0/12345678`;
  const speciesUrl = `https://www.fcbc.fun/species/${speciesSymbol}?code=${speciesCode}`;
  
  // X share format
  const xShareText = `The ${species.name} is an endangered animal brought onchain to Base by the FCBC Club. 

Buy DNA and Create Hybrids:

${speciesUrl}`;

  // BaseApp/Farcaster share format
  const farcasterShareText = `Meet ${speciesSymbol}.

-THE ${species.name.toUpperCase()} 

"${truncatedDesc}" 

Explore and buy onchain DNA of this endangered animal, build your Fyre Portfolio and Create Hybrids.

Live on FCBCdotFUN.

contract: ${CONTRACT_ADDRESS}`;

  const handleShare = async (url: string, platform: string) => {
    addShare();
    if (address) {
      await recordShare(species.id, address, platform);
    }
    window.open(url, '_blank');
  };

  const shareLinks = [
    {
      name: 'X',
      platform: 'x',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}`,
    },
    {
      name: 'Farcaster',
      platform: 'farcaster',
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
      platform: 'baseapp',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#0052FF"/>
          <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" fill="none"/>
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
          onClick={() => handleShare(link.url, link.platform)}
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