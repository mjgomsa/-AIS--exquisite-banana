import React, { useState, useRef, useEffect } from 'react';
import { generateBodyPartImage } from '../services/geminiService';
import { stylisticReferences, IMAGE_PROMPTS } from '../constants';

type BodyPart = 'head' | 'torso' | 'legs';

interface BodyPartConfig {
  label: string;
  prompt: string;
  setPrompt: (value: string) => void;
}

interface SingleCorpseProps {
  selectedStyle: 'noir' | 'watercolor';
}

const SingleCorpse: React.FC<SingleCorpseProps> = ({ selectedStyle }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [headPrompt, setHeadPrompt] = useState('');
  const [torsoPrompt, setTorsoPrompt] = useState('');
  const [legsPrompt, setLegsPrompt] = useState('');
  const [generations, setGenerations] = useState<string[]>([]);
  
  const [isGeneratingHead, setIsGeneratingHead] = useState(false);
  const [isGeneratingTorso, setIsGeneratingTorso] = useState(false);
  const [isGeneratingLegs, setIsGeneratingLegs] = useState(false);
  
  const [headImage, setHeadImage] = useState<string | null>(null);
  const [torsoImage, setTorsoImage] = useState<string | null>(null);
  const [legsImage, setLegsImage] = useState<string | null>(null);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  const currStyle = stylisticReferences[selectedStyle];

  // Helper function to generate image from reference (consistent with threeCorpse)
  const generateImageFromReference = async (prompt: string): Promise<string> => {
    console.log('generateImageFromReference called with prompt:', prompt);
    console.log('Fetching reference image from:', currStyle.path);
    
    const response = await fetch(currStyle.path);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    console.log('Reference image blob created, size:', blob.size);
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    return new Promise<string>((resolve, reject) => {
      img.onload = async () => {
        console.log('Reference image loaded in helper, dimensions:', img.width, 'x', img.height);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            console.log('Reference image converted to data URL in helper, length:', dataUrl.length);
            console.log('Calling generateBodyPartImage with prompt and data URL');
            
            const generatedImage = await generateBodyPartImage(prompt, dataUrl);
            
            if (generatedImage) {
              console.log('Image generated successfully in helper');
              resolve(generatedImage);
            } else {
              console.error('Failed to generate image in helper');
              reject(new Error('Failed to generate image'));
            }
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load reference image in helper');
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load reference image'));
      };
      
      img.src = objectUrl;
    });
  };

  // Load reference image
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadReferenceImage = async () => {
      try {
        console.log('Loading reference image from:', currStyle.path);
        const response = await fetch(currStyle.path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          console.log('Reference image loaded successfully, dimensions:', img.width, 'x', img.height);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            console.log('Reference image converted to data URL, length:', dataUrl.length);
            setReferenceImage(dataUrl);
          } else {
            setImageLoadError("Could not get canvas context to convert reference image.");
          }
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          console.error('Failed to load reference image');
          setImageLoadError(`Failed to load reference image from path: ${currStyle.path}`);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      } catch (error) {
        console.error('Error loading reference image:', error);
        setImageLoadError(`Failed to fetch reference image. Error: ${error}`);
      }
    };

    loadReferenceImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currStyle.path]);

  // Reset images when style changes
  useEffect(() => {
    setHeadImage(null);
    setTorsoImage(null);
    setLegsImage(null);
    setGenerations([]);
  }, [selectedStyle]);

  // Update canvas when images change
  useEffect(() => {
    const imageToShow = legsImage || torsoImage || headImage;
    if (imageToShow) updateCanvas(imageToShow);
  }, [headImage, torsoImage, legsImage]);

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
      setTorsoImage(null);
      setLegsImage(null);
    } else if (bodyPart === 'torso') {
      setLegsImage(null);
    }
  };

  const handleGenerate = async (bodyPart: BodyPart) => {
    const bodyPartConfig = bodyParts.find(bp => bp.label.toLowerCase() === bodyPart);
    if (!bodyPartConfig?.prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    console.log('Generating', bodyPart, 'with prompt:', bodyPartConfig.prompt);
    console.log('Current state - referenceImage:', !!referenceImage, 'imageLoadError:', imageLoadError);
    console.log('Current state - headImage:', !!headImage, 'torsoImage:', !!torsoImage);

    // Set loading state
    const setLoadingState = (loading: boolean) => {
      if (bodyPart === 'head') setIsGeneratingHead(loading);
      else if (bodyPart === 'torso') setIsGeneratingTorso(loading);
      else if (bodyPart === 'legs') setIsGeneratingLegs(loading);
    };

    setLoadingState(true);

    try {
      let baseImage: string;
      let prompt: string;

      if (bodyPart === 'head') {
        // Use the helper function to ensure proper reference image loading
        const constructedPrompt = IMAGE_PROMPTS.head.replace.replace('{prompt}', bodyPartConfig.prompt) + ' ' + currStyle.promptStyle;
        const generatedImage = await generateImageFromReference(constructedPrompt);
        
        if (generatedImage) {
          setHeadImage(generatedImage);
          clearSubsequentParts('head');
          updateCanvas(generatedImage);
          setGenerations(prev => [...prev, generatedImage]);
        } else {
          alert('Failed to generate image. Please try again.');
        }
        return; // Exit early since we handled the head generation
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
      }

      const generatedImage = await generateBodyPartImage(prompt, baseImage);

      if (generatedImage) {
        // Update the appropriate state
        if (bodyPart === 'torso') setTorsoImage(generatedImage);
        else if (bodyPart === 'legs') setLegsImage(generatedImage);

        // Clear subsequent parts if regenerating
        if (bodyPart === 'torso') {
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
    } finally {
      setLoadingState(false);
    }
  };

  const getLoadingState = (bodyPart: BodyPart) => {
    if (bodyPart === 'head') return isGeneratingHead;
    if (bodyPart === 'torso') return isGeneratingTorso;
    if (bodyPart === 'legs') return isGeneratingLegs;
    return false;
  };

  const getGeneratedImage = (bodyPart: BodyPart) => {
    if (bodyPart === 'head') return headImage;
    if (bodyPart === 'torso') return torsoImage;
    if (bodyPart === 'legs') return legsImage;
    return null;
  };

  const isDisabled = (bodyPart: BodyPart, prompt: string) => {
    const isGenerating = getLoadingState(bodyPart);
    const isHeadAndNotReady = bodyPart === 'head' && (!referenceImage || !!imageLoadError);
    const hasPrerequisite = bodyPart === 'head' || 
                           (bodyPart === 'torso' && headImage) || 
                           (bodyPart === 'legs' && torsoImage);
    
    return isGenerating || !prompt.trim() || isHeadAndNotReady || !hasPrerequisite;
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center mt-10">
      <div className="flex gap-[7px] w-full max-w-6xl px-8 justify-center">
        <div className="w-96 flex-shrink-0">
        
          <div className="flex gap-[7px] w-full">
            <div 
              ref={canvasRef}
              className="bg-white border-[1.5px] border-black shadow-none flex-shrink-0"
              style={{ width: '240px', height: '600px' }}
            />

            <div className="flex flex-col justify-between w-full">
              {bodyParts.map(({ label, prompt, setPrompt }) => {
                const bodyPart = label.toLowerCase() as BodyPart;
                const hasGenerated = getGeneratedImage(bodyPart);
                const isGeneratingThisPart = getLoadingState(bodyPart);
                const isHeadAndNotReady = bodyPart === 'head' && (!referenceImage || !!imageLoadError);
                const disabled = isDisabled(bodyPart, prompt);

                return (
                  <div key={label} className="w-full">
                    <h3 className="text-black text-md font-bold uppercase tracking-wider font-mono">{`[${label}]`}</h3>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Describe the ${label.toLowerCase()}...`}
                      className="w-full h-20 p-2 bg-white text-black text-xs font-light border-[1.5px] border-black rounded-none resize-none overflow-y-auto focus:outline-none focus:border-black focus:ring-0 placeholder:text-black placeholder:opacity-50 font-mono"
                    />
                    <button 
                      onClick={() => handleGenerate(bodyPart)}
                      disabled={disabled}
                      className={`w-full px-2 py-1 border-[0.5px] border-black transition-all duration-200 font-medium uppercase tracking-wider text-xs font-mono ${
                        disabled
                          ? 'bg-black text-white cursor-not-allowed'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                      title={isHeadAndNotReady ? "Reference image is loading or failed to load." : ""}
                    >
                      {isGeneratingThisPart ? 'Generating...' : 
                       hasGenerated ? `Regenerate ${label}` : `Generate ${label}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 w-full max-w-6xl">
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

export default SingleCorpse; 