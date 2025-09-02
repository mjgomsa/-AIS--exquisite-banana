import React, { useState, useRef, useEffect } from 'react';
import { generateBodyPartImage } from '../services/geminiService';
import { stylisticReferences, IMAGE_PROMPTS } from '../constants';

type BodyPart = 'head' | 'torso' | 'legs';

interface BodyPartConfig {
  label: string;
  prompt: string;
  setPrompt: (value: string) => void;
}

interface OneColumnProps {
  selectedStyle: 'noir' | 'watercolor';
  corpseId: 'corpse1' | 'corpse2' | 'corpse3';
  headImage: string | null;
  torsoImage: string | null;
  legsImage: string | null;
  onHeadGenerated: (image: string) => void;
  onTorsoGenerated: (image: string) => void;
  onLegsGenerated: (image: string) => void;
  onGenerateHead?: (userPrompt: string) => Promise<void>;
  onGenerateTorso?: (userPrompt: string) => Promise<void>;
  onGenerateLegs?: (userPrompt: string) => Promise<void>;
  isGeneratingHeads?: boolean;
  isGeneratingTorsos?: boolean;
  isGeneratingLegs?: boolean;
  isReadOnly?: boolean;
  generatingHeadPrompt?: string;
  finalHeadPrompt?: string;
  generatingTorsoPrompt?: string;
  finalTorsoPrompt?: string;
  generatingLegsPrompt?: string;
  finalLegsPrompt?: string;
  corpseGenerations?: string[];
}

