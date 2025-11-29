import { GoogleGenAI, Type } from "@google/genai";
import { MaterialItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateEquipmentList = async (jobDescription: string, jobType: string): Promise<MaterialItem[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing for Gemini");
    return [];
  }

  try {
    const prompt = `
      Sei un esperto direttore tecnico per eventi (Audio, Video, Luci).
      Analizza la seguente richiesta di lavoro e genera una lista tecnica di materiale necessario.
      
      Tipo Evento: ${jobType}
      Descrizione: ${jobDescription}
      
      Restituisci solo un array JSON valido con oggetti che hanno proprietà: name (string), category ('Audio'|'Video'|'Luci'|'Strutture'), quantity (number).
      Stima le quantità in modo realistico.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    quantity: { type: Type.NUMBER }
                }
            }
        }
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const rawData = JSON.parse(jsonText);
    
    // Map and add IDs
    return rawData.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      name: item.name,
      category: ['Audio', 'Video', 'Luci', 'Strutture'].includes(item.category) ? item.category : 'Strutture',
      quantity: item.quantity || 1
    }));

  } catch (error) {
    console.error("Error generating equipment list:", error);
    return [];
  }
};