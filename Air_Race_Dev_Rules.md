# Project Rules and Guidelines – Air Race Challenge (Three.js + Supabase Stack)

## 1. Code Style and Formatting

- Use **Prettier** for automatic formatting and **ESLint** with a custom ruleset for code linting.
- Follow **camelCase** for variables/functions, **PascalCase** for classes and React components, and **kebab-case** for file names.
- Keep all lines under 100 characters.
- Use **JSDoc** for documenting functions and exported modules.
- Enforce type annotations where possible with TypeScript (preferred).

## 2. Project Structure and Modularity

- ❗**Avoid monoliths** — break logic into modular folders such as:
  - `/core` for initialization and engine config
  - `/entities` for plane and obstacle logic
  - `/ui` for HUD, timer, and leaderboard
  - `/utils` for helpers like distance calculations and random generation
- Keep files focused on single responsibilities.
- Prefer composition over inheritance where applicable.

## 3. Git Workflow

- Use feature branches: `feature/obstacle-generation`, `fix/bridge-alignment`, etc.
- Use Conventional Commits:
  - `feat: add obstacle spawn logic`
  - `fix: correct crash condition`
- Use pull requests for all changes and assign a reviewer.
- Rebase regularly on main to avoid conflicts.
- Delete merged branches.

## 4. Game Loop and Performance

- All game logic should run inside a well-regulated **animation loop** using `requestAnimationFrame`.
- Keep per-frame computations minimal – precompute obstacle positions, distance maps.
- Use `frustumCulled = false` only when necessary to avoid GPU overload.
- Optimize Three.js objects by reusing geometries/materials instead of regenerating them.

## 5. State Management

- Use a **central game state** module or store (`gameState.js`) to track timer, collisions, penalties, and game status.
- Ensure the game state is decoupled from the rendering logic.
- Make the state observable if UI reactivity is needed (e.g., via a simple reactive pattern or a library like Zustand or Valtio if scaling up).

## 6. Supabase Integration

- Use **row-level security (RLS)** for leaderboard access control.
- Separate read/write functions into `/services/leaderboard.js`.
- Sanitize and validate usernames client-side before saving to the DB.
- Use Supabase SDK’s `insert` and `select` methods wrapped in error-handled async functions.

## 7. Physics and Collisions

- Implement custom **bounding sphere collision** checks for gate passing and crashes.
- Keep all physical calculations (e.g., plane velocity, gate proximity) in a centralized `physics.js`.
- Use AABB or sphere collision detection where performance is critical.
- Visual feedback (e.g., flashes, camera shake) should be triggered only once per collision event.

## 8. Asset Management

- Use voxel-style `.glb` or `.gltf` models for plane, bridge, and obstacles (can be made in Blockbench).
- Use a `loader.js` to preload all assets before the game starts.
- Optimize texture sizes and geometries to minimize draw calls.
- Keep all static assets in `/assets/models` and `/assets/textures`.

## 9. Error Handling & Logging

- Catch and log all async errors (especially during Supabase calls).
- Use `console.error()` for dev builds, and a silent fail or alert in production.
- Wrap all initialization logic in try-catch blocks with fallback behavior (e.g., showing an error screen if assets fail to load).

## 10. UI and Accessibility

- Keep the HUD light and non-obstructive — test on multiple screen sizes.
- Allow full keyboard navigation with clear visual feedback (focus, hover).
- Ensure all UI text has high contrast and is legible over background.
- Timer, status messages, and penalties must update in real-time without flicker.

---

*End of Development Rules Document*
