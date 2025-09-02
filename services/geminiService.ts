import { GoogleGenAI, Modality } from "@google/genai";
import { promptGenSysInstruct } from "@/constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBodyPartImage = async (
  prompt: string,
  referenceImage?: string,
  canvasImage?: string
): Promise<string | null> => {
  try {
    console.log('generateBodyPartImage prompt:', prompt);
    
    const parseDataUri = (dataUri: string) => {
      const match = dataUri.match(/^data:(.*?);base64,(.*)$/);
      if (!match) return null;
      return { mimeType: match[1], data: match[2] };
    };

    let parts: any[] = [{ text: prompt }];

    if (referenceImage) {
      const imageInfo = parseDataUri(referenceImage);
      if (imageInfo) {
        parts.push({ inlineData: { mimeType: imageInfo.mimeType, data: imageInfo.data } });
      }
    }
    
    if (canvasImage) {
        const imageInfo = parseDataUri(canvasImage);
        if (imageInfo) {
          parts.push({ inlineData: { mimeType: imageInfo.mimeType, data: imageInfo.data } });
        }
      }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      console.warn("No content parts in response for body part generation");
      return null;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
  return null;
};

export const generateRandomPrompt = async (
  bodyPart: 'head' | 'torso' | 'legs',
  style: 'noir' | 'watercolor'
): Promise<string> => {
  try {
    const prompt = `Generate a creative prompt for a ${bodyPart}`;

    console.log(`Generating random prompt for ${bodyPart} in ${style} style...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: promptGenSysInstruct
      },
    });

    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from Gemini');
    }

    let generatedPrompt = response.candidates[0].content.parts[0].text.trim();
    
    generatedPrompt = generatedPrompt
      .replace(/^(Head|Torso|Legs):\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
    
    console.log(`Generated prompt for ${bodyPart} (${style}): "${generatedPrompt}"`);
    
    const fallbackPrompts = {
      head: {
        noir: 'a detective with a magnifying glass monocle',
        watercolor: 'a fairy with butterfly antennae and flower eyes'
      },
      torso: {
        noir: 'a chest with a pocket watch and chain',
        watercolor: 'a body made of swirling rainbow clouds'
      },
      legs: {
        noir: 'legs with spats and tap dance shoes',
        watercolor: 'legs that fade into rainbow mist'
      }
    };

    if (generatedPrompt.length > 80 || generatedPrompt.includes('I cannot') || generatedPrompt.includes('I am unable') || generatedPrompt.length < 5) {
      console.log(`Using fallback prompt for ${bodyPart} (${style}): "${fallbackPrompts[bodyPart][style]}"`);
      return fallbackPrompts[bodyPart][style];
    }

    return generatedPrompt;
  } catch (error) {
    console.error("Error generating random prompt:", error);
    
    const fallbackPrompts = {
      head: {
        noir: 'a detective with a magnifying glass monocle',
        watercolor: 'a fairy with butterfly antennae and flower eyes'
      },
      torso: {
        noir: 'a chest with a pocket watch and chain',
        watercolor: 'a body made of swirling rainbow clouds'
      },
      legs: {
        noir: 'legs with spats and tap dance shoes',
        watercolor: 'legs that fade into rainbow mist'
      }
    };
    
    console.log(`Using fallback prompt due to error for ${bodyPart} (${style}): "${fallbackPrompts[bodyPart][style]}"`);
    return fallbackPrompts[bodyPart][style];
  }
};
