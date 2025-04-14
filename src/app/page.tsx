// src/app/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define our interfaces
interface ParsedColor {
  color: string;
  category?: string;
}

interface ColorResult {
  originalInput: string;
  colorName: string;
  hexCode: string;
  description: string;
  category?: string;
  error: string | null;
}

// Define an interface for API response
interface ColorApiResponse {
  colorName: string;
  hexCode: string;
  description: string;
  [key: string]: unknown;
}

export default function Home() {
  const [colorInput, setColorInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{
    colorName: string;
    hexCode: string;
    description: string;
  } | null>(null);
  const [multiResults, setMultiResults] = useState<ColorResult[] | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"describe" | "suggest">("describe");
  const [suggestionQuery, setSuggestionQuery] = useState("");

  // Enhanced color parsing function
  const parseStructuredColorInput = (input: string): ParsedColor[] => {
    // Split the input into lines
    const lines = input.split(/\n+/).filter((line) => line.trim() !== "");

    if (lines.length <= 1) {
      // If no multiple lines, just use the old parser logic
      return parseMultipleColors(input).map((color) => ({ color }));
    }

    const results: ParsedColor[] = [];
    let currentCategory: string | undefined = undefined;

    // Process each line
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this line is a category header (ends with colon)
      if (trimmedLine.includes(":")) {
        const [category] = trimmedLine.split(":");
        currentCategory = category.trim();

        // Extract colors from the rest of this line after the colon
        const colorsInThisLine = trimmedLine
          .split(":")
          .slice(1)
          .join(":")
          .split(/,|and/)
          .map((s) => s.trim())
          .filter((s) => s !== "");

        // Add these colors with the current category
        colorsInThisLine.forEach((color) => {
          if (color) results.push({ color, category: currentCategory });
        });
      } else {
        // This line contains colors without a category header on this line
        // Split by commas or "and"
        const colors = trimmedLine
          .split(/,|and/)
          .map((s) => s.trim())
          .filter((s) => s !== "");

        // Add these colors with the current category
        colors.forEach((color) => {
          if (color) results.push({ color, category: currentCategory });
        });
      }
    }

    // If no results were found, fall back to the original parser
    if (results.length === 0) {
      return parseMultipleColors(input).map((color) => ({ color }));
    }

    return results;
  };

  // Keep the old parser as a fallback
  const parseMultipleColors = (input: string): string[] => {
    // Split by new lines first
    let colors = input.split(/\n+/).filter((line) => line.trim() !== "");

    // If no new lines, check for bullet points or asterisks
    if (colors.length <= 1) {
      colors = input.split(/[•*-]\s*/).filter((line) => line.trim() !== "");
    }

    // If still no multiple items, check for commas
    if (colors.length <= 1) {
      colors = input.split(/,\s*/).filter((line) => line.trim() !== "");
    }

    // If we only have one entry (or empty), return the original input as a single item
    return colors.length >= 1 ? colors : [input];
  };

  const handleDescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!colorInput.trim()) {
      setError("Please enter a color description");
      return;
    }

    setIsLoading(true);
    setError("");
    setSingleResult(null);
    setMultiResults(null);

    try {
      // Parse color inputs with the new parser
      const parsedColors = parseStructuredColorInput(colorInput);
      const isMultiColor = parsedColors.length > 1;

      if (isMultiColor) {
        // Process multiple colors
        const colorDescriptions = parsedColors.map((pc) => pc.color);
        const response = await fetch("/api/color", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ colorDescriptions }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get color information");
        }

        // Add categories to results
        const resultsWithCategories = data.results.map(
          (result: ColorApiResponse, index: number) => ({
            ...result,
            category: parsedColors[index]?.category,
          })
        );

        setMultiResults(resultsWithCategories);
      } else {
        // Process single color
        const response = await fetch("/api/color", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ colorDescription: parsedColors[0].color }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get color information");
        }

        setSingleResult(data);
      }
    } catch (err: unknown) {
      console.error("Error details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!suggestionQuery.trim()) {
      setError("Please enter a suggestion query");
      return;
    }

    setIsLoading(true);
    setError("");
    setSingleResult(null);
    setMultiResults(null);

    try {
      const response = await fetch("/api/color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suggestionQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get color suggestions");
      }

      setMultiResults(data.results);
    } catch (err: unknown) {
      console.error("Error details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Group results by category
  const groupedResults = multiResults
    ? multiResults.reduce((groups: Record<string, ColorResult[]>, result) => {
        const category = result.category || "Other";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(result);
        return groups;
      }, {})
    : {};

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">ColorSense</h1>
        <p className="text-gray-600">
          Describe and visualize colors, or explore AI-generated color
          suggestions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden mb-8"
      >
        <div className="flex border-b">
          <button
            onClick={() => setMode("describe")}
            className={`flex-1 py-3 text-center font-medium transition ${
              mode === "describe"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Describe Colors
          </button>
          <button
            onClick={() => setMode("suggest")}
            className={`flex-1 py-3 text-center font-medium transition ${
              mode === "suggest"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Get Suggestions
          </button>
        </div>

        <div className="p-6">
          {mode === "describe" ? (
            <motion.form
              key="describe-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleDescribeSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="colorDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type your colors here
                </label>
                <textarea
                  id="colorDescription"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="e.g. Earthy Green, Ocean Blue, Warm Terracotta or Group: Earthy Tones"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tip: Group colors like Earthy Tones: earthy green, sand beige.
                </p>
              </div>

              <motion.button
                type="submit"
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Show Me Colors"
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="suggest-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSuggestionSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="suggestionQuery"
                  className="block text-sm font-medium text-gray-700"
                >
                  What colors are you looking for?
                </label>
                <textarea
                  id="suggestionQuery"
                  value={suggestionQuery}
                  onChange={(e) => setSuggestionQuery(e.target.value)}
                  placeholder="e.g. Bedroom colors or specify: beachy bathroom, professional interview look"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tip: Add context like "Relaxing colors for a bedroom,"
                  "Vibrant kitchen tones," or "Polished interview colors."
                </p>
              </div>

              <motion.button
                type="submit"
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Getting suggestions...
                  </span>
                ) : (
                  "Get My Color Ideas"
                )}
              </motion.button>
            </motion.form>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
            >
              <p className="font-medium mb-1">Error:</p>
              <p>{error}</p>
              {error.includes("API key") && (
                <p className="mt-2 text-xs">
                  Make sure you&apos;ve created a .env.local file with your
                  GOOGLE_AI_API_KEY
                </p>
              )}
              {error.includes("not related to colors") && (
                <p className="mt-2 text-xs">
                  This app is designed only for color-related queries. Try
                  asking about color schemes, palettes, or design colors
                  instead.
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Single Color Result */}
      <AnimatePresence>
        {singleResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden mb-4"
          >
            <div
              className="h-32 transition-colors duration-700 ease-in-out"
              style={{ backgroundColor: singleResult.hexCode }}
            ></div>
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{singleResult.colorName}</h3>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {singleResult.hexCode}
                </span>
              </div>
              <p className="text-gray-600">{singleResult.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multiple Color Results - Grouped by Category */}
      <AnimatePresence>
        {multiResults && multiResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-5xl"
          >
            {/* Add query info if in suggestion mode */}
            {mode === "suggest" && (
              <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Color palette based on:
                </h2>
                <p className="text-gray-700">{suggestionQuery}</p>
                <p className="text-xs text-gray-500 mt-2">
                  These are AI-generated color suggestions focusing only on
                  visual color properties
                </p>
              </div>
            )}

            {Object.entries(groupedResults).map(
              ([category, colors], categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="mb-8"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {colors.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl shadow-md overflow-hidden h-full"
                      >
                        {result.error ? (
                          <div className="p-4 bg-red-50">
                            <h3 className="font-semibold text-red-700">
                              {result.originalInput}
                            </h3>
                            <p className="text-sm text-red-600">
                              {result.error}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div
                              className="h-24 transition-colors duration-700 ease-in-out"
                              style={{ backgroundColor: result.hexCode }}
                            ></div>
                            <div className="p-4">
                              <div className="text-sm text-gray-500 mb-1">
                                {result.originalInput}
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-base font-semibold">
                                  {result.colorName}
                                </h3>
                                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                  {result.hexCode}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {result.description}
                              </p>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center justify-center text-center mt-6"
      >
        <span className="text-sm text-gray-500">
          Powered by Google AI Studio
        </span>

        <p className="text-gray-500 text-sm mt-2">
          Sometimes AI might give answers that are wrong or confusing.
        </p>
      </motion.div>
    </main>
  );
}
