import { Species } from '@/data/species';

interface ShareButtonsProps {
  species: Species;
}

const ShareButtons = ({ species }: ShareButtonsProps) => {
  // Truncate description to ~100 chars
  const truncatedDesc = species.description.length > 100 
    ? species.description.substring(0, 100) + '...'
    : species.description;
  
  const speciesUrl = `https://www.fcbc.fun/species/${species.id}?code=${(species as any).code || '0000/00000000'}`;
  
  const shareText = `Meet the ${species.name} - ${truncatedDesc}

Now live on FCBC PureBreed Explorer.

Vote, collect, or own onchain DNA ${species.ticker}.

View: ${speciesUrl}`;

  const shareLinks = [
    {
      name: 'X',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Farcaster',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 4h18v16.5l-4.5-3-4.5 3-4.5-3-4.5 3V4zm3 3v2h12V7H6zm0 4v2h12v-2H6z" />
        </svg>
      ),
      url: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Base',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
      url: `https://base.org`,
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-2 bg-card/10 backdrop-blur-sm rounded-md">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-card/90 hover:text-card hover:bg-card/10 rounded transition-colors"
        >
          {link.icon}
          <span className="text-xs font-sans">{link.name}</span>
        </a>
      ))}
    </div>
  );
};

export default ShareButtons;