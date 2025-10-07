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

// --- touch support (mobile)
function canvasPos(clientX, clientY) {
  const r = c.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

function updateKeysFromTouches(touches) {
  // Reset directional keys each frame; we will set them if any touch is active
  keys.w = keys.W = keys.s = keys.S = false;
  keys.ArrowUp = keys.ArrowDown = false;
  for (let i = 0; i < touches.length; i++) {
    const t = touches[i];
    const { x, y } = canvasPos(t.clientX, t.clientY);
    const leftSide = x < c.width / 2;
    const topHalf  = y < c.height / 2;
    if (leftSide) {
      if (topHalf) { keys.w = keys.W = true; }
      else         { keys.s = keys.S = true; }
    } else {
      if (topHalf) { keys.ArrowUp = true; }
      else         { keys.ArrowDown = true; }
    }
  }
}

// Touch: emulate hover/click in menu, and directional controls in game
c.addEventListener("touchstart", e => {
  if (scene === "menu") {
    const t = e.changedTouches[0];
    if (t) {
      const { x, y } = canvasPos(t.clientX, t.clientY);
      menuMouseMove(x, y);
    }
  } else if (scene === "game") {
    updateKeysFromTouches(e.touches);
  }
  e.preventDefault();
}, { passive: false });

c.addEventListener("touchmove", e => {
  if (scene === "menu") {
    const t = e.changedTouches[0];
    if (t) {
      const { x, y } = canvasPos(t.clientX, t.clientY);
      menuMouseMove(x, y);
    }
  } else if (scene === "game") {
    updateKeysFromTouches(e.touches);
  }
  e.preventDefault();
}, { passive: false });

c.addEventListener("touchend", e => {
  if (scene === "menu") {
    const t = e.changedTouches[0];
    if (t) {
      const { x, y } = canvasPos(t.clientX, t.clientY);
      menuMouseMove(x, y);
      const act = menuClick();
      if (act) {
        if (act === "MULTIPLAYER") {
          setCpuMode("none");
          startGame();
        } else if (act === "EASY" || act === "NORMAL" || act === "HARD") {
          setCpuMode(act.toLowerCase());
          startGame();
        }
      }
    }
  } else if (scene === "game") {
    updateKeysFromTouches(e.touches);
  }
  e.preventDefault();
}, { passive: false });

c.addEventListener("touchcancel", e => {
  // Reset keys when touches are canceled
  updateKeysFromTouches(e.touches);
  e.preventDefault();
}, { passive: false });

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
