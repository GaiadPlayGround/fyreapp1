import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { name: 'X', url: 'https://x.com/fcbclub', icon: '𝕏' },
    { name: 'BaseApp', url: 'https://base.org', icon: '🔵' },
    { name: 'Farcaster', url: 'https://warpcast.com/fcbc', icon: '🟣' },
    { name: 'Zora', url: 'https://zora.co', icon: '⬡' },
  ];

  const quickLinks = [
    { name: 'FCBC.FUN', url: 'https://fcbc.fun' },
    { name: 'FyreApp 0', url: 'https://fyre0.fcbc.fun' },
    { name: 'FyreApp 1', url: '/' },
    { name: 'FyreApp 2', url: 'https://fyre2.fcbc.fun' },
    { name: 'FyreApp 3', url: 'https://fyre3.fcbc.fun' },
    { name: 'FyreApp 4', url: 'https://fyre4.fcbc.fun' },
    { name: 'FyreApp 5', url: 'https://fyre5.fcbc.fun' },
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
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 transition-colors text-lg"
                title={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center mb-6">
          <h4 className="text-xs font-sans text-muted-foreground mb-3 uppercase tracking-wider">
            Quick Links
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-foreground bg-muted hover:bg-primary/20 rounded-full transition-colors"
              >
                {link.name}
                {link.url.startsWith('http') && <ExternalLink className="w-3 h-3" />}
              </a>
            ))}
          </div>
        </div>

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
