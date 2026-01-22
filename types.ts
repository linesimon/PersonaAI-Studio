
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  size: '1K' | '2K' | '4K';
}

export interface CharacterDNA {
  species: string;
  style: string;
  features: string[];
  basePrompt: string;
}

export enum AppView {
  CREATOR = 'creator',
  STUDIO = 'studio',
  GALLERY = 'gallery'
}