const OneColumn: React.FC<OneColumnProps> = ({ 
  selectedStyle, 
  corpseId, 
  headImage, 
  torsoImage, 
  legsImage,
  onHeadGenerated,
  onTorsoGenerated,
  onLegsGenerated,
  onGenerateHead,
  onGenerateTorso,
  onGenerateLegs,
  isGeneratingHeads = false,
  isGeneratingTorsos = false,
  isGeneratingLegs = false,
  isReadOnly = false,
  generatingHeadPrompt = '',
  finalHeadPrompt = '',
  generatingTorsoPrompt = '',
  finalTorsoPrompt = '',
  generatingLegsPrompt = '',
  finalLegsPrompt = '',
  corpseGenerations = []
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [headPrompt, setHeadPrompt] = useState('');
  const [torsoPrompt, setTorsoPrompt] = useState('');
  const [legsPrompt, setLegsPrompt] = useState('');
  const [generations, setGenerations] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  const currStyle = stylisticReferences[selectedStyle];

  // Load reference image
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadReferenceImage = async () => {
      try {
        const response = await fetch(currStyle.path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setReferenceImage(canvas.toDataURL('image/jpeg'));
          } else {
            setImageLoadError("Could not get canvas context to convert reference image.");
          }
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          setImageLoadError(`Failed to load reference image from path: ${currStyle.path}`);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      } catch (error) {
        setImageLoadError(`Failed to fetch reference image. Error: ${error}`);
      }
    };

    loadReferenceImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currStyle.path]);

  // Reset generations when style changes
  useEffect(() => setGenerations([]), [selectedStyle]);

  // Update canvas when images change
  useEffect(() => {
    const imageToShow = legsImage || torsoImage || headImage;
    if (imageToShow) updateCanvas(imageToShow);
  }, [headImage, torsoImage, legsImage]);

  // Update generations when corpseGenerations prop changes
  useEffect(() => {
    setGenerations(corpseGenerations);
  }, [corpseGenerations]);

  const bodyParts: BodyPartConfig[] = [
    { label: 'Head', prompt: headPrompt, setPrompt: setHeadPrompt },
    { label: 'Torso', prompt: torsoPrompt, setPrompt: setTorsoPrompt },
    { label: 'Legs', prompt: legsPrompt, setPrompt: setLegsPrompt },
  ];

  const updateCanvas = (imageUrl: string) => {
    if (canvasRef.current) {
      canvasRef.current.style.backgroundImage = `url(${imageUrl})`;
      canvasRef.current.style.backgroundSize = 'cover';
      canvasRef.current.style.backgroundPosition = 'center';
    }
  };

  const clearSubsequentParts = (bodyPart: BodyPart) => {
    if (bodyPart === 'head') {
      onTorsoGenerated(null);
      onLegsGenerated(null);
    } else if (bodyPart === 'torso') {
      onLegsGenerated(null);
    }
  };

  const handleGenerate = async (bodyPart: BodyPart) => {
    if (isReadOnly) return;

    const bodyPartConfig = bodyParts.find(bp => bp.label.toLowerCase() === bodyPart);
    if (!bodyPartConfig?.prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    // Check if this is a special generation (head/torso/legs for specific corpses)
    const specialGenerations = {
      head: { corpse: 'corpse1', handler: onGenerateHead },
      torso: { corpse: 'corpse2', handler: onGenerateTorso },
      legs: { corpse: 'corpse3', handler: onGenerateLegs }
    };

    const specialGen = specialGenerations[bodyPart];
    if (corpseId === specialGen.corpse && specialGen.handler) {
      try {
        await specialGen.handler(bodyPartConfig.prompt);
        return;
      } catch (error) {
        console.error(`Error generating all ${bodyPart}s:`, error);
        alert(`Error generating ${bodyPart}s. Please try again.`);
        return;
      }
    }

    // Handle regular generation (legs for other corpses)
    try {
      let baseImage: string;
      let prompt: string;

      if (bodyPart === 'head') {
        if (imageLoadError || !referenceImage) {
          alert(imageLoadError || 'The style reference image is still loading. Please wait a moment and try again.');
          return;
        }
        baseImage = referenceImage;
        prompt = IMAGE_PROMPTS.head.replace.replace('{prompt}', bodyPartConfig.prompt) + ' ' + currStyle.promptStyle;
      } else if (bodyPart === 'torso') {
        if (!headImage) {
          alert('Please generate a head first before generating a torso');
          return;
        }
        baseImage = headImage;
        prompt = IMAGE_PROMPTS.torso.continue.replace('{prompt}', bodyPartConfig.prompt) + ' ' + currStyle.promptStyle;
      } else if (bodyPart === 'legs') {
        if (!torsoImage) {
          alert('Please generate a torso first before generating legs');
          return;
        }
        baseImage = torsoImage;
        prompt = IMAGE_PROMPTS.legs.continue.replace('{prompt}', bodyPartConfig.prompt) + ' ' + currStyle.promptStyle;
      } else {
        return;
      }

      const generatedImage = await generateBodyPartImage(prompt, baseImage);

      if (generatedImage) {
        const handlers = { head: onHeadGenerated, torso: onTorsoGenerated, legs: onLegsGenerated };
        handlers[bodyPart](generatedImage);
        
        if (bodyPart === 'head' || bodyPart === 'torso') {
          clearSubsequentParts(bodyPart);
        }
        
        updateCanvas(generatedImage);
        setGenerations(prev => [...prev, generatedImage]);
      } else {
        alert('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
    }
  };

  const getDisplayPrompt = (bodyPart: BodyPart, prompt: string) => {
    const promptMap = {
      head: { generating: generatingHeadPrompt, final: finalHeadPrompt },
      torso: { generating: generatingTorsoPrompt, final: finalTorsoPrompt },
      legs: { generating: generatingLegsPrompt, final: finalLegsPrompt }
    };

    const prompts = promptMap[bodyPart];
    if (prompts.generating) return prompts.generating;
    if (prompts.final && (bodyPart === 'head' ? headImage : bodyPart === 'torso' ? torsoImage : legsImage)) {
      return prompts.final;
    }
    return prompt;
  };

  const shouldShowButton = (bodyPart: BodyPart) => {
    const buttonMap = { head: 'corpse1', torso: 'corpse2', legs: 'corpse3' };
    return corpseId === buttonMap[bodyPart];
  };

  const isGeneratingThisPart = (bodyPart: BodyPart) => {
    const stateMap = { head: isGeneratingHeads, torso: isGeneratingTorsos, legs: isGeneratingLegs };
    return stateMap[bodyPart];
  };

  const isDisabled = (bodyPart: BodyPart, prompt: string) => {
    const isGenerating = isGeneratingThisPart(bodyPart);
    const isHeadAndNotReady = bodyPart === 'head' && (!referenceImage || !!imageLoadError);
    return isGenerating || !prompt.trim() || isHeadAndNotReady || (isReadOnly && !(bodyPart === 'head' ? headImage : bodyPart === 'torso' ? torsoImage : legsImage));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex gap-[7px] w-full">
        <div 
          ref={canvasRef}
          className="bg-white border-[1.5px] border-black shadow-none flex-shrink-0"
          style={{ width: '240px', height: '600px' }}
        />

        <div className="flex flex-col justify-between w-full">
          {bodyParts.map(({ label, prompt, setPrompt }) => {
            const bodyPart = label.toLowerCase() as BodyPart;
            const hasGenerated = bodyPart === 'head' ? headImage : bodyPart === 'torso' ? torsoImage : legsImage;
            const displayPrompt = getDisplayPrompt(bodyPart, prompt);
            const showButton = shouldShowButton(bodyPart);
            const generating = isGeneratingThisPart(bodyPart);
            const disabled = isDisabled(bodyPart, prompt);
            
            // Show textarea if it has a button OR if there's a prompt to display
            const shouldShowPromptBox = showButton || displayPrompt;

            return (
              <div key={label} className="w-full">
                <h3 className="text-black text-md font-bold uppercase tracking-wider font-mono">{`[${label}]`}</h3>
                
                {shouldShowPromptBox && (
                  <textarea
                    value={displayPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe the ${label.toLowerCase()}...`}
                    className="w-full h-20 p-2 bg-white text-black text-xs font-light border-[1.5px] border-black rounded-none resize-none overflow-y-auto focus:outline-none focus:border-black focus:ring-0 placeholder:text-black placeholder:opacity-50 font-mono"
                    disabled={isReadOnly || displayPrompt !== prompt}
                  />
                )}
                
                {showButton && (
                  <button 
                    onClick={() => handleGenerate(bodyPart)}
                    disabled={disabled}
                    className={`w-full px-2 py-1 border-[0.5px] border-black transition-all duration-200 font-medium uppercase tracking-wider text-xs font-mono ${
                      disabled
                        ? 'bg-black text-white cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {generating ? 'Generating...' : hasGenerated ? `Regenerate ${label}` : `Generate ${label}`}
                  </button>
                )}
                
              </div>
            );
          })}
        </div>
      </div>

      <div className=" p-4 w-full">
        <h4 className="text-black font-bold mb-3 text-center text-xs tracking-wide uppercase font-mono">[Generations]</h4>
        <div className="flex gap-3 overflow-x-auto pb-2 justify-center">
          {generations.map((generation, index) => (
            <div key={index} className="flex-shrink-0 w-12 h-12 border-[1.5px] border-black overflow-hidden">
              <img 
                src={generation} 
                alt={`Generation ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OneColumn;