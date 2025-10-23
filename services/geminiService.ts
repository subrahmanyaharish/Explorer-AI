import { GoogleGenAI } from "@google/genai";
import type { GroundingChunk } from '../types';

// The API key is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getTravelInfo = async (location: string): Promise<{ text: string; groundingChunks: GroundingChunk[] }> => {
  const prompt = `
Provide a comprehensive travel guide for "${location}". Use Google Search to find the most up-to-date information for all sections.

Your response MUST be in Markdown format and STRICTLY follow this structure, including the exact headers:

# Weather
- **Temperature:** [Current temperature in Celsius]
- **Condition:** [e.g., Sunny, Cloudy, Rain]
- **Humidity:** [Percentage]
- **Wind Speed:** [in km/h]

# Air Quality Index (AQI)
- **AQI Value:** [Numeric value]
- **Category:** [e.g., Good, Moderate, Unhealthy]

# Recommended Clothing
- [Clothing item 1]
- [Clothing item 2]
- [Clothing item 3]

# Places to Visit
1. **[Place Name 1]:** [Direct Google Maps link]
2. **[Place Name 2]:** [Direct Google Maps link]
3. **[Place Name 3]:** [Direct Google Maps link]

Ensure all information is current and accurate. Do not add any introductory or concluding text outside of this structure.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (!text) {
      throw new Error("Received an empty response from the API.");
    }
    
    return { text, groundingChunks: groundingChunks as GroundingChunk[] };
  } catch (error) {
    console.error("Error fetching travel info:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch travel information: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching travel information.");
  }
};