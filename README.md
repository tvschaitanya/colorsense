# ColorSense 🎨

**ColorSense** is an AI-powered web application that transforms text descriptions of colors into visual representations with accurate hex codes and descriptions.
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tvschaitanya/colorsense)

## Screenshots

![ColorSense Demo](/screenshots/Main-Interface.jpeg)

_Main interface showing color description input and results_

![Multiple Color Results](/screenshots/Results-Output.jpeg)

_Example of multiple color descriptions processed simultaneously_

## The Problem ColorSense Solves

It can be difficult to visualize colors from text descriptions. When AI suggests colors like "warm taupe" or "muted sunset orange" for your next purchase, these descriptions might be hard to picture.

I created ColorSense after facing this problem myself. While shopping, I asked ChatGPT for color suggestions and received several color names I couldn't easily visualize. Googling each color individually took too much time.

## What ColorSense Does

ColorSense connects language with visualization by:

- Converting text color descriptions into visual colors with hex codes
- Processing multiple colors at once (separated by lines, bullet points, or commas)
- Providing color names, hex codes, and brief descriptions for each color
- Displaying everything in a clean, responsive interface with smooth animations

## Key Benefits

- **Better Communication**: Helps designers and clients discuss color preferences clearly
- **Improved Accessibility**: Makes text-described colors visible immediately
- **Creative Tool**: Helps explore color palettes using natural language
- **Learning Resource**: Helps understand color terminology and representation

## Technology Behind ColorSense

Built with:

- Next.js 15.3.0 with App Router
- React 19.0.0
- TypeScript
- Framer Motion
- Google Generative AI (Gemini 2.0 Flash-Lite)
- Tailwind CSS 4

You can use any AI API with this project. I used Google AI Studio's API for this implementation.

## Getting Started

### Requirements

- Node.js 18.17.0+
- Package manager (pnpm recommended)
- AI API Key (Google AI Studio or any of your choice)

### Quick Setup

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Add your API key to a `.env.local` file
4. Update environment variables in `next.config.ts`
5. Run `pnpm dev`
6. Open http://localhost:3000 in your browser

## Using ColorSense

Enter color descriptions like:

```
* Warm taupe
* Camel
* Mushroom brown
```

Click "Get Colors" to see them visualized instantly.

## Why AI for Color Interpretation?

I searched for existing color libraries but found that many AI-generated color names don't exist in standard libraries. Instead of building a new library, I decided to use AI to interpret and visualize these colors directly. You can use any AI API, though I found Google AI Studio's API worked well for this purpose.

## Getting an API Key

1. Visit [Google AI Studio](https://ai.google.dev/) (or your preferred AI provider)
2. Create an account or sign in
3. Navigate to the API section
4. Create a new API key
5. Add the key to your `.env.local` file

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- Google AI Studio for providing the Gemini API (though any AI API can be used)
- The Next.js team for their framework.
