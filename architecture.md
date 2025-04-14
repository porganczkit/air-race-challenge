# Air Race Challenge - Architecture Documentation

## Project Structure Overview

### Core Files

- `index.html` - Entry point for the application
  - Contains the canvas element where Three.js will render
  - Links to the main JavaScript file

- `src/main.js` - Main application entry point
  - Initializes the Three.js scene, camera, and renderer
  - Sets up lighting (ambient and directional)
  - Creates a test cube for 3D verification
  - Implements the animation loop using requestAnimationFrame
  - Handles window resizing for responsive rendering

### Module Organization

- `/core/` - Core game engine functionality
  - `engine.js` - Will handle Three.js setup, game loop, and renderer initialization
    - In future iterations, the Three.js code in main.js will be refactored here

- `/entities/` - Game objects and their behaviors
  - `aircraft.js` - Player's airplane model, physics, and controls
  - `gate.js` - Obstacle gates with collision detection

- `/ui/` - User interface elements
  - `hud.js` - Heads-up display with timer, gate counter, and notifications

- `/services/` - External service integrations
  - `leaderboard.js` - Supabase interaction for storing and retrieving scores

- `/utils/` - Helper functions and utilities
  - `physics.js` - Collision detection and physics calculations

- `/assets/` - Static assets
  - Will contain 3D models, textures, and audio files

## Design Principles

1. **Modularity**: Each file has a single responsibility to make development and maintenance easier.

2. **Clean Separation of Concerns**:
   - Game logic (entities) separate from rendering (core)
   - UI separate from game mechanics
   - Service communication isolated in dedicated modules

3. **Progressive Enhancement**:
   - Start with basic functionality and add features incrementally
   - Test each component before integration

## Current Implementation

Currently, the basic Three.js scene is implemented directly in `main.js` for simplicity:
- Scene with sky-blue background
- Perspective camera at position (0, 0, 5)
- WebGL renderer with antialiasing
- Basic lighting setup (ambient + directional)
- A rotating green cube for testing
- Animation loop and resize handling

In future steps, this functionality will be moved to appropriate modules, particularly to `/core/engine.js` for better code organization.

## Planned Architecture Flow

1. User loads `index.html` which includes `main.js`
2. `main.js` initializes the game engine from `core/engine.js`
3. Engine creates scene, camera, and renderer
4. Game entities are instantiated and added to the scene
5. Game loop begins, running physics and rendering each frame
6. UI elements display over the 3D scene
7. Services communicate with external APIs as needed

Future iterations will expand this architecture with more detailed components as development progresses. 