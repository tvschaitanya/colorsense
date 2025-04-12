# ColorSense 🎨

**ColorSense** is an AI-powered web application that transforms text descriptions of colors into visual representations with accurate hex codes and descriptions.

![ColorSense Demo](https://via.placeholder.com/800x400?text=ColorSense+Demo)

## What is ColorSense?

ColorSense bridges the gap between natural language and color visualization. Ever tried describing a specific color to someone? "It's like a sunset orange, but more muted" or "A warm taupe with hints of pink" - ColorSense understands these descriptions and converts them into actual colors you can see and use in your projects.

**Key Features:**

- Convert natural language color descriptions to visual colors with hex codes
- Process multiple colors at once (separated by new lines, bullet points, or commas)
- Beautiful, responsive UI with smooth animations
- Display color name, hex code, and a brief description for each color

## Why ColorSense?

ColorSense was created to solve several practical problems:

1. **Design Communication** - Helps designers and clients communicate color preferences more intuitively
2. **Accessibility** - Allows people to visualize colors described in text
3. **Creative Exploration** - Enables experimentation with color palettes using natural language
4. **Education** - Teaches the relationship between color descriptions and visual representations

## Tech Stack

ColorSense is built with modern web technologies:

- **Next.js 15.3.0** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript** - Type-safe JavaScript
- **Framer Motion** - Animations library
- **Google Generative AI** - AI model for color interpretation (Gemini 2.0 Flash-Lite)
- **Tailwind CSS 4** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (recommended), npm, or yarn
- Google AI Studio API Key

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/colorsense.git
   cd colorsense
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory

   ```
   GOOGLE_AI_API_KEY=your_google_ai_studio_api_key
   ```

4. Update `next.config.ts` to include environment variables

   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     env: {
       GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
     },
   };

   export default nextConfig;
   ```

5. Run the development server

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. Enter a color description (e.g., "sunset orange", "deep ocean blue")
2. For multiple colors, enter each on a new line or use bullet points:
   ```
   * Warm taupe
   * Camel
   * Mushroom brown
   ```
3. Click "Get Colors" to generate visualizations for each color

## Deployment

ColorSense can be deployed on Vercel or any other hosting service that supports Next.js:

```bash
pnpm build
pnpm start
```

## Getting a Google AI API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create an account or sign in
3. Navigate to the API section
4. Create a new API key
5. Add the key to your `.env.local` file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google AI Studio for providing the Gemini API
- The Next.js team for their excellent framework
- All contributors and users of ColorSense
