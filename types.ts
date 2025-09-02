export interface CorpseImages {
  heads: string[];
  torsos: string[];
  legs: string[];
}

export type ImagePartType = 'head' | 'torso' | 'leg';

export interface CorpseIndices {
  head: number;
  torso: number;
  leg: number;
}
