import { g, W, H, scale } from "./state.js";
import { COLORS } from "./constants.js";
import { measureTextBlocks, drawTextBlocks } from "./font5x7.js";

const WHITE = COLORS.WHITE;

// Track mouse position in canvas coords
let mouseX = -1, mouseY = -1;

// Rebuilt every frame
let btnRects = []; // [{ label, x, y, w, h }]

function inRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

// --- called from main.js
export function menuMouseMove(mx, my) {
  mouseX = mx;
  mouseY = my;
}

// --- called from main.js
// Returns the clicked button label or null
export function menuClick() {
  const hit = btnRects.find(r => inRect(mouseX, mouseY, r));
  return hit ? hit.label : null;
}

export function drawMenu() {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  // Rebuild rects for this frame
  btnRects = [];

  const titleCell = Math.max(6, Math.floor(9 * scale));
  const btnCell   = Math.max(4, Math.floor(5 * scale));
  const titleY    = 36 * scale;

  // Title
  drawTextBlocks("PONG", W / 2, titleY, titleCell, g);

  // Buttons: top = SINGLE PLAYER, bottom = MULTIPLAYER
  const labels = ["SINGLEPLAYER", "MULTIPLAYER"];
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
