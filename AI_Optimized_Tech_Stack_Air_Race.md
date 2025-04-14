# 💡 AI-Optimized Tech Stack – Air Race Challenge

This tech stack is tailored for implementation by AI development agents. It emphasizes clear APIs, modular design, and libraries with robust documentation and predictable behavior.

---

## 🧰 Core Stack Overview

| Layer                  | Recommended Stack                      | Why It’s Ideal for AI Tools                                               |
|------------------------|-----------------------------------------|----------------------------------------------------------------------------|
| **Game Engine**        | 🟢 **Three.js**                         | ✅ Well-documented API<br>✅ Large number of example snippets<br>✅ Declarative & modular |
| **Bundler**            | 🟢 **Vite**                             | ✅ Simple config<br>✅ Fast reloads<br>✅ Zero-config start |
| **Scripting Language** | 🟢 **TypeScript**                       | ✅ Strong typing improves AI accuracy<br>✅ Better autocomplete & safer code generation |
| **UI Layer**           | 🟢 **Vanilla HTML/CSS + Lit.js** *(optional)* | ✅ Easier DOM manipulation for AI<br>✅ Less abstract than React/Vue |
| **State Management**   | 🟢 **Minimal module pattern / Zustand (optional)** | ✅ Flat structure easier to reason about<br>✅ No hidden reactive magic |
| **3D Asset Format**    | 🟢 `.glb` / `.gltf`                     | ✅ Widely supported<br>✅ Easy to parse and preview |
| **Database**           | 🟢 **Supabase (PostgreSQL)**            | ✅ Auto-docs<br>✅ JS SDK<br>✅ Built-in auth, real-time, REST, GraphQL |
| **Leaderboard Storage**| 🟢 **Supabase Table: `leaderboard`**    | ✅ Easy to validate inserts<br>✅ Simple `select/insert` queries for AI to generate |
| **Physics (Lightweight)**| 🟢 **Custom bounding box / sphere logic** | ✅ Easier to debug and trace step-by-step logic<br>✅ Avoids complex physics engines |
| **Audio Engine**       | 🟢 **Howler.js**                        | ✅ Declarative, well-scoped API<br>✅ Easy to define sound profiles |

---

## ✅ AI-Friendly Design Principles

- **Use Modular File Structure**  
  Encourage folders like `/entities`, `/ui`, `/services`, `/utils` for easy scope-based code generation.

- **Prefer Declarative APIs**  
  Functions with clear inputs/outputs work better for AI-generated logic.

- **Leverage Auto-Docs and Type Definitions**  
  Choose tools with TypeScript support and full documentation.

- **Preload and Reuse Assets**  
  Use fixed filenames and preload patterns to make AI file referencing reliable.

---

## ❌ Tools to Avoid for AI Implementation

| Tool                | Reason                                                                 |
|---------------------|------------------------------------------------------------------------|
| React (for UI)      | Too much abstraction, JSX introduces noise, harder for AI to refactor |
| Unity or Unreal     | Requires native tooling, not ideal for browser-first dev or AI CLI use |
| RxJS or Vue reactivity | AI struggles with implicit data flow and deep watchers              |

---

*End of AI-Optimized Tech Stack Document*
