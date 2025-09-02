import React, { useState, useEffect } from 'react';
import ThreeCorpse from './components/threeCorpse';
import SingleCorpse from './components/singleCorpse';

type GameMode = 'single' | 'three';

function App() {
  const [selectedStyle, setSelectedStyle] = useState<'noir' | 'watercolor'>('noir');
  const [gameMode, setGameMode] = useState<GameMode>('three');
  const [noirThumbSrc, setNoirThumbSrc] = useState<string | null>(null);
  const [watercolorThumbSrc, setWatercolorThumbSrc] = useState<string | null>(null);

  useEffect(() => {
    const objectUrls: string[] = [];

    const loadAsset = async (path: string, setter: (url: string) => void) => {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.push(objectUrl);
        setter(objectUrl);
      } catch (error) {
        console.error(`Error loading asset ${path}:`, error);
      }
    };

    loadAsset('/noir_thumb.png', setNoirThumbSrc);
    loadAsset('/watercolor_thumb.jpeg', setWatercolorThumbSrc);

    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);


  const buttonBaseClasses = "px-4 py-2 text-xs font-medium uppercase tracking-wider border-[1.5px] border-black transition-all duration-200 font-mono";
  const selectedButtonClasses = "bg-black text-white";
  const unselectedButtonClasses = "bg-white text-black hover:bg-black/10";

  return (
    <div className="App bg-white">
      {/* Header */}
      <div className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8">
        <div className="flex flex-col">
          <span className="text-black text-2xl font-mono uppercase tracking-wider">
            Exquisite<span className="font-bold">Banana</span>
          </span>
          <span className="text-black text-xs font-mono uppercase tracking-wider opacity-70">
          A classic art game, reimagined with Gemini
          </span>
        </div>
        
        {/* Style Selector */}
        <div className="flex items-center gap-3">
          <span className="text-black text-xs font-mono uppercase tracking-wider">
            {selectedStyle}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStyle('noir')}
              className={`w-12 h-12 border-2 transition-all duration-200 overflow-hidden ${
                selectedStyle === 'noir' ? 'border-black' : 'border-black/20 hover:border-black/40'
              }`}
              aria-label="Select Noir style"
            >
              {noirThumbSrc ? (
                <img 
                  src={noirThumbSrc} 
                  alt="Noir style thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setSelectedStyle('watercolor')}
              className={`w-12 h-12 border-2 transition-all duration-200 overflow-hidden ${
                selectedStyle === 'watercolor' ? 'border-black' : 'border-black/20 hover:border-black/40'
              }`}
              aria-label="Select Watercolor style"
            >
               {watercolorThumbSrc ? (
                <img 
                  src={watercolorThumbSrc} 
                  alt="Watercolor style thumbnail" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Game Mode Selector */}
      <div className="pt-14 flex justify-center">
        <div className="flex">
          <button
            onClick={() => setGameMode('three')}
            className={`${buttonBaseClasses} ${
              gameMode === 'three' ? selectedButtonClasses : unselectedButtonClasses
            }`}
          >
            three corpse
          </button>
          <button
            onClick={() => setGameMode('single')}
            className={`${buttonBaseClasses} ${
              gameMode === 'single' ? selectedButtonClasses : unselectedButtonClasses
            }`}
          >
          single corpse
          </button>
        </div>
      </div>

      {/* Game Content */}
      {gameMode === 'single' ? (
        <SingleCorpse selectedStyle={selectedStyle} />
      ) : (
        <ThreeCorpse selectedStyle={selectedStyle} />
      )}

      {/* Footer */}
      <footer className="mt-8 py-6 text-center">
        <p className="text-black text-xs font-mono uppercase tracking-wider opacity-70">
          by MJ Gomez-Saavedra
        </p>
      </footer>
    </div>
  );
}

export default App;
