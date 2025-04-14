# Air Race Challenge - Architecture Documentation

## Project Structure Overview

### Core Files

- `index.html` - Entry point for the application
  - Contains the canvas element where Three.js will render
  - Links to the main JavaScript file

- `src/main.js` - Main application entry point
  - Imports and initializes the game engine
  - Sets up UI status elements and debug tools (FPS counter)
  - Starting point for the application flow

- `core/engine.js` - Game engine implementation
  - Manages the Three.js scene, camera, and renderer
  - Implements the game loop with timing using THREE.Clock
  - Handles object management (adding, removing, updating)
  - Controls the animation frame requests
  - Processes window resize events
  - Sets up the environment and aircraft

- `entities/aircraft.js` - Aircraft entity implementation
  - Creates a Spitfire-like aircraft model using Three.js primitives
  - Implements a chase camera that follows the aircraft
  - Handles aircraft animation (propeller spinning)
  - Will include physics and controls in future steps

### Module Organization

- `/core/` - Core game engine functionality
  - `engine.js` - Three.js setup, game loop, and renderer initialization

- `/entities/` - Game objects and their behaviors
  - `aircraft.js` - Player's airplane model, chase camera, and animation
  - `gate.js` - Obstacle gates with collision detection (to be implemented)

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

The game engine is now implemented with proper structure:

### Game Engine
- `GameEngine` class in `core/engine.js`:
  - Handles Three.js initialization and scene management
  - Implements time-based animation with delta time for consistent movement
  - Manages a collection of game objects with add/remove methods
  - Contains the game loop with requestAnimationFrame
  - Sets up a simple environment with a ground plane and grid
  - Creates and positions the aircraft in the scene

### Aircraft Entity
- `Aircraft` class in `entities/aircraft.js`:
  - Composed of multiple Three.js meshes to form a Spitfire-like model
  - Includes a chase camera positioned behind and above the aircraft
  - Implements an update method for animations and movement
  - Structured to support physics and controls in future steps

### Main Application
- `src/main.js`:
  - Creates and starts the game engine
  - Sets up UI status indicators
  - Implements development tools (FPS counter)

## Game Loop Architecture

The game loop follows this pattern:
1. Request animation frame
2. Calculate deltaTime since the last frame
3. Update all game objects based on deltaTime
4. Render the scene with the aircraft's chase camera
5. Repeat

This time-based approach ensures consistent movement speed regardless of the device's frame rate or performance.

## Planned Architecture Flow

1. User loads `index.html` which includes `main.js`
2. `main.js` initializes the `GameEngine` from `core/engine.js`
3. Engine creates scene, camera, and renderer
4. Aircraft entity is created and added to the engine
5. Game loop runs, updating the aircraft and rendering each frame with the chase camera
6. In future steps, keyboard controls will be added to control the aircraft
7. UI elements will display over the 3D scene
8. Services will communicate with external APIs as needed

Future iterations will expand this architecture with obstacle gates, collision detection, and game rules as development progresses. 