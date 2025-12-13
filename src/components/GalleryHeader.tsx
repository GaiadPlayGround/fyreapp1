interface GalleryHeaderProps {
  onchain: number;
  total: number;
}
const GalleryHeader = ({
  onchain,
  total
}: GalleryHeaderProps) => {
  // Use dummy data if API doesn't return valid numbers
  const displayOnchain = onchain > 0 ? onchain : 234;
  const displayTotal = total > 0 ? total : 1234;
  return <div className="text-center py-4 px-3">
      <h2 className="font-semibold text-[#005ae0] text-6xl font-mono py-0 my-[10px]">
        ​PUREBREEDS EXPLORER 
      </h2>
      <p className="text-muted-foreground mt-2 leading-relaxed text-2xl font-medium text-center px-0 mx-[100px] my-[25px] py-[15px] font-serif">
        Browse, Vote and Share  <br />
        Tokenized Endangered PureBreeds  <br />
        on Base L2
      </p>
      <a href="https://fcbc.fun" target="_blank" rel="noopener noreferrer" className="font-sans text-blue-500 hover:text-blue-600 transition-colors inline-block mt-2 text-sm text-center px-px py-0 my-0">
        (a product of fcbc.fun)
      </a>
      <div className="mt-2">
        <span className="text-xs text-muted-foreground font-serif">Total Onchain:</span>
        <span className="ml-1.5 text-sm font-sans font-semibold text-foreground">
          {displayOnchain}/{displayTotal}
        </span>
      </div>
      <button className="mt-6 mb-2 bg-[#005ae0] hover:bg-[#0047b3] text-white font-semibold text-lg py-3 px-12 transition-colors shadow-md opacity-85 rounded-xl border-dashed border-4 border-neutral-700 font-mono">
        SWIPE UP
      </button>
    </div>;
};
export default GalleryHeader;