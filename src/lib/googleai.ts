import { GoogleGenAI } from "@google/genai";

// Enhanced interfaces to handle broader color contexts
interface ColorResponse {
  colorName: string;
  hexCode: string;
  description: string;
  category?: string;
  contextApplied?: string; // NEW: explains how color relates to input
  rationale?: string;      // NEW: why this color fits the context
}

interface ColorResult extends ColorResponse {
  originalInput: string;
  error: string | null;
}

// Enhanced validation function for implicit and explicit color contexts
async function validateColorQuery(
  query: string,
  ai: GoogleGenAI
): Promise<{ valid: boolean; reason?: string; colorContext?: string }> {
  const validationPrompt = `
  Given this user query: "${query}"
  
  Determine if this query is DIRECTLY or INDIRECTLY related to colors, color recommendations, visual aesthetics, or design choices where color would be a significant factor.
  
  Respond with a JSON object in this format:
  {
    "valid": boolean,
    "reason": "explanation why this is or isn't valid",
    "colorContext": "what color context is implied if not explicit"
  }
  
  GUIDELINES FOR DETERMINING COLOR RELEVANCE:
  - VALID contexts include (but are not limited to):
    * Explicit color mentions (e.g., "blue sky", "red dress")
    * Design contexts (e.g., "wedding theme", "website design", "logo for coffee shop")
    * Mood/feeling requests (e.g., "calming bedroom", "energetic presentation")
    * Nature references (e.g., "autumn forest", "ocean sunset")
    * Brand identity (e.g., "tech startup branding", "luxury fashion palette")
    * Cultural references (e.g., "Scandinavian style", "Bohemian aesthetic")
    * Seasonal references (e.g., "summer vibes", "winter holiday")
    * Material references where color is important (e.g., "marble countertop", "wood paneling")
    * Time of day (e.g., "midnight", "sunrise", "golden hour")
    * Foods and beverages (e.g., "coffee", "strawberry", "mint")
    * Emotions (e.g., "passionate", "serene", "melancholic")
  
  - INVALID contexts are those completely unrelated to visual design or appearance
  
  - For indirect references, identify the IMPLIED color context
  `;

  try {
    const validationResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite", // Keeping original model for compatibility
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
      reason: result.reason,
      colorContext: result.colorContext || undefined
    };
  } catch (error) {
    console.error("Error validating color query:", error);
    return {
      valid: true, // Default to true in case of error to avoid frustrating users
      reason: "Proceeding with possible color context"
    };
  }
}

// Enhanced color extraction with broader context understanding
export async function getColorFromText(colorDescription: string): Promise<ColorResponse> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Google AI API key not found in environment variables');

    const ai = new GoogleGenAI({ apiKey });

    const validation = await validateColorQuery(colorDescription, ai);
    
    // If invalid but has color context, use that context
    const contextToUse = !validation.valid && validation.colorContext 
                         ? `${colorDescription} (implied context: ${validation.colorContext})` 
                         : colorDescription;

    const prompt = `
    Given this description: "${contextToUse}"

    I want you to identify or suggest an appropriate color based on this input. The input might be:
    1. A direct color description like "forest green"
    2. A mood/feeling like "calming" or "energetic" 
    3. A theme like "beach" or "corporate"
    4. A physical object or material like "terracotta" or "marble"
    5. A brand or style reference like "Scandinavian" or "Art Deco"
    6. A time of day or seasonal reference like "sunrise" or "autumn"
    7. A food or beverage like "coffee" or "blueberry"
    8. An emotion like "joy" or "melancholy"
    
    Respond only with a JSON object in this exact format, with no additional text:
    {
      "colorName": "the most accurate color name",
      "hexCode": "the hex code (e.g., #FF5733)",
      "description": "a very brief description of the color (20 words max)",
      "contextApplied": "explanation of how the color relates to the input (25 words max)"
    }

    If this doesn't reasonably relate to any possible color context even with creative interpretation, respond with:
    {
      "error": "Unable to determine color relevance"
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite", // Keeping original model for compatibility
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

    return {
      colorName: parsedResponse.colorName,
      hexCode: parsedResponse.hexCode,
      description: parsedResponse.description,
      contextApplied: parsedResponse.contextApplied
    } as ColorResponse;

  } catch (error) {
    console.error("Error getting color from text:", error);
    throw error;
  }
}

// Original function with minimal changes to maintain compatibility
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

// Enhanced color suggestions with broader context understanding
export async function getColorSuggestions(query: string): Promise<ColorResult[]> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Google AI API key not found in environment variables');

    const ai = new GoogleGenAI({ apiKey });

    const validation = await validateColorQuery(query, ai);
    
    // Use the implied context if available
    const contextToUse = !validation.valid && validation.colorContext 
                        ? `${query} (implied context: ${validation.colorContext})` 
                        : query;

    const colorPrompt = `
    I need color recommendations for: "${contextToUse}"

    This request might be directly about colors, or it could be about a theme, mood, brand, style, material, 
    season, time of day, food, emotion, or any other context where color would be relevant.
    
    Even if the request doesn't explicitly mention colors, please interpret the color context and provide appropriate suggestions.
    
    Please respond ONLY with a JSON array in this format:
    [
      {
        "colorName": "name of the suggested color",
        "hexCode": "the hex code (e.g., #FF5733)",
        "description": "a very brief description of the color's visual quality (15 words max)",
        "category": "context-specific category based on the query",
        "rationale": "why this color works for the context (20 words max)"
      },
      ... more colors ...
    ]
    
    Provide 3-5 colors that would work well together in the context provided.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite", // Keeping original model for compatibility
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
      originalInput: query,
      colorName: suggestion.colorName,
      hexCode: suggestion.hexCode,
      description: suggestion.description,
      category: suggestion.category || 'Suggested Colors',
      rationale: suggestion.rationale || '',
      error: null
    }));
  } catch (error) {
    console.error("Error getting color suggestions:", error);
    throw error;
  }
}