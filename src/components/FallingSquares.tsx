import { useEffect, useState } from 'react';

interface Square {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

const FallingSquares = () => {
  const [squares, setSquares] = useState<Square[]>([]);

  useEffect(() => {
    const generateSquares = () => {
      const newSquares: Square[] = [];
      for (let i = 0; i < 8; i++) {
        newSquares.push({
          id: Date.now() + i,
          x: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 3 + Math.random() * 2,
        });
      }
      setSquares(newSquares);
    };

    generateSquares();
    const interval = setInterval(generateSquares, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {squares.map((square) => (
        <div
          key={square.id}
          className="absolute w-2 h-2 bg-[#005ae0]/60 rounded-sm"
          style={{
            left: `${square.x}%`,
            animation: `fallAndCollect ${square.duration}s ease-in ${square.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
};

export default FallingSquares;
