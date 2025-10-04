
import { GoogleGenAI, Type } from "@google/genai";
import { type Simulation } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Price fetching will use a local fallback randomizer.");
} else {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client, falling back to local randomizer.', err);
    ai = null;
  }
}

export const fetchMockTokenPrices = async (simulation: Simulation): Promise<{ priceA: number; priceB: number }> => {
  // If no API client, fallback to a simple randomized price generator
  if (!ai) {
    const priceA = simulation.latestPriceA * (1 + (Math.random() - 0.5) * 0.1); // +/- ~5% change
    const priceB = simulation.latestPriceB * (1 + (Math.random() - 0.5) * 0.02); // +/- ~1% change for stablecoin
    return { priceA: parseFloat(priceA.toFixed(2)), priceB: parseFloat(priceB.toFixed(4)) };
  }

  const prompt = `
    You are a financial market simulator for a crypto trading application.
    Given the following token pair and their current prices, generate a plausible new set of prices that would reflect a few hours of market activity.
    Token A: ${simulation.tokenA} at $${simulation.latestPriceA}
    Token B: ${simulation.tokenB} at $${simulation.latestPriceB}
    
    Consider that ${simulation.tokenA} is likely more volatile than ${simulation.tokenB}. If Token B looks like a stablecoin (e.g., USDC, USDT), its price should remain very close to $1.00.
    
    Provide only the JSON object in your response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priceA: {
              type: Type.NUMBER,
              description: `New price for ${simulation.tokenA}`
            },
            priceB: {
              type: Type.NUMBER,
              description: `New price for ${simulation.tokenB}`
            },
          },
          required: ["priceA", "priceB"],
        },
      },
    });

    const jsonText = response.text.trim();
    const prices = JSON.parse(jsonText);

    return {
      priceA: prices.priceA,
      priceB: prices.priceB,
    };
  } catch (error) {
    console.error("Error fetching prices from Gemini API:", error);
    // Fallback to randomizer on API error
    const priceA = simulation.latestPriceA * (1 + (Math.random() - 0.5) * 0.1);
    const priceB = simulation.latestPriceB * (1 + (Math.random() - 0.5) * 0.02);
    return { priceA: parseFloat(priceA.toFixed(2)), priceB: parseFloat(priceB.toFixed(4)) };
  }
};
