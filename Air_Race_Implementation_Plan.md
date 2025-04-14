# Implementation Plan – Air Race Challenge (Base Game)

This implementation plan provides step-by-step instructions for AI developers to build the base version of **Air Race Challenge** using Three.js and Supabase. Each step includes a concrete test to validate successful implementation.

---

## Phase 1: Project Setup

### Step 1: Initialize Project Structure
- Create a new project directory.
- Set up subfolders: `/src`, `/assets`, `/ui`, `/services`, `/utils`, `/entities`, `/core`.
- Initialize with `npm init`.
- Install dependencies: `three`, `vite`, `eslint`, `prettier`.

**Test:** Confirm project runs in browser via `npm run dev` with blank canvas on screen.

### Step 2: Set Up Git and GitHub Repository
- Initialize Git in the root directory.
- Create `.gitignore` and add `node_modules`, `dist`, `.env`.
- Push to GitHub with correct naming convention.

**Test:** Check that GitHub repo reflects all files, and branches can be created/pushed.

---

## Phase 2: Core Game Setup

### Step 3: Create Basic Three.js Scene
- Create a canvas and add to DOM.
- Initialize Three.js scene, camera, and renderer.
- Add ambient light and sky-like background color.

**Test:** Render a rotating cube to verify 3D context loads correctly.

### Step 4: Implement Game Loop
- Add `requestAnimationFrame` loop.
- Move a test object continuously within the loop.

**Test:** Object moves smoothly on screen without frame drops.

---

## Phase 3: Player Aircraft Setup

### Step 5: Load or Create Player Aircraft Model
- Import a Spitfire-like 3D model (placeholder if needed).
- Position aircraft in starting area with camera in chase view.

**Test:** Model loads correctly and camera tracks from behind.

### Step 6: Add Keyboard Controls for Plane Movement
- Capture arrow key inputs.
- Apply simple pitch/yaw to aircraft in response.

**Test:** Plane moves up/down/left/right in response to key input.

### Step 7: Add Basic Physics Movement
- Add forward motion with constant velocity (~5 units/sec).
- Implement banking on turns (15-30° roll when turning left/right).
- Add gradual pitch changes (max 45° up/down) with slight momentum.
- Add a small amount of drag/inertia for responsive but not twitchy controls.
- Limit extreme maneuvers to prevent unrealistic flight.
- No stall mechanics for simplicity.

**Test:** Plane maintains direction and accelerates forward with realistic behavior.

---

## Phase 4: Environment and Obstacles

### Step 8: Generate Terrain and Sky
- Add flat ground plane and background gradient.
- Add lighting to cast shadows from plane.

**Test:** Plane appears visually above terrain with horizon visible.

### Step 9: Spawn 8 Randomized Obstacle Gates
- Create orange tube-shaped gates with consistent heights.
- Randomly distribute them in 3D space with min 300px distance.
- Implement box colliders for gates (trigger-based detection).
- Use semi-random placement with increasing difficulty:
  - First 2-3 gates relatively close and easier to navigate.
  - Later gates more challenging (higher/lower, tighter turns).
  - Generate gates within flyable path constraints.
  - Ensure minimum turning radius is respected between gates.
- Clearly number each gate to indicate the sequence.

**Test:** Eight gates appear without overlapping. Validate spacing.

### Step 10: Create Finishing Bridge (Lánchíd-like)
- Model or approximate Chain Bridge in voxel style.
- Position at end of obstacle course.

**Test:** Player can visually locate bridge and fly under it without collision.

---

## Phase 5: Game Rules and Mechanics

### Step 11: Gate Collision and Pass Detection
- Add detection when aircraft intersects with a gate using trigger-based collision:
  - Use a capsule + box collider combination for the aircraft.
  - Check for correct entry direction to prevent backtracking exploits.
  - Optionally add a margin zone inside gates to reward precision flying.
- Track which gates are passed.
- Gates must be passed in specific sequence (1→2→3→etc.).
- Provide visual indication of gate status:
  - Upcoming gates: Default orange color with pulsing effect.
  - Passed gates: Turn green with brief particle effect.
  - Missed gates: Flash red briefly then fade to gray/translucent.
  - Current target gate: Highlighted with brighter orange glow.
- Add arrow indicators pointing to next gate in sequence.

**Test:** Debug log updates gate count each time one is passed, gates change appearance properly.

### Step 12: Add Penalty for Missed Gates
- Detect when gate was missed (not passed in order).
- Apply +10s penalty to player time.
- Implement penalty notification UI:
  - Display centered, bold red text "✖ MISSED GATE – Time Penalty +10s" in upper-middle of screen.
  - Show notification for 2.5-3 seconds with fade-in (~0.3s) and fade-out (~0.5s).
  - Add audio feedback (alert sound) when a gate is missed.
  - Optionally flash the missed gate in red.
  - Queue messages if multiple gates are missed in sequence.

**Test:** Final time reflects penalties after completing course and penalty notifications display correctly.

### Step 13: Detect End Conditions
- Game ends if:
  - Plane touches ground.
  - Plane crashes into bridge.
  - Plane flies under bridge.

**Test:** Game ends correctly on each condition and disables further input.

### Step 14: Implement Timer
- Start timer when plane takes off.
- Stop on game end and show elapsed time + penalties.
- Use mm:ss.ms format (01:23.456).
- Display timer at top-right corner with high-contrast white text and subtle shadow.
- Update continuously (60fps).

**Test:** Timer displays live and final time matches internal logic.

---

## Phase 6: Leaderboard Integration

### Step 15: User Login with Username Only
- On game start, prompt user for username (no auth).
- Store locally for session.
- Allow duplicate usernames (differentiate with timestamps).
- Store as username#timestamp format in database.
- Display only username in leaderboard.
- Optional: Add confirmation if username exists: "Username exists. Use it anyway?"

**Test:** Username is stored and retrievable by game logic.

### Step 16: Supabase Leaderboard Setup
- Connect Supabase project.
- Create `leaderboard` table: `username`, `time`, `penalties`, `final_time`.
- Create read/write functions.

**Test:** Manually insert and retrieve dummy data using functions.

### Step 17: Upload Score at Game End
- After finish, calculate final score and send to Supabase.

**Test:** New entry appears in database with correct user and time.

### Step 18: Display Top 10 Scores
- Fetch top 10 fastest scores.
- Render in corner of UI.

**Test:** Leaderboard updates after each new entry.

---

## Phase 7: UI and Polish

### Step 19: Add HUD Elements
- Timer
- Gate counter
- Penalty notifications
- Final score display

**Test:** All UI updates in sync with game state.

### Step 20: Add Start/Restart Flow
- Menu screen with start button
- Restart button after finish or crash

**Test:** Player can restart game cleanly from menu.

### Step 21: Implement Camera Behavior
- Set up chase camera with slight lag (smoothing factor: 0.05-0.1).
- Position camera ~10 units behind, ~3 units above aircraft.
- Add slight banking when aircraft turns (30% of aircraft bank angle).
- Optional: Add FOV increase during high-speed sections.

**Test:** Camera follows plane smoothly and provides good visibility of upcoming obstacles.

---

*End of Implementation Plan – Base Game*
