import { c, resize } from "./state.js";
import { drawMenu, menuMouseMove, menuClick, menuReset } from "./menu.js";
import { initGame, update, drawGame, isRunning, setRunning, togglePause, setCpuMode } from "./game.js";

/** Keyboard state map keyed by event.key. */
const keys = Object.create(null);
let scene = "menu"; // "menu" | "game"

/** Enter the game scene and initialize (paused). */
function startGame() {
  initGame();           // sets running = false internally
  scene = "game";       // enter game paused
}

// --- keyboard
/** Keydown updates state; also handles scene-specific shortcuts. */
addEventListener("keydown", e => {
  keys[e.key] = true;

  if (scene === "menu") {
    // Escape returns from difficulty submenu to root menu
    if (e.code === "Escape") {
      menuReset();
      e.preventDefault();
      return;
    }
    if (e.code === "Space" || e.code === "Enter") {
      startGame();      // go to game (still paused)
      e.preventDefault();
    }
  } else if (scene === "game") {
    if (e.code === "Space") {
      togglePause();    // pause/resume
      e.preventDefault();
    }
    if (e.code === "Escape") {
      scene = "menu";   // back to menu; game remains in its current state
      setRunning(false);
      menuReset();       // reset to root menu (show PONG + main buttons)
      e.preventDefault();
    }
  }
});

/** Keyup clears the key state. */
addEventListener("keyup", e => { keys[e.key] = false; });

// --- mouse (canvas coords)
/** Track mouse for hovering and handle clicks while in menu. */
c.addEventListener("mousemove", e => {
  if (scene !== "menu") return;
  const r = c.getBoundingClientRect();
  menuMouseMove(e.clientX - r.left, e.clientY - r.top);
});

c.addEventListener("click", () => {
  if (scene !== "menu") return;
  const act = menuClick();  // "SINGLE PLAYER" | "MULTIPLAYER" | null
  if (!act) return;

  // Handle actions returned by menu
  // - Root menu returns: "MULTIPLAYER" (SINGLEPLAYER is handled inside menu and returns null)
  // - Difficulty menu returns: "EASY" | "NORMAL" | "HARD"
  if (act === "MULTIPLAYER") {
    setCpuMode("none");
    startGame();            // enters paused
  } else if (act === "EASY" || act === "NORMAL" || act === "HARD") {
    setCpuMode(act.toLowerCase());
    startGame();            // enters paused with CPU opponent
  }
});

// --- loop
/** Animation frame loop: updates scene and renders. */
function loop() {
  if (scene === "menu") {
    drawMenu();
  } else {
    update(keys);          // does nothing when paused
    drawGame();
  }
  requestAnimationFrame(loop);
}

// boot
/** Initialize canvas size, game state, and start loop. */
resize();
initGame(); // prepare sizes/positions; we start on menu & paused
loop();
