import { GoogleGenAI } from "@google/genai";

// Define interfaces for color responses
interface ColorResponse {
  colorName: string;
  hexCode: string;
  description: string;
  category?: string;
}

interface ColorResult extends ColorResponse {
  originalInput: string;
  error: string | null;
}

// New validation function to check if the query is color-related
async function validateColorQuery(
  query: string,
  ai: GoogleGenAI
): Promise<{ valid: boolean; reason?: string }> {
  const validationPrompt = `
  Given this user query: "${query}"
  
  Determine if this query is asking for COLOR recommendations or is describing COLORS.
  Respond with a JSON object in this format:
  {
    "valid": boolean,
    "reason": "explanation why this is or isn't valid"
  }
  
  GUIDELINES:
  - "valid": true if the query mentions specific colors, color schemes, color palettes, or is clearly asking for visual design colors
  - "valid": false if the query doesn't mention colors or is asking for something unrelated to visual colors
  - The explanation should be brief (10 words max)
  `;

  try {
    const validationResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: validationPrompt }],
    });

    const responseText: string = validationResponse.text || '';

    // Extract and parse JSON
    let jsonText = responseText;
    if (responseText.includes('{') && responseText.includes('}')) {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      jsonText = responseText.substring(jsonStart, jsonEnd);
    }

    const result = JSON.parse(jsonText);
    return {
      valid: result.valid,
      reason: result.reason
    };
  } catch (error) {
    console.error("Error validating color query:", error);
    return {
      valid: false,
      reason: "Error processing validation"
    };
  }
}

// Enhanced function to process a single color with validation
export async function getColorFromText(colorDescription: string): Promise<ColorResponse> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Google AI API key not found in environment variables');

    const ai = new GoogleGenAI({ apiKey });

    const validation = await validateColorQuery(colorDescription, ai);
    if (!validation.valid) {
      throw new Error(`This doesn't seem to be about colors: ${validation.reason}. Please describe a color like "forest green" or "warm sunset orange".`);
    }

    const prompt = `
    Given this color description: "${colorDescription}"

    I want you to identify the exact color being described and respond only with a JSON object in this exact format, with no additional text:
    {
      "colorName": "the most accurate color name",
      "hexCode": "the hex code (e.g., #FF5733)",
      "description": "a very brief description of the color (20 words max)"
    }

    If this doesn't describe a color at all, respond with:
    {
      "error": "Not a valid color description"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: prompt }],
    });

    const responseText: string = response.text || '';
    if (!responseText) throw new Error('Empty response from AI');

    let jsonText = responseText;
    if (responseText.includes('{') && responseText.includes('}')) {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      jsonText = responseText.substring(jsonStart, jsonEnd);
    }

    const parsedResponse = JSON.parse(jsonText);

    if (parsedResponse.error) {
      throw new Error(parsedResponse.error);
    }

    return parsedResponse as ColorResponse;

  } catch (error) {
    console.error("Error getting color from text:", error);
    throw error;
  }
}

export async function getMultipleColorsFromText(colorDescriptions: string[]): Promise<ColorResult[]> {
  const batchSize = 5;
  const results: ColorResult[] = [];

  for (let i = 0; i < colorDescriptions.length; i += batchSize) {
    const batch = colorDescriptions.slice(i, i + batchSize);

    const batchPromises = batch.map(async (description) => {
      try {
        const result = await getColorFromText(description);
        return {
          originalInput: description,
          ...result,
          error: null
        } as ColorResult;
      } catch (error) {
        console.error(`Error processing color "${description}":`, error);
        return {
          originalInput: description,
          colorName: "",
          hexCode: "",
          description: "",
          error: error instanceof Error ? error.message : 'Unknown error'
        } as ColorResult;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + batchSize < colorDescriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

export async function getColorSuggestions(query: string): Promise<ColorResult[]> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Google AI API key not found in environment variables');

    const ai = new GoogleGenAI({ apiKey });

    const validation = await validateColorQuery(query, ai);
    if (!validation.valid) {
      throw new Error(`This doesn't seem to be about colors: ${validation.reason}. Try asking for something like "colors for a beach-themed bedroom" or "professional outfit colors".`);
    }

    const colorPrompt = `
    I need color recommendations for: "${query}"

    Please respond ONLY with a JSON array in this format:
    [
      {
        "colorName": "name of the suggested color",
        "hexCode": "the hex code (e.g., #FF5733)",
        "description": "a very brief description of the color's visual quality (15 words max)",
        "category": "context-specific category based on the query"
      },
      ... more colors ...
    ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: colorPrompt }],
    });

    const responseText: string = response.text || '';
    if (!responseText) throw new Error('Empty response from AI');

    let jsonText = responseText;
    if (responseText.includes('[') && responseText.includes(']')) {
      const jsonStart = responseText.indexOf('[');
      const jsonEnd = responseText.lastIndexOf(']') + 1;
      jsonText = responseText.substring(jsonStart, jsonEnd);
    }

    const colorSuggestions = JSON.parse(jsonText) as ColorResponse[];

    return colorSuggestions.map((suggestion: ColorResponse) => ({
      originalInput: suggestion.colorName,
      colorName: suggestion.colorName,
      hexCode: suggestion.hexCode,
      description: suggestion.description,
      category: suggestion.category || 'Suggested Colors',
      error: null
    }));
  } catch (error) {
    console.error("Error getting color suggestions:", error);
    throw error;
  }
}
