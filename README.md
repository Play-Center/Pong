Pong (Canvas, No Frameworks)
=================================

A modern, minimalist web recreation of Atari’s Pong (1972), built with plain HTML, CSS, and JavaScript. It features crisp pixel-style rendering, a custom 5×7 bitmap font, responsive scaling, and a simple scene system for the menu and gameplay. No frameworks, no build step — just open and play.

Features
- Singleplayer with difficulty selection (Easy, Normal, Hard)
- Multiplayer (two players on one keyboard)
- Controls screen (from the main menu)
- Live AI-vs-AI demo running behind the menu (hidden on the Controls screen)
- Custom 5×7 block font for retro UI
- Responsive layout that scales to your window
- Pause/resume, quick return to menu

Quick Start
1) Open `index.html` directly in a modern browser, or
2) Serve the folder as static files, e.g.:
   - Python: `python -m http.server 8000` and open http://localhost:8000
   - Node (http-server): `npx http-server -p 8000` and open http://localhost:8000

Controls
- User 1: `W` / `S`
- User 2: `Arrow Up` / `Arrow Down`
- Space: Start/Pause game
- Escape: Return to main menu

Menu Flow
- Root menu: `SINGLEPLAYER`, `MULTIPLAYER`, `CONTROLS`
- Selecting `SINGLEPLAYER` shows `EASY`, `NORMAL`, `HARD`
- Selecting a difficulty starts a vs CPU match (right paddle is AI)
- Selecting `MULTIPLAYER` starts a two‑player match
- Selecting `CONTROLS` opens a static instructions screen (no background demo)
- Press `Escape` from any submenu to return to the root menu

Project Structure
- `index.html` — Loads the canvas and the main script module
- `style.css` — Minimal styling for canvas sizing and font
- `js/`
  - `main.js` — App entry: input handling, scene switching, main loop
  - `menu.js` — Menu UI, hit testing, background AI demo rendering
  - `game.js` — Core game logic, physics, collision, rendering, CPU AI
  - `font5x7.js` — 5×7 bitmap font glyphs + text rendering helpers
  - `constants.js` — Design constants: base size, colors, speeds, measurements
  - `state.js` — Canvas/context exports, resize + scale management
  - `utils.js` — Math helpers (clamp, snap)

Architecture Overview
- Scene system: `main.js` manages a simple `scene` string (`menu` | `game`).
  - Menu scene draws the background demo and the UI (`menu.js`).
  - Game scene updates/paints gameplay (`game.js`), paused by default on entry.
- Rendering: 2D Canvas with chunky rectangles for paddles/ball and a block font for UI.
- Scaling: `state.scale` is computed from the window size vs `BASE_W`×`BASE_H` in `constants.js`. All UI/game dimensions scale from this.
- Input: Keyboard and mouse are read at the top level (`main.js`) and dispatched to the current scene.

Key Modules & APIs
- `js/constants.js`
  - `BASE_W`, `BASE_H`: design-time resolution used to compute `scale`
  - `COLORS`: simple palette
  - `SPEEDS`: base paddle/ball speeds (scaled by `scale`)
  - `DESIGN`: unscaled sizes for paddles, ball, wall padding
- `js/state.js`
  - `c`, `g`: canvas and 2D context
  - `W`, `H`, `scale`: current viewport-based metrics
  - `resize()`: recomputes size + scale, resizes canvas
- `js/font5x7.js`
  - `FONT5x7`: character-to-5×7 grid map
  - `drawTextBlocks(str, centerX, topY, cell, g, color?, gap?)`
  - `measureTextBlocks(str, cell, gap?)`
- `js/menu.js`
  - `drawMenu()`: renders menu screen (root | difficulty | controls)
  - `menuMouseMove(x, y)`, `menuClick()`, `menuReset()`
  - Background demo helpers: internal AI vs AI for ambience
- `js/game.js`
  - `initGame()`, `update(keys)`, `drawGame()`
  - Pause API: `isRunning()`, `setRunning(v)`, `togglePause()`
  - Scoring + `resetBall(direction?)`
  - CPU AI: `setCpuMode("none"|"easy"|"normal"|"hard")` controls the right paddle

Difficulty & AI
- The right paddle is AI-controlled in singleplayer; the left paddle is always player-controlled.
- AI tuning lives in `game.js` via a speed factor and a deadzone. Current defaults:
  - Easy: slower (0.4×), bigger deadzone
  - Normal: moderate (0.6×)
  - Hard: faster (0.85×)
- Tweak in `cpuSpeedFactor()` and `cpuDeadzone()`.

Configuring Look & Feel
- Dimensions and speeds are centralized in `js/constants.js`:
  - Change `DESIGN.PADDLE_H` or `DESIGN.BALL` to adjust sizes
  - Adjust `SPEEDS.BASE_PADDLE` / `SPEEDS.BASE_BALL` for tempo
- The custom font lives in `js/font5x7.js`; add glyphs or change shapes there.

Development
- No build step required. Edit files and refresh the browser.
- Code is documented with JSDoc; hover in modern editors for inline types.
- Formatting: lightweight, consistent with the current style. No linter required.

Accessibility
- Canvas has an `aria-label` for basic screen reader context.
- Controls are keyboard-based; no pointer-specific actions are required to play.

Troubleshooting
- Nothing happens on click? Ensure you’re clicking inside the canvas.
- Performance issues on very large displays: try resizing the window; the game scales down gracefully.
- If fonts look off: the UI uses a block font; that’s intentional for the retro look.

Roadmap Ideas
- Optional sound effects
- Score/round overlays and game over screen
- Mobile touch controls
- Settings for ball/paddle size and speed

Contributing
- Issues and PRs are welcome. Keep changes focused and consistent with the minimalist style.

