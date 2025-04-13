// src/app/api/color/route.ts
import { getColorFromText, getMultipleColorsFromText } from '@/lib/googleai';
import { NextRequest, NextResponse } from 'next/server';

interface ErrorObject {
  message: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { colorDescription, colorDescriptions } = body;

    // Check if we have a single color or multiple colors
    if (colorDescriptions && Array.isArray(colorDescriptions)) {
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
        { error: 'Color description is required' },
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