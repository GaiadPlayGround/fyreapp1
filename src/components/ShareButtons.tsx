import { useState } from 'react';
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
  
  // Build species URL using symbol
  const speciesNumber = species.id.replace(/\D/g, '');
  const speciesUrl = `https://1.fcbc.fun/explore/fcbc${speciesNumber}`;
  
  // Unified share format for all platforms
  const shareText = `The ${species.name} is an endangered animal brought onchain to Base-L2 by @warplette's FCBC Club.

View, Assign Base Squares and Buy DNA Units of this species: ${speciesUrl}

PS: DNA tokens are the 1st bio-RWAs in web3.
#FyreBasePosting`;

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
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
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
      url: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'BaseApp',
      platform: 'baseapp',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#0052FF"/>
          <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" fill="none"/>
        </svg>
      ),
      url: `https://base.app/share?url=${encodeURIComponent(speciesUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(speciesUrl);
    // No share tracking for copy link
  };

  const [linkCopied, setLinkCopied] = useState(false);

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
      {/* Copy Link */}
      <button
        onClick={() => {
          handleCopyLink();
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        }}
        className="flex items-center gap-2 px-3 py-2 text-card/90 hover:text-card hover:bg-card/10 rounded transition-colors"
      >
        {linkCopied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
        )}
        <span className="text-xs font-sans">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
};

export default ShareButtons;
