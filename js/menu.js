import { g, W, H, scale } from "./state.js";
import { COLORS, SPEEDS, DESIGN } from "./constants.js";
import { measureTextBlocks, drawTextBlocks } from "./font5x7.js";
import { clamp } from "./utils.js";

const WHITE = COLORS.WHITE;

/** Track mouse position in canvas coords. */
let mouseX = -1, mouseY = -1;

// Rebuilt every frame
/** @type {{label:string,x:number,y:number,w:number,h:number}[]} */
let btnRects = []; // [{ label, x, y, w, h }]

// Simple menu state: "root" (PONG + SINGLE/MULTI/CONTROLS), "single" (EASY/NORMAL/HARD), or "controls"
/** @type {"root"|"single"|"controls"} */
let menuMode = "root";

/** Reset menu to the root screen (PONG + SINGLE/MULTI). */
export function menuReset() {
  menuMode = "root";
}

// --- Demo (background AI vs AI Pong) ---------------------------------------
let DEMO_PADDLE_W = 0, DEMO_PADDLE_H = 0, DEMO_BALL = 0, DEMO_WALL_PAD = 0;
let demoPaddleSpeed = 0, demoBallSpeed = 0;
let demoLeftY = 0, demoRightY = 0, demoBallX = 0, demoBallY = 0, demoVx = 0, demoVy = 0;
let _demoInitScale = 0;

function initDemo() {
  DEMO_PADDLE_W = Math.round(DESIGN.PADDLE_W * scale);
  DEMO_PADDLE_H = Math.round(DESIGN.PADDLE_H * scale);
  DEMO_BALL     = Math.max(6, Math.round(DESIGN.BALL * scale));
  DEMO_WALL_PAD = Math.round(DESIGN.WALL_PAD * scale);

  demoPaddleSpeed = SPEEDS.BASE_PADDLE * scale * 0.6; // slower for calmer background
  demoBallSpeed   = SPEEDS.BASE_BALL   * scale * 0.9;

  demoLeftY  = Math.round((H - DEMO_PADDLE_H) / 2);
  demoRightY = Math.round((H - DEMO_PADDLE_H) / 2);
  resetDemoBall(Math.random() < 0.5 ? -1 : 1);

  _demoInitScale = scale;
}

function ensureDemo() {
  if (_demoInitScale !== scale || DEMO_PADDLE_W === 0) initDemo();
}

function resetDemoBall(direction) {
  demoBallX = Math.round(W / 2 - DEMO_BALL / 2);
  demoBallY = Math.round(H / 2 - DEMO_BALL / 2);
  demoVx = demoBallSpeed * (direction || (Math.random() < 0.5 ? -1 : 1));
  demoVy = (Math.random() * 2 - 1) * (demoBallSpeed * 0.6);
}

function updateDemo() {
  // AI paddles track the ball with a deadzone
  const dz = Math.max(6, Math.round(8 * scale));
  const leftCenter  = demoLeftY  + DEMO_PADDLE_H / 2;
  const rightCenter = demoRightY + DEMO_PADDLE_H / 2;
  const ballCenter  = demoBallY  + DEMO_BALL / 2;

  if (ballCenter < leftCenter - dz)  demoLeftY  = clamp(demoLeftY  - demoPaddleSpeed, 0, H - DEMO_PADDLE_H);
  else if (ballCenter > leftCenter + dz) demoLeftY  = clamp(demoLeftY  + demoPaddleSpeed, 0, H - DEMO_PADDLE_H);

  if (ballCenter < rightCenter - dz) demoRightY = clamp(demoRightY - demoPaddleSpeed, 0, H - DEMO_PADDLE_H);
  else if (ballCenter > rightCenter + dz) demoRightY = clamp(demoRightY + demoPaddleSpeed, 0, H - DEMO_PADDLE_H);

  // Ball move
  demoBallX += demoVx;
  demoBallY += demoVy;

  // Walls
  if (demoBallY <= 0) { demoBallY = 0; demoVy = Math.abs(demoVy); }
  else if (demoBallY + DEMO_BALL >= H) { demoBallY = H - DEMO_BALL; demoVy = -Math.abs(demoVy); }

  // Paddles
  const leftX  = DEMO_WALL_PAD;
  const rightX = W - DEMO_WALL_PAD - DEMO_PADDLE_W;

  if (demoBallX < leftX + DEMO_PADDLE_W && demoBallX + DEMO_BALL > leftX &&
      demoBallY < demoLeftY + DEMO_PADDLE_H && demoBallY + DEMO_BALL > demoLeftY && demoVx < 0) {
    demoBallX = leftX + DEMO_PADDLE_W;
    demoVx = Math.abs(demoVx) * 1.02;
    const hit = (demoBallY + DEMO_BALL / 2) - (demoLeftY + DEMO_PADDLE_H / 2);
    demoVy = clamp(demoVy + hit * 0.04, -10 * scale, 10 * scale);
  }

  if (demoBallX + DEMO_BALL > rightX && demoBallX < rightX + DEMO_PADDLE_W &&
      demoBallY < demoRightY + DEMO_PADDLE_H && demoBallY + DEMO_BALL > demoRightY && demoVx > 0) {
    demoBallX = rightX - DEMO_BALL;
    demoVx = -Math.abs(demoVx) * 1.02;
    const hit = (demoBallY + DEMO_BALL / 2) - (demoRightY + DEMO_PADDLE_H / 2);
    demoVy = clamp(demoVy + hit * 0.04, -10 * scale, 10 * scale);
  }

  // Reset when out of bounds
  if (demoBallX + DEMO_BALL < 0)  { resetDemoBall(+1); }
  if (demoBallX > W)              { resetDemoBall(-1); }
}

