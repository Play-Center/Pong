import { c, g, W, H, scale } from "./state.js";
import { COLORS, SPEEDS, DESIGN } from "./constants.js";
import { clamp, snap } from "./utils.js";
import { drawTextBlocks } from "./font5x7.js";

const WHITE = COLORS.WHITE;

let PADDLE_W, PADDLE_H, BALL_SIZE, WALL_PAD;
let paddleSpeed, ballSpeed;

export let leftY, rightY, ballX, ballY, vx, vy;
let _running = false;                 // internal running flag
export let scoreL = 0, scoreR = 0;

// --- Pause control API ---
export function isRunning() { return _running; }
export function setRunning(v) { _running = !!v; }
export function togglePause() { _running = !_running; }

export function initGame() {
  PADDLE_W = Math.round(DESIGN.PADDLE_W * scale);
  PADDLE_H = Math.round(DESIGN.PADDLE_H * scale);
  BALL_SIZE = Math.max(6, Math.round(DESIGN.BALL * scale));
  WALL_PAD  = Math.round(DESIGN.WALL_PAD * scale);

  paddleSpeed = SPEEDS.BASE_PADDLE * scale;
  ballSpeed   = SPEEDS.BASE_BALL * scale;

  leftY  = snap((H - PADDLE_H) / 2);
  rightY = snap((H - PADDLE_H) / 2);

  ballX = snap(W / 2 - BALL_SIZE / 2);
  ballY = snap(H / 2 - BALL_SIZE / 2);

  vx = (Math.random() < 0.5 ? -1 : 1) * ballSpeed;
  vy = (Math.random() * 2 - 1) * (ballSpeed * 0.5);

  scoreL = 0; scoreR = 0;
  _running = false;                  // << start paused
}

export function resetBall(direction = (Math.random() < 0.5 ? -1 : 1)) {
  ballX = snap(W / 2 - BALL_SIZE / 2);
  ballY = snap(H / 2 - BALL_SIZE / 2);
  vx = ballSpeed * direction;
  vy = (Math.random() * 2 - 1) * (ballSpeed * 0.6);
}

function collide(px, py, pw, ph, bx, by, bs) {
  return bx < px + pw && bx + bs > px && by < py + ph && by + bs > py;
}

export function update(keys) {
  // Only update when running
  if (!_running) return;

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
  if (ballX + BALL_SIZE < 0) { scoreR++; resetBall(+1); _running = false; } // pause after score
  if (ballX > W)              { scoreL++; resetBall(-1); _running = false; } // pause after score
}

function drawNet() {
  g.fillStyle = WHITE;
  const segH  = Math.max(6, Math.round(10 * scale));
  const gap   = Math.max(6, Math.round(10 * scale));
  const lineW = Math.max(2, Math.round(2 * scale));
  const x     = Math.round(W / 2 - lineW / 2);
  for (let y = 0; y < H; y += segH + gap) g.fillRect(x, y, lineW, segH);
}

export function drawGame() {
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
  drawTextBlocks(String(scoreL), W / 2 - 80 * scale, topY, cell, g);
  drawTextBlocks(String(scoreR), W / 2 + 80 * scale, topY, cell, g);
}
