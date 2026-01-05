import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import farcasterIcon from '@/assets/farcaster-icon.png';
import baseappIcon from '@/assets/baseapp-icon.png';
import zoraIcon from '@/assets/zora-icon.png';

const Footer = () => {
  const socialLinks = [
    { 
      name: 'X', 
      url: 'https://x.com/warplette', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    { 
      name: 'Base App', 
      url: 'https://base.app/profile/0xD7305c73f62B7713B74316613795C77E814Dea0f', 
      icon: <img src={baseappIcon} alt="Base App" className="w-5 h-5 rounded-sm object-cover" />
    },
    { 
      name: 'Farcaster', 
      url: 'https://farcaster.xyz/warplette', 
      icon: <img src={farcasterIcon} alt="Farcaster" className="w-5 h-5 rounded-sm object-cover" />
    },
    { 
      name: 'Zora', 
      url: 'https://zora.co/@fcbcc', 
      icon: <img src={zoraIcon} alt="Zora" className="w-5 h-5 rounded-sm object-cover" />
    },
  ];

  // Quicklinks with active/inactive status
  const quickLinks = [
    { id: 0, name: 'FyreApp 0', fullName: 'FyreApp 0: Fyre Docs', url: 'https://fyreapp0.lovable.app/', active: true },
    { id: 1, name: 'FyreApp 1', fullName: 'FyreApp 1: PureBreed Explorer (current site)', url: '/', active: true },
    { id: 2, name: 'FyreApp 2', fullName: 'FyreApp 2: Portfolio Manager', url: '#', active: false },
    { id: 3, name: 'FyreApp 3', fullName: 'FyreApp 3: Custody and Snapshots', url: '#', active: false },
    { id: 4, name: 'FyreApp 4', fullName: 'FyreApp 4: Fyre Labs', url: '#', active: false },
    { id: 5, name: 'FyreApp 5', fullName: 'FyreApp 5: Fyre Arena', url: '#', active: false },
    { id: 'herald', name: 'Herald', fullName: 'FyreHerald', url: 'https://farcaster.xyz/miniapps/NBRppPFoPDDF/fyre-herald', active: true },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* FCBC CLUB with Social Icons */}
        <div className="flex flex-col items-center mb-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            FCBC CLUB
          </h3>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 transition-colors"
                title={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quicklinks/Roadmap */}
        <TooltipProvider>
          <div className="flex flex-col items-center mb-6">
            <h4 className="text-xs font-sans text-muted-foreground mb-3 uppercase tracking-wider">
              Quicklinks/Roadmap
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <Tooltip key={link.id}>
                  <TooltipTrigger asChild>
                    {link.active ? (
                      <a
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : undefined}
                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-foreground bg-muted hover:bg-primary/20 hover:scale-105 rounded-full transition-all"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-muted-foreground/50 bg-muted/50 rounded-full cursor-not-allowed">
                        {link.name}
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{link.fullName}</p>
                    {!link.active && <p className="text-xs text-muted-foreground">Coming Soon</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Fyre App 1
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            with love from the og folks at{' '}
            <a 
              href="https://fcbc.fun" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              fcbc.fun
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;