function drawDemo() {
  // Clear background and draw net, paddles, and ball
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  
  // Paddles and ball (no center net on menu)
  g.fillStyle = WHITE;
  g.fillRect(Math.round(DEMO_WALL_PAD), Math.round(demoLeftY), DEMO_PADDLE_W, DEMO_PADDLE_H);
  g.fillRect(Math.round(W - DEMO_WALL_PAD - DEMO_PADDLE_W), Math.round(demoRightY), DEMO_PADDLE_W, DEMO_PADDLE_H);
  g.fillRect(Math.round(demoBallX), Math.round(demoBallY), DEMO_BALL, DEMO_BALL);
}

/**
 * Point-in-rect test.
 * @param {number} mx
 * @param {number} my
 * @param {{x:number,y:number,w:number,h:number}} r
 * @returns {boolean}
 */
function inRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

// --- called from main.js
/**
 * Update mouse position (canvas coordinates) for hover detection.
 * @param {number} mx
 * @param {number} my
 */
export function menuMouseMove(mx, my) {
  mouseX = mx;
  mouseY = my;
}

// --- called from main.js
/**
 * Return the clicked button label or null if none.
 * On root menu, clicking SINGLEPLAYER transitions to difficulty submenu.
 * @returns {string|null}
 */
export function menuClick() {
  const hit = btnRects.find(r => inRect(mouseX, mouseY, r));
  if (!hit) return null;

  if (menuMode === "root") {
    if (hit.label === "SINGLEPLAYER") {
      // Transition to difficulty selection; do not leave menu yet
      menuMode = "single";
      return null;
    }
    if (hit.label === "CONTROLS") {
      // Show controls overlay
      menuMode = "controls";
      return null;
    }
    // Allow other root actions to bubble up (e.g., MULTIPLAYER)
    return hit.label;
  }

  // In single-player difficulty menu, return the difficulty label
  return hit.label; // EASY | NORMAL | HARD
}

/** Draw the current menu screen (root, difficulty, or controls). */
export function drawMenu() {
  // Background: show AI demo only outside the controls screen
  if (menuMode !== "controls") {
    ensureDemo();
    updateDemo();
    drawDemo();
  } else {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
  }

  // Rebuild rects for this frame
  btnRects = [];

  const titleCell = Math.max(6, Math.floor(9 * scale));
  const btnCell   = Math.max(4, Math.floor(5 * scale));
  const titleY    = 36 * scale;

  // Draw title only on the root menu
  if (menuMode === "root") {
    drawTextBlocks("PONG", W / 2, titleY, titleCell, g);
  }

  // Buttons per menu screen
  if (menuMode === "controls") {
    // Render controls text and exit
    const textCell = Math.max(4, Math.floor(5 * scale));
    const lineGap  = Math.round(10 * scale);
    const lines = [
      "CONTROLS",
      "",
      "W/S - USER 1 CONTROLS",
      "UP/DOWN - USER 2 CONTROLS",
      "SPACEBAR - START/PAUSE GAME",
      "ESC - RETURN TO MAIN MENU",
      "",
      "PRESS ESC TO GO BACK",
    ];
    let y = Math.round((H - (lines.length * (7 * textCell) + (lines.length - 1) * lineGap)) / 2);
    for (const line of lines) {
      drawTextBlocks(line, W / 2, y, textCell, g);
      y += 7 * textCell + lineGap;
    }
    return;
  }

  const labels = (menuMode === "root")
    ? ["SINGLEPLAYER", "MULTIPLAYER", "CONTROLS"]
    : ["EASY", "NORMAL", "HARD"];
  const gap    = btnCell;
  const padX   = 3 * btnCell;
  const padY   = 2 * btnCell;
  const bw     = Math.max(2, Math.round(2 * scale));
  const spacing = 20 * scale; // space between button boxes

  // Compute total height to center the group vertically
  const btnHeights = labels.map(lbl => {
    const s = measureTextBlocks(lbl, btnCell, gap);
    return s.height + padY * 2 + bw * 2;
  });
  const totalH = btnHeights.reduce((a,b)=>a+b,0) + spacing * (labels.length - 1);
  let yCursor = Math.round((H - totalH) / 2);

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const s = measureTextBlocks(label, btnCell, gap);
    const w = s.width + padX * 2;
    const h = s.height + padY * 2;
    const x = Math.round(W / 2 - w / 2);
    const y = yCursor;

    const rect = { label, x, y, w, h };
    btnRects.push(rect);

    const hovered = inRect(mouseX, mouseY, rect);

    // Hover fill (invert)
    if (hovered) {
      g.fillStyle = WHITE;
      g.fillRect(x, y, w, h);
    }

    // Chunky border
    g.fillStyle = WHITE;
    g.fillRect(x, y, w, bw);             // top
    g.fillRect(x, y + h - bw, w, bw);     // bottom
    g.fillRect(x, y, bw, h);              // left
    g.fillRect(x + w - bw, y, bw, h);     // right

    // Label (invert text when hovered)
    drawTextBlocks(label, W / 2, y + padY, btnCell, g, hovered ? "#000" : WHITE, gap);

    yCursor += h + spacing;
  }
}
