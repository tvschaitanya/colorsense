// src/lib/googleai.ts
import { GoogleGenAI } from "@google/genai";

// Function to process a single color
export async function getColorFromText(colorDescription: string) {
  try {
    // Check for API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key not found in environment variables');
    }
    
    // Initialize the Google AI client with the new SDK
    const ai = new GoogleGenAI({ apiKey });
    
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
    `;

    // Generate content using the new SDK format
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
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
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Failed to parse response:", responseText);
      throw new Error("Invalid response format from AI");
    }
  } catch (error) {
    console.error("Error getting color from text:", error);
    throw error;
  }
}

// Function to process multiple colors
export async function getMultipleColorsFromText(colorDescriptions: string[]) {
  // Process each color description in parallel with rate limiting
  // This helps prevent API rate limit issues with large batches
  const batchSize = 5; // Process 5 colors at a time
  const results = [];
  
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
        };
      } catch (error) {
        console.error(`Error processing color "${description}":`, error);
        return {
          originalInput: description,
          colorName: null,
          hexCode: null,
          description: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
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