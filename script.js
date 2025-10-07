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

// ---------- Retro 3x5 pixel font for digits ----------
const FONT3x5 = {
  "0":[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  "1":[[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  "2":[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  "3":[[1,1,1],[0,0,1],[0,1,1],[0,0,1],[1,1,1]],
  "4":[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  "5":[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  "6":[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  "7":[[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  "8":[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  "9":[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]]
};

// ---------- Helpers ----------
const snap = v => Math.round(v);

function drawDigit(n, x, y, cellSize, color = WHITE) {
  const grid = FONT3x5[n];
  if (!grid) return;
  g.fillStyle = color;
  for (let r = 0; r < 5; r++) {
    for (let cCol = 0; cCol < 3; cCol++) {
      if (grid[r][cCol]) {
        g.fillRect(snap(x + cCol * cellSize), snap(y + r * cellSize), cellSize, cellSize);
      }
    }
  }
}

function drawNumber(num, centerX, topY, cellSize) {
  const s = String(num);
  const digitW = 3 * cellSize;
  const gap = cellSize; // spacing between digits
  const totalW = s.length * digitW + (s.length - 1) * gap;
  let x = centerX - totalW / 2;
  for (const ch of s) {
    drawDigit(ch, x, topY, cellSize);
    x += digitW + gap;
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
  // Quantize sizes to integers to avoid half-pixel drift
  PADDLE_W = Math.round(10 * scale);
  PADDLE_H = Math.round(64 * scale);
  BALL_SIZE = Math.max(6, Math.round(8 * scale));
  WALL_PAD  = Math.round(12 * scale);

  paddleSpeed = BASE_PADDLE_SPEED * scale;
  ballSpeed   = BASE_BALL_SPEED * scale;

  leftY  = snap((H - PADDLE_H) / 2);
  rightY = snap((H - PADDLE_H) / 2);

  // Center ball by its size (exact optical center)
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
  if (e.code === "Space") {
    running = !running;
    if (running && Math.abs(vy) < 0.2) vy = (Math.random() * 2 - 1) * (1.5 * scale);
    e.preventDefault();
  }
});
addEventListener("keyup", e => keys[e.key] = false);

// ---------- Update ----------
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
  const x     = snap(W / 2 - lineW / 2); // true center
  for (let y = 0; y < H; y += segH + gap) g.fillRect(x, y, lineW, segH);
}

function draw() {
  // Background
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  // Net
  drawNet();

  // Paddles & ball (snapped for crisp pixels)
  g.fillStyle = WHITE;
  g.fillRect(snap(WALL_PAD), snap(leftY),  PADDLE_W, PADDLE_H);
  g.fillRect(snap(W - WALL_PAD - PADDLE_W), snap(rightY), PADDLE_W, PADDLE_H);
  g.fillRect(snap(ballX), snap(ballY), BALL_SIZE, BALL_SIZE);

  // Blocky score at top
  const cell = Math.max(4, Math.floor(6 * scale)); // block thickness
  const topY = 24 * scale;
  drawNumber(scoreL, W / 2 - 60 * scale, topY, cell);
  drawNumber(scoreR, W / 2 + 60 * scale, topY, cell);
}

// ---------- Loop ----------
function loop() {
  if (running) update();
  draw();
  requestAnimationFrame(loop);
}

// ---------- Start ----------
resize();
loop();
