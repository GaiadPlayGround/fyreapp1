interface GalleryHeaderProps {
  onchain: number;
  total: number;
}

const GalleryHeader = ({ onchain, total }: GalleryHeaderProps) => {
  return (
    <div className="text-center py-4 px-3">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Fyre PureBreed Collectibles Navigator
      </h2>
      <a 
        href="https://fcbc.fun" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors"
      >
        a product of fcbc.fun
      </a>
      <div className="mt-2">
        <span className="text-xs font-sans text-muted-foreground">Total Onchain:</span>
        <span className="ml-1.5 text-sm font-sans font-semibold text-foreground">
          {onchain}/{total}
        </span>
      </div>
    </div>
  );
};

export default GalleryHeader;
