import { g, W, H, scale } from "./state.js";
import { COLORS } from "./constants.js";
import { measureTextBlocks, drawTextBlocks } from "./font5x7.js";

const WHITE = COLORS.WHITE;

/** Track mouse position in canvas coords. */
let mouseX = -1, mouseY = -1;

// Rebuilt every frame
/** @type {{label:string,x:number,y:number,w:number,h:number}[]} */
let btnRects = []; // [{ label, x, y, w, h }]

// Simple menu state: "root" (PONG + SINGLE/MULTI) or "single" (EASY/NORMAL/HARD)
/** @type {"root"|"single"} */
let menuMode = "root";

/** Reset menu to the root screen (PONG + SINGLE/MULTI). */
export function menuReset() {
  menuMode = "root";
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
    // Allow other root actions to bubble up (e.g., MULTIPLAYER)
    return hit.label;
  }

  // In single-player difficulty menu, return the difficulty label
  return hit.label; // EASY | NORMAL | HARD
}

/** Draw the current menu screen (root or difficulty). */
export function drawMenu() {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

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
  const labels = (menuMode === "root")
    ? ["SINGLEPLAYER", "MULTIPLAYER"]
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
