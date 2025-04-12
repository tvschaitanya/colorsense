// src/app/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [colorInput, setColorInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{
    colorName: string;
    hexCode: string;
    description: string;
  } | null>(null);
  const [multiResults, setMultiResults] = useState<Array<{
    originalInput: string;
    colorName: string;
    hexCode: string;
    description: string;
    error: string | null;
  }> | null>(null);
  const [error, setError] = useState("");

  // Extract multiple color inputs from text (separated by new lines or bullet points)
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Check if we have multiple colors
      const colorInputs = parseMultipleColors(colorInput);
      const isMultiColor = colorInputs.length > 1;

      if (isMultiColor) {
        // Process multiple colors
        const response = await fetch("/api/color", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ colorDescriptions: colorInputs }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get color information");
        }

        setMultiResults(data.results);
      } else {
        // Process single color
        const response = await fetch("/api/color", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ colorDescription: colorInput }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get color information");
        }

        setSingleResult(data);
      }
    } catch (err: any) {
      console.error("Error details:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">ColorSense</h1>
        <p className="text-gray-600">
          Describe colors and visualize them with AI
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden mb-8"
      >
        <div className="p-6">
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="colorDescription"
                className="block text-sm font-medium text-gray-700"
              >
                Describe colors
              </label>
              <textarea
                id="colorDescription"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="e.g. sunset orange, deep ocean blue, warm taupe, camel, mushroom brown"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
              />
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
                "Get Colors"
              )}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
              >
                <p className="font-medium mb-1">Error:</p>
                <p>{error}</p>
                {error.includes("API key") && (
                  <p className="mt-2 text-xs">
                    Make sure you've created a .env.local file with your
                    GOOGLE_AI_API_KEY
                  </p>
                )}
              </motion.div>
            )}
          </motion.form>
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

      {/* Multiple Color Results */}
      <AnimatePresence>
        {multiResults && multiResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            {multiResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden h-full"
              >
                {result.error ? (
                  <div className="p-4 bg-red-50">
                    <h3 className="font-semibold text-red-700">
                      {result.originalInput}
                    </h3>
                    <p className="text-sm text-red-600">{result.error}</p>
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-gray-500"
      >
        Powered by Google AI Studio
      </motion.div>
    </main>
  );
}
