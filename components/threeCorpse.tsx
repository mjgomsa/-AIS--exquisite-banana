import React, { useState, useEffect } from 'react';
import OneColumn from './oneColumn';
import { generateBodyPartImage, generateRandomPrompt } from '../services/geminiService';
import { stylisticReferences, IMAGE_PROMPTS, RANDOM_FALLBACK_PROMPTS } from '../constants';

interface ThreeCorpseProps {
  selectedStyle: 'noir' | 'watercolor';
}

const ThreeCorpse: React.FC<ThreeCorpseProps> = ({ selectedStyle }) => {
  // State for all three corpses
  const [corpseStates, setCorpseStates] = useState({
    corpse1: { headImage: null as string | null, torsoImage: null as string | null, legsImage: null as string | null },
    corpse2: { headImage: null as string | null, torsoImage: null as string | null, legsImage: null as string | null },
    corpse3: { headImage: null as string | null, torsoImage: null as string | null, legsImage: null as string | null }
  });

  const [isGeneratingHeads, setIsGeneratingHeads] = useState(false);
  const [isGeneratingTorsos, setIsGeneratingTorsos] = useState(false);
  const [isGeneratingLegs, setIsGeneratingLegs] = useState(false);
  
  // Individual generations tracking for each corpse
  const [corpseGenerations, setCorpseGenerations] = useState({
    corpse1: [] as string[],
    corpse2: [] as string[],
    corpse3: [] as string[]
  });
  
  const [generatingPrompts, setGeneratingPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const [finalPrompts, setFinalPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const [generatingTorsoPrompts, setGeneratingTorsoPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const [finalTorsoPrompts, setFinalTorsoPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const [generatingLegsPrompts, setGeneratingLegsPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const [finalLegsPrompts, setFinalLegsPrompts] = useState({
    corpse1: '', corpse2: '', corpse3: ''
  });

  const currStyle = stylisticReferences[selectedStyle];

  // Helper function to generate a random prompt using Gemini
  const getRandomPrompt = async (type: keyof typeof RANDOM_FALLBACK_PROMPTS): Promise<string> => {
    try {
      return await generateRandomPrompt(type, selectedStyle);
    } catch (error) {
      console.error(`Error generating random ${type} prompt:`, error);
      // Fallback to hardcoded prompts if AI generation fails
      return RANDOM_FALLBACK_PROMPTS[type][Math.floor(Math.random() * RANDOM_FALLBACK_PROMPTS[type].length)];
    }
  };

  // Helper function to generate image from reference
  const generateImageFromReference = async (prompt: string, referencePath: string): Promise<string> => {
    const response = await fetch(referencePath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    return new Promise<string>((resolve, reject) => {
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            
            const generatedImage = await generateBodyPartImage(prompt, dataUrl);
            
            if (generatedImage) {
              resolve(generatedImage);
            } else {
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
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load reference image'));
      };
      
      img.src = objectUrl;
    });
  };

  // Helper function to generate image from existing image
  const generateImageFromExisting = async (prompt: string, baseImage: string): Promise<string> => {
    const generatedImage = await generateBodyPartImage(prompt, baseImage);
    
    if (generatedImage) {
      return generatedImage;
    } else {
      throw new Error('Failed to generate image');
    }
  };

  // Helper function to add generation to specific corpse tracking
  const addGenerationToCorpse = (corpseId: 'corpse1' | 'corpse2' | 'corpse3', image: string) => {
    setCorpseGenerations(prev => ({
      ...prev,
      [corpseId]: [...prev[corpseId], image]
    }));
  };

  // Generate all heads simultaneously
  const generateAllHeads = async (userPrompt: string) => {
    setIsGeneratingHeads(true);
    
    try {
      // Generate random prompts for other corpses using Gemini
      const [randomPrompt1, randomPrompt2] = await Promise.all([
        getRandomPrompt('head'),
        getRandomPrompt('head')
      ]);
      
      setGeneratingPrompts({ 
        corpse1: userPrompt, 
        corpse2: randomPrompt1, 
        corpse3: randomPrompt2 
      });
      setFinalPrompts({ 
        corpse1: userPrompt, 
        corpse2: randomPrompt1, 
        corpse3: randomPrompt2 
      });
      
      const [userHead, randomHead2, randomHead3] = await Promise.all([
        generateImageFromReference(
          IMAGE_PROMPTS.head.replace.replace('{prompt}', userPrompt) + ' ' + currStyle.promptStyle,
          currStyle.path
        ),
        generateImageFromReference(
          IMAGE_PROMPTS.head.replace.replace('{prompt}', randomPrompt1) + ' ' + currStyle.promptStyle,
          currStyle.path
        ),
        generateImageFromReference(
          IMAGE_PROMPTS.head.replace.replace('{prompt}', randomPrompt2) + ' ' + currStyle.promptStyle,
          currStyle.path
        )
      ]);
      
      setCorpseStates(prev => ({
        ...prev,
        corpse1: { ...prev.corpse1, headImage: userHead },
        corpse2: { ...prev.corpse2, headImage: randomHead2 },
        corpse3: { ...prev.corpse3, headImage: randomHead3 }
      }));
      
      // Add generated images to their respective corpse generations
      addGenerationToCorpse('corpse1', userHead);
      addGenerationToCorpse('corpse2', randomHead2);
      addGenerationToCorpse('corpse3', randomHead3);
      
      // Keep the final prompts visible
      // setGeneratingPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } catch (error) {
      console.error('Error generating all heads:', error);
      alert('Error generating heads. Please try again.');
      setGeneratingPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } finally {
      setIsGeneratingHeads(false);
    }
  };

  // Generate all torsos simultaneously
  const generateAllTorsos = async (userPrompt: string) => {
    setIsGeneratingTorsos(true);
    
    try {
      // Generate random prompts for other corpses using Gemini
      const [randomPrompt1, randomPrompt3] = await Promise.all([
        getRandomPrompt('torso'),
        getRandomPrompt('torso')
      ]);
      
      setGeneratingTorsoPrompts({ 
        corpse1: randomPrompt1, 
        corpse2: userPrompt, 
        corpse3: randomPrompt3 
      });
      setFinalTorsoPrompts({ 
        corpse1: randomPrompt1, 
        corpse2: userPrompt, 
        corpse3: randomPrompt3 
      });
      
      const [randomTorso1, userTorso, randomTorso3] = await Promise.all([
        generateImageFromExisting(
          IMAGE_PROMPTS.torso.continue.replace('{prompt}', randomPrompt1) + ' ' + currStyle.promptStyle,
          corpseStates.corpse1.headImage!
        ),
        generateImageFromExisting(
          IMAGE_PROMPTS.torso.continue.replace('{prompt}', userPrompt) + ' ' + currStyle.promptStyle,
          corpseStates.corpse2.headImage!
        ),
        generateImageFromExisting(
          IMAGE_PROMPTS.torso.continue.replace('{prompt}', randomPrompt3) + ' ' + currStyle.promptStyle,
          corpseStates.corpse3.headImage!
        )
      ]);
      
      setCorpseStates(prev => ({
        ...prev,
        corpse1: { ...prev.corpse1, torsoImage: randomTorso1 },
        corpse2: { ...prev.corpse2, torsoImage: userTorso },
        corpse3: { ...prev.corpse3, torsoImage: randomTorso3 }
      }));
      
      // Add generated images to their respective corpse generations
      addGenerationToCorpse('corpse1', randomTorso1);
      addGenerationToCorpse('corpse2', userTorso);
      addGenerationToCorpse('corpse3', randomTorso3);
      
      // Keep the final prompts visible
      // setGeneratingTorsoPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } catch (error) {
      console.error('Error generating all torsos:', error);
      alert('Error generating torsos. Please try again.');
      setGeneratingTorsoPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } finally {
      setIsGeneratingTorsos(false);
    }
  };

  // Generate all legs simultaneously
  const generateAllLegs = async (userPrompt: string) => {
    setIsGeneratingLegs(true);
    
    try {
      // Generate random prompts for other corpses using Gemini
      const [randomPrompt1, randomPrompt2] = await Promise.all([
        getRandomPrompt('legs'),
        getRandomPrompt('legs')
      ]);
      
      setGeneratingLegsPrompts({ 
        corpse1: randomPrompt1, 
        corpse2: randomPrompt2, 
        corpse3: userPrompt 
      });
      setFinalLegsPrompts({ 
        corpse1: randomPrompt1, 
        corpse2: randomPrompt2, 
        corpse3: userPrompt 
      });
      
      const [randomLegs1, randomLegs2, userLegs] = await Promise.all([
        generateImageFromExisting(
          IMAGE_PROMPTS.legs.continue.replace('{prompt}', randomPrompt1) + ' ' + currStyle.promptStyle,
          corpseStates.corpse1.torsoImage!
        ),
        generateImageFromExisting(
          IMAGE_PROMPTS.legs.continue.replace('{prompt}', randomPrompt2) + ' ' + currStyle.promptStyle,
          corpseStates.corpse2.torsoImage!
        ),
        generateImageFromExisting(
          IMAGE_PROMPTS.legs.continue.replace('{prompt}', userPrompt) + ' ' + currStyle.promptStyle,
          corpseStates.corpse3.torsoImage!
        )
      ]);
      
      setCorpseStates(prev => ({
        ...prev,
        corpse1: { ...prev.corpse1, legsImage: randomLegs1 },
        corpse2: { ...prev.corpse2, legsImage: randomLegs2 },
        corpse3: { ...prev.corpse3, legsImage: userLegs }
      }));
      
      // Add generated images to their respective corpse generations
      addGenerationToCorpse('corpse1', randomLegs1);
      addGenerationToCorpse('corpse2', randomLegs2);
      addGenerationToCorpse('corpse3', userLegs);
      
      // Keep the final prompts visible
      // setGeneratingLegsPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } catch (error) {
      console.error('Error generating all legs:', error);
      alert('Error generating legs. Please try again.');
      setGeneratingLegsPrompts({ corpse1: '', corpse2: '', corpse3: '' });
    } finally {
      setIsGeneratingLegs(false);
    }
  };

  // Update a specific corpse's state
  const updateCorpseState = (corpseId: 'corpse1' | 'corpse2' | 'corpse3', bodyPart: 'head' | 'torso' | 'legs', image: string) => {
    setCorpseStates(prev => ({
      ...prev,
      [corpseId]: {
        ...prev[corpseId],
        [bodyPart + 'Image']: image
      }
    }));
    
    // Add to this specific corpse's generations tracking
    addGenerationToCorpse(corpseId, image);
  };

  // Reset all state when style changes
  useEffect(() => {
    const resetState = {
      headImage: null, torsoImage: null, legsImage: null
    };
    
    setCorpseStates({
      corpse1: resetState,
      corpse2: resetState,
      corpse3: resetState
    });
    
    // Reset individual corpse generations
    setCorpseGenerations({
      corpse1: [],
      corpse2: [],
      corpse3: []
    });
    
    const resetPrompts = { corpse1: '', corpse2: '', corpse3: '' };
    setGeneratingPrompts(resetPrompts);
    setFinalPrompts(resetPrompts);
    setGeneratingTorsoPrompts(resetPrompts);
    setFinalTorsoPrompts(resetPrompts);
    setGeneratingLegsPrompts(resetPrompts);
    setFinalLegsPrompts(resetPrompts);
  }, [selectedStyle]);

  const renderCorpseColumn = (corpseId: 'corpse1' | 'corpse2' | 'corpse3', title: string) => (
    <div className="w-96 flex-shrink-0">
     
      <div className="w-full">
        <OneColumn 
          selectedStyle={selectedStyle}
          corpseId={corpseId}
          headImage={corpseStates[corpseId].headImage}
          torsoImage={corpseStates[corpseId].torsoImage}
          legsImage={corpseStates[corpseId].legsImage}
          onHeadGenerated={(image) => updateCorpseState(corpseId, 'head', image)}
          onTorsoGenerated={(image) => updateCorpseState(corpseId, 'torso', image)}
          onLegsGenerated={(image) => updateCorpseState(corpseId, 'legs', image)}
          onGenerateHead={generateAllHeads}
          onGenerateTorso={generateAllTorsos}
          onGenerateLegs={generateAllLegs}
          isGeneratingHeads={isGeneratingHeads}
          isGeneratingTorsos={isGeneratingTorsos}
          isGeneratingLegs={isGeneratingLegs}
          generatingHeadPrompt={generatingPrompts[corpseId]}
          finalHeadPrompt={finalPrompts[corpseId]}
          generatingTorsoPrompt={generatingTorsoPrompts[corpseId]}
          finalTorsoPrompt={finalTorsoPrompts[corpseId]}
          generatingLegsPrompt={generatingLegsPrompts[corpseId]}
          finalLegsPrompt={finalLegsPrompts[corpseId]}
          isReadOnly={false}
          corpseGenerations={corpseGenerations[corpseId]}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col mt-10 items-center justify-center w-full">
      <div className="flex gap-[100px] w-full max-w-8xl px-8 justify-center">
        {renderCorpseColumn('corpse1', 'Corpse 1')}
        {renderCorpseColumn('corpse2', 'Corpse 2')}
        {renderCorpseColumn('corpse3', 'Corpse 3')}
      </div>
    </div>
  );
};

export default ThreeCorpse; 