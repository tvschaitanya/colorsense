// src/app/api/color/route.ts
import { getColorFromText, getMultipleColorsFromText, getColorSuggestions } from '@/lib/googleai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { colorDescription, colorDescriptions, suggestionQuery } = body;

    // Check if we have a suggestion query
    if (suggestionQuery) {
      // Handle color suggestions based on query
      const suggestions = await getColorSuggestions(suggestionQuery);
      return NextResponse.json({ results: suggestions });
    }
    // Check if we have a single color or multiple colors
    else if (colorDescriptions && Array.isArray(colorDescriptions)) {
      // Handle multiple colors
      if (colorDescriptions.length === 0) {
        return NextResponse.json(
          { error: 'No color descriptions provided' },
          { status: 400 }
        );
      }

      // Process all colors
      const results = await getMultipleColorsFromText(colorDescriptions);
      return NextResponse.json({ results });

    } else if (colorDescription) {
      // Handle single color (for backward compatibility)
      const colorInfo = await getColorFromText(colorDescription);
      return NextResponse.json(colorInfo);

    } else {
      return NextResponse.json(
        { error: 'Either color description or suggestion query is required' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process color request';
    console.error('Error processing color request:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}