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
  - Sets up the voxel-style environment with terrain, clouds, and mountains
  - Creates and positions the aircraft in the scene
  - Initializes input handler for controls

- `entities/aircraft.js` - Aircraft entity implementation
  - Creates a voxel-style Spitfire aircraft model using Three.js primitives
  - Implements RAF roundels and proper camouflage coloring
  - Features a chase camera that follows the aircraft
  - Handles aircraft animation (propeller spinning)
  - Processes keyboard input for flight controls
  - Implements physics-based movement with smoothing

- `utils/input.js` - Input handler implementation
  - Captures and tracks keyboard input states
  - Provides an API for checking key states
  - Prevents default browser behavior for game controls

### Module Organization

- `/core/` - Core game engine functionality
  - `engine.js` - Three.js setup, game loop, and renderer initialization

- `/entities/` - Game objects and their behaviors
  - `aircraft.js` - Player's voxel-style Spitfire aircraft model and controls

- `/ui/` - User interface elements
  - `hud.js` - Heads-up display with timer, gate counter, and notifications

- `/services/` - External service integrations
  - `leaderboard.js` - Supabase interaction for storing and retrieving scores

- `/utils/` - Helper functions and utilities
  - `input.js` - Keyboard input handling
  - `physics.js` - Collision detection and physics calculations

- `/assets/` - Static assets
  - Will contain 3D models, textures, and audio files

## Design Principles

1. **Modularity**: Each file has a single responsibility to make development and maintenance easier.

2. **Clean Separation of Concerns**:
   - Game logic (entities) separate from rendering (core)
   - Input handling separate from physics and rendering
   - UI separate from game mechanics
   - Service communication isolated in dedicated modules

3. **Progressive Enhancement**:
   - Start with basic functionality and add features incrementally
   - Test each component before integration

4. **Voxel-Style Aesthetic**:
   - Block-based construction for aircraft and environment
   - Minecraft-inspired visual approach
   - Simple but recognizable forms

## Current Implementation

The game engine is now implemented with proper structure:

### Game Engine
- `GameEngine` class in `core/engine.js`:
  - Handles Three.js initialization and scene management
  - Implements time-based animation with delta time for consistent movement
  - Manages a collection of game objects with add/remove methods
  - Contains the game loop with requestAnimationFrame
  - Creates voxel-style terrain with height variation
  - Generates blocky clouds that gently animate
  - Adds distant mountains for visual depth
  - Creates and positions the aircraft in the scene
  - Initializes and provides input handler to the aircraft

### Aircraft Entity
- `Aircraft` class in `entities/aircraft.js`:
  - Composed of multiple Three.js box geometries to form a detailed Spitfire
  - Features RAF roundels and proper camouflage pattern
  - Includes functioning propeller and landing gear
  - Implements a chase camera positioned for optimal viewing
  - Processes keyboard input for flight controls
  - Implements physics-based movement with smoothing
  - Handles turning, pitching, and rolling with appropriate visual feedback

### Input Handling
- `InputHandler` class in `utils/input.js`:
  - Captures keyboard events and maintains state of arrow keys
  - Provides methods to query current key states
  - Prevents default browser actions for arrow keys
  - Maintains clean separation between input capture and application logic

### Environment
- Voxel-style ground terrain with height variation
- Blocky clouds at various altitudes that animate gently
- Distant mountain ranges for visual framing
- Blue sky backdrop

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
   - Process input and update controls
   - Apply physics and movement
   - Update visual elements
4. Update environment elements (cloud animation, etc.)
5. Render the scene with the aircraft's chase camera
6. Repeat

This time-based approach ensures consistent movement speed regardless of the device's frame rate or performance.

## Control Flow

The control flow for aircraft movement is:
1. `InputHandler` captures and tracks keyboard events
2. `Aircraft.update()` calls `handleControls()` which queries input states
3. Input values are converted to target pitch, roll, and yaw values
4. Smoothing is applied to create fluid control response
5. Physics calculations update the aircraft's position and orientation
6. The aircraft model and camera are updated to reflect the new state

## Planned Architecture Flow

1. User loads `index.html` which includes `main.js`
2. `main.js` initializes the `GameEngine` from `core/engine.js`
3. Engine creates scene, camera, renderer, and environment
4. Aircraft entity is created and linked to input handler
5. Game loop runs, updating the aircraft based on player input
6. In future steps, gates and collision detection will be added
7. UI elements will display over the 3D scene
8. Services will communicate with external APIs as needed

Future iterations will expand this architecture with obstacle gates, collision detection, and game rules as development progresses. 