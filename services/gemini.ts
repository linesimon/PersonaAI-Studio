
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private static getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateCharacterImage(prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image generated');
  }

  static async editImage(base64Image: string, editPrompt: string): Promise<string> {
    const ai = this.getClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png',
            },
          },
          { text: editPrompt },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('Editing failed');
  }

  static async hasKey(): Promise<boolean> {
    // Check if the specialized AI Studio key selector has been used
    return await (window as any).aistudio?.hasSelectedApiKey();
  }

  static async openKeySelector() {
    await (window as any).aistudio?.openSelectKey();
  }
}
