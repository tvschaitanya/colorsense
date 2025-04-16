// src/lib/googleai.ts
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
async function validateColorQuery(query: string, ai: any): Promise<{ valid: boolean, reason?: string }> {
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

    const responseText = validationResponse.text || '';

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
    // Default to invalid if there's an error
    return {
      valid: false,
      reason: "Error processing validation"
    };
  }
}

// Enhanced function to process a single color with validation
export async function getColorFromText(colorDescription: string): Promise<ColorResponse> {
  try {
    // Check for API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('Google AI API key not found in environment variables');
    }

    // Initialize the Google AI client with the new SDK
    const ai = new GoogleGenAI({ apiKey });

    // Validate if the input is color-related
    const validation = await validateColorQuery(colorDescription, ai);
    if (!validation.valid) {
      throw new Error(`This doesn't seem to be about colors: ${validation.reason}. Please describe a color like "forest green" or "warm sunset orange".`);
    }

    // Create the prompt for the model - improved to handle more complex descriptions
    const prompt = `
    Given this color description: "${colorDescription}"
    
    I want you to identify the exact color being described and respond only with a JSON object in this exact format, with no additional text:
    {
      "colorName": "the most accurate color name",
      "hexCode": "the hex code (e.g., #FF5733)",
      "description": "a very brief description of the color (20 words max)"
    }
    
    Be precise - if the input is a specific named color (like "terracotta" or "sage green"), make sure your response matches that exact color.
    For longer or complex descriptions, extract the core color concept.
    If this doesn't describe a color at all, respond with:
    {
      "error": "Not a valid color description"
    }
    `;

    // Generate content using the new SDK format
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: prompt }],
    });

    // Get the text from the response
    const responseText = response.text || '';

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response
    try {
      // Try to extract JSON if it's not in the right format
      let jsonText = responseText;
      if (responseText.includes('{') && responseText.includes('}')) {
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        jsonText = responseText.substring(jsonStart, jsonEnd);
      }

      const parsedResponse = JSON.parse(jsonText);

      // Check if the response contains an error
      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }

      return parsedResponse as ColorResponse;
    } catch (error) {
      if (error instanceof Error && error.message === "Not a valid color description") {
        throw error;
      }
      console.error("Failed to parse response:", responseText);
      throw new Error("Invalid response format from AI");
    }
  } catch (error) {
    console.error("Error getting color from text:", error);
    throw error;
  }
}

// Function to process multiple colors - adding validation to this function
export async function getMultipleColorsFromText(colorDescriptions: string[]): Promise<ColorResult[]> {
  // Process each color description in parallel with rate limiting
  // This helps prevent API rate limit issues with large batches
  const batchSize = 5; // Process 5 colors at a time
  const results: ColorResult[] = [];

  for (let i = 0; i < colorDescriptions.length; i += batchSize) {
    const batch = colorDescriptions.slice(i, i + batchSize);

    // Process each color in the current batch in parallel
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

    // Wait for the current batch to complete before moving to the next
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add a small delay between batches to avoid rate limits if needed
    if (i + batchSize < colorDescriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Enhanced function to get color suggestions with better validation
export async function getColorSuggestions(query: string): Promise<ColorResult[]> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error('Google AI API key not found in environment variables');
    }

    // Initialize the Google AI client
    const ai = new GoogleGenAI({ apiKey });

    // Enhanced validation for suggestion queries
    const validation = await validateColorQuery(query, ai);
    if (!validation.valid) {
      throw new Error(`This doesn't seem to be about colors: ${validation.reason}. Try asking for color suggestions for a specific purpose like "colors for a beach-themed bedroom" or "professional outfit colors".`);
    }

    // The color suggestion prompt - keeping the original prompt as it's well designed
    const colorPrompt = `
    I need color recommendations for: "${query}"
    
    Please analyze the query and suggest 5-8 appropriate colors, responding ONLY with a JSON array in this exact format, with NO additional text or content:
    [
      {
        "colorName": "name of the suggested color",
        "hexCode": "the hex code (e.g., #FF5733)",
        "description": "a very brief description of the color's visual quality (15 words max)",
        "category": "context-specific category based on the query (e.g., if query mentions 'shirt and pants', use categories like 'Shirt Colors' or 'Pant Colors'; if query is about 'living room', use categories like 'Wall Colors', 'Accent Colors', etc.)"
      },
      ... more colors ...
    ]
    
    IMPORTANT GUIDELINES:
    - Create SPECIFIC, CONTEXTUAL categories based directly on what was mentioned in the query
    - If query mentions specific items (e.g., "shirt and pants"), assign each color to the most appropriate item-specific category
    - If query is about a room/space, use appropriate categories for that context (e.g., "Wall Colors", "Accent Colors")
    - If query is about a color palette or theme, use descriptive categories that fit that theme
    - Focus ONLY on visual color properties in the description field
    - The description should ONLY describe the color's visual appearance (e.g., "deep blue with subtle green undertones")
    - DO NOT include any advice, recommendations, fashion tips, or non-color information
    `;

    // Generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: colorPrompt }],
    });

    // Get the text from the response
    const responseText = response.text || '';

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response
    try {
      // Try to extract JSON if it's not in the right format
      let jsonText = responseText;
      if (responseText.includes('[') && responseText.includes(']')) {
        const jsonStart = responseText.indexOf('[');
        const jsonEnd = responseText.lastIndexOf(']') + 1;
        jsonText = responseText.substring(jsonStart, jsonEnd);
      }

      // Parse the JSON
      const colorSuggestions = JSON.parse(jsonText) as ColorResponse[];

      // Add originalInput field to match the interface of getMultipleColorsFromText
      return colorSuggestions.map((suggestion: ColorResponse) => ({
        originalInput: suggestion.colorName,
        colorName: suggestion.colorName,
        hexCode: suggestion.hexCode,
        description: suggestion.description,
        category: suggestion.category || 'Suggested Colors',
        error: null
      }));
    } catch (error) {
      console.error("Failed to parse response:", responseText, error);
      throw new Error("Invalid response format from AI");
    }
  } catch (error) {
    console.error("Error getting color suggestions:", error);
    throw error;
  }
}