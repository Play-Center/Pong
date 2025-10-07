const c = document.getElementById("game");
const g = c.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

// Base logical size (for scaling gameplay)
const BASE_W = 800, BASE_H = 480;
let scale = 1;

const WHITE = "#fff";

// Base speeds (scaled at runtime)
const BASE_PADDLE_SPEED = 5;
const BASE_BALL_SPEED   = 4.2;

// Scaled sizes (set in resetGame)
let PADDLE_W = 10, PADDLE_H = 64, BALL_SIZE = 8, WALL_PAD = 12;
let paddleSpeed, ballSpeed;

// Game state
let leftY, rightY, ballX, ballY, vx, vy, running;
let scoreL = 0, scoreR = 0;
const keys = Object.create(null);

// Scene state
let state = "menu"; // "menu" | "game"

// Menu button state
let btnRect = { x: 0, y: 0, w: 0, h: 0 };
let btnHover = false;

// ---------- 5×7 Retro Pixel Font (denser & readable) ----------
const FONT5x7 = {
  "0":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "1":[[0,0,1,0,0],[0,1,1,0,0],[1,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
  "2":[[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  "3":[[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "4":[[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
  "5":[[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "6":[[0,0,1,1,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "7":[[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
  "8":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "9":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,1,1,0,0]],
  "A":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  "E":[[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  "G":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "I":[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
  "L":[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  "M":[[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  "N":[[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  "O":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "P":[[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  "R":[[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  "T":[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  "U":[[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "Y":[[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  " ":[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
};

// ---------- Helpers ----------
const snap = v => Math.round(v);

function drawGlyph(ch, x, y, cell, color = WHITE) {
  const grid = FONT5x7[ch];
  if (!grid) return;
  g.fillStyle = color;
  for (let r = 0; r < 7; r++) {
    for (let cCol = 0; cCol < 5; cCol++) {
      if (grid[r][cCol]) {
        g.fillRect(snap(x + cCol * cell), snap(y + r * cell), cell, cell);
      }
    }
  }
}

function measureTextBlocks(str, cell, gap = cell) {
  const n = str.length;
  const w = n * (5 * cell) + (n - 1) * gap;
  const h = 7 * cell;
  return { width: w, height: h };
}

function drawTextBlocks(str, centerX, topY, cell, color = WHITE, gap = cell) {
  const { width } = measureTextBlocks(str, cell, gap);
  let x = centerX - width / 2;
  for (const ch of str.toUpperCase()) {
    drawGlyph(ch, x, topY, cell, color);
    x += 5 * cell + gap;
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- Layout / scaling ----------
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  c.width = W;
  c.height = H;
  scale = Math.min(W / BASE_W, H / BASE_H);
  resetGame(false); // keep scores on resize
}
window.addEventListener("resize", resize);

// ---------- Game (re)setup ----------
function resetGame(full = true) {
  PADDLE_W = Math.round(10 * scale);
  PADDLE_H = Math.round(64 * scale);
  BALL_SIZE = Math.max(6, Math.round(8 * scale));
  WALL_PAD  = Math.round(12 * scale);

  paddleSpeed = BASE_PADDLE_SPEED * scale;
  ballSpeed   = BASE_BALL_SPEED * scale;

  leftY  = snap((H - PADDLE_H) / 2);
  rightY = snap((H - PADDLE_H) / 2);

  ballX = snap(W / 2 - BALL_SIZE / 2);
  ballY = snap(H / 2 - BALL_SIZE / 2);

  vx = (Math.random() < 0.5 ? -1 : 1) * ballSpeed;
  vy = (Math.random() * 2 - 1) * (ballSpeed * 0.5);

  if (full) { scoreL = 0; scoreR = 0; }
  running = false;
}

function resetBall(direction = (Math.random() < 0.5 ? -1 : 1)) {
  ballX = snap(W / 2 - BALL_SIZE / 2);
  ballY = snap(H / 2 - BALL_SIZE / 2);
  vx = ballSpeed * direction;
  vy = (Math.random() * 2 - 1) * (ballSpeed * 0.6);
}

// ---------- Input ----------
addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.code === "Escape" && state === "game") {
    state = "menu";
    running = false;
    e.preventDefault();
  }
});
addEventListener("keyup", e => keys[e.key] = false);

// Mouse: hover + click for the menu button
c.addEventListener("mousemove", e => {
  if (state !== "menu") return;
  const r = c.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  btnHover = (mx >= btnRect.x && mx <= btnRect.x + btnRect.w &&
              my >= btnRect.y && my <= btnRect.y + btnRect.h);
});
c.addEventListener("click", () => {
  if (state === "menu" && btnHover) { state = "game"; running = true; }
});

// ---------- Update (game only) ----------
function collide(px, py, pw, ph, bx, by, bs) {
  return bx < px + pw && bx + bs > px && by < py + ph && by + bs > py;
}

function update() {
  if (keys.w || keys.W) leftY  = clamp(leftY  - paddleSpeed, 0, H - PADDLE_H);
  if (keys.s || keys.S) leftY  = clamp(leftY  + paddleSpeed, 0, H - PADDLE_H);
  if (keys.ArrowUp)     rightY = clamp(rightY - paddleSpeed, 0, H - PADDLE_H);
  if (keys.ArrowDown)   rightY = clamp(rightY + paddleSpeed, 0, H - PADDLE_H);

  ballX += vx;
  ballY += vy;

  // Walls
  if (ballY <= 0) { ballY = 0; vy = Math.abs(vy); }
  else if (ballY + BALL_SIZE >= H) { ballY = H - BALL_SIZE; vy = -Math.abs(vy); }

  // Paddles
  const leftX  = WALL_PAD;
  const rightX = W - WALL_PAD - PADDLE_W;

  if (collide(leftX, leftY, PADDLE_W, PADDLE_H, ballX, ballY, BALL_SIZE) && vx < 0) {
    ballX = leftX + PADDLE_W;
    vx = Math.abs(vx) * 1.03;
    const hit = (ballY + BALL_SIZE / 2) - (leftY + PADDLE_H / 2);
    vy = clamp(vy + hit * 0.05, -10 * scale, 10 * scale);
  }

  if (collide(rightX, rightY, PADDLE_W, PADDLE_H, ballX, ballY, BALL_SIZE) && vx > 0) {
    ballX = rightX - BALL_SIZE;
    vx = -Math.abs(vx) * 1.03;
    const hit = (ballY + BALL_SIZE / 2) - (rightY + PADDLE_H / 2);
    vy = clamp(vy + hit * 0.05, -10 * scale, 10 * scale);
  }

  // Scoring
  if (ballX + BALL_SIZE < 0) { scoreR++; resetBall(+1); running = false; }
  if (ballX > W)              { scoreL++; resetBall(-1); running = false; }
}

// ---------- Draw ----------
function drawNet() {
  g.fillStyle = WHITE;
  const segH  = Math.max(6, Math.round(10 * scale));
  const gap   = Math.max(6, Math.round(10 * scale));
  const lineW = Math.max(2, Math.round(2 * scale));
  const x     = Math.round(W / 2 - lineW / 2);
  for (let y = 0; y < H; y += segH + gap) g.fillRect(x, y, lineW, segH);
}

function drawMenu() {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  // Smaller, compact menu text (as you liked)
  const titleCell = Math.max(6, Math.floor(9 * scale));
  const btnCell   = Math.max(4, Math.floor(5 * scale));
  const titleY    = 36 * scale;

  // Title
  drawTextBlocks("PONG", W / 2, titleY, titleCell);

  // Button metrics
  const label = "MULTIPLAYER";
  const gap   = btnCell;
  const size  = measureTextBlocks(label, btnCell, gap);
  const padX  = 3 * btnCell;
  const padY  = 2 * btnCell;

  const btnW = size.width + padX * 2;
  const btnH = size.height + padY * 2;
  const btnX = Math.round(W / 2 - btnW / 2);
  const btnY = Math.round(H / 2 - btnH / 2);

  btnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

  // Hover background fill (invert look)
  if (btnHover) {
    g.fillStyle = WHITE;
    g.fillRect(btnX, btnY, btnW, btnH);
  }

  // Chunky border on top
  g.fillStyle = WHITE;
  const bw = Math.max(2, Math.round(2 * scale));
  g.fillRect(btnX, btnY, btnW, bw);                 // top
  g.fillRect(btnX, btnY + btnH - bw, btnW, bw);     // bottom
  g.fillRect(btnX, btnY, bw, btnH);                 // left
  g.fillRect(btnX + btnW - bw, btnY, bw, btnH);     // right

  // Label (invert color if hovered)
  if (btnHover) {
    drawTextBlocks(label, W / 2, btnY + padY, btnCell, "#000", gap);
  } else {
    drawTextBlocks(label, W / 2, btnY + padY, btnCell, WHITE, gap);
  }
}

function drawGame() {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  drawNet();

  g.fillStyle = WHITE;
  g.fillRect(Math.round(WALL_PAD), Math.round(leftY),  PADDLE_W, PADDLE_H);
  g.fillRect(Math.round(W - WALL_PAD - PADDLE_W), Math.round(rightY), PADDLE_W, PADDLE_H);
  g.fillRect(Math.round(ballX), Math.round(ballY), BALL_SIZE, BALL_SIZE);

  // Score (5×7 digits)
  const cell = Math.max(5, Math.floor(7 * scale));
  const topY = 24 * scale;
  drawTextBlocks(String(scoreL), W / 2 - 80 * scale, topY, cell);
  drawTextBlocks(String(scoreR), W / 2 + 80 * scale, topY, cell);
}

// ---------- Loop ----------
function loop() {
  if (state === "menu") {
    drawMenu();
  } else {
    if (running) update();
    drawGame();
  }
  requestAnimationFrame(loop);
}

// ---------- Start ----------
resize();
loop();
