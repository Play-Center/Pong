import { c, resize } from "./state.js";
import { drawMenu, menuMouseMove, menuClick } from "./menu.js";
import { initGame, update, drawGame, isRunning, setRunning, togglePause } from "./game.js";

const keys = Object.create(null);
let scene = "menu"; // "menu" | "game"

function startGame() {
  initGame();           // sets running = false internally
  scene = "game";       // enter game paused
}

// --- keyboard
addEventListener("keydown", e => {
  keys[e.key] = true;

  if (scene === "menu") {
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
      e.preventDefault();
    }
  }
});

addEventListener("keyup", e => { keys[e.key] = false; });

// --- mouse (canvas coords)
c.addEventListener("mousemove", e => {
  if (scene !== "menu") return;
  const r = c.getBoundingClientRect();
  menuMouseMove(e.clientX - r.left, e.clientY - r.top);
});

c.addEventListener("click", () => {
  if (scene !== "menu") return;
  const act = menuClick();  // "SINGLE PLAYER" | "MULTIPLAYER" | null
  if (!act) return;

  // For now both start the same way; you can branch later.
  startGame();              // enters paused
});

// --- loop
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
resize();
initGame(); // prepare sizes/positions; we start on menu & paused
loop();
