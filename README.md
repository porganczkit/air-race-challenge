# Air Race Challenge

A 3D air racing game where players navigate a Spitfire-style aircraft through gates and under a bridge to achieve the best time.

## Tech Stack

- Three.js for 3D rendering
- Vite for development and building
- TypeScript for type safety
- Supabase for leaderboard functionality

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/src` - Main source code
- `/assets` - 3D models, textures, and audio files
- `/ui` - UI components for the game
- `/services` - External services like leaderboard
- `/utils` - Utility functions
- `/entities` - Game entities like aircraft and gates
- `/core` - Core game functionality

## Game Rules

- Navigate through 8 gates in sequence
- Finish by flying under a bridge
- +10 second penalty for each missed gate
- Game ends when player crashes or completes the course 