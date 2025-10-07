import { c, g, W, H, scale } from "./state.js";
import { COLORS, SPEEDS, DESIGN } from "./constants.js";
import { clamp, snap } from "./utils.js";
import { drawTextBlocks } from "./font5x7.js";

const WHITE = COLORS.WHITE;

let PADDLE_W, PADDLE_H, BALL_SIZE, WALL_PAD;
let paddleSpeed, ballSpeed;

// Right-paddle CPU control
/** Right-paddle control mode. */
export let cpuMode = "none"; // "none" | "easy" | "normal" | "hard"
/** Compute AI tracking speed multiplier for the right paddle. */
function cpuSpeedFactor() {
  switch (cpuMode) {
    case "easy":   return 0.4;
    case "normal": return 0.6;
    case "hard":   return 0.85;
    default:        return 0;
  }
}
/**
 * Set right-paddle AI mode.
 * @param {"none"|"easy"|"normal"|"hard"} mode
 */
export function setCpuMode(mode) {
  cpuMode = mode || "none";
}
function cpuDeadzone() {
  switch (cpuMode) {
    case "easy":   return Math.max(8, Math.round(10 * scale));
    case "normal": return Math.max(6, Math.round(8 * scale));
    case "hard":   return Math.max(4, Math.round(6 * scale));
    default:        return Math.max(3, Math.round(4 * scale));
  }
}

/** Mutable game state for positions and velocities. */
export let leftY, rightY, ballX, ballY, vx, vy;
let _running = false;                 // internal running flag
export let scoreL = 0, scoreR = 0;

// --- Pause control API ---
/** @returns {boolean} */
export function isRunning() { return _running; }
/** @param {boolean} v */
export function setRunning(v) { _running = !!v; }
/** Toggle pause/resume. */
export function togglePause() { _running = !_running; }

/** Initialize/resize game elements and reset positions/scores. */
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

/**
 * Center the ball and relaunch with a horizontal direction.
 * @param {number} [direction] - +1 to right, -1 to left (random if omitted)
 */
export function resetBall(direction = (Math.random() < 0.5 ? -1 : 1)) {
  ballX = snap(W / 2 - BALL_SIZE / 2);
  ballY = snap(H / 2 - BALL_SIZE / 2);
  vx = ballSpeed * direction;
  vy = (Math.random() * 2 - 1) * (ballSpeed * 0.6);
}

/**
 * Axis-aligned rectangle collision test between paddle and ball.
 * @param {number} px
 * @param {number} py
 * @param {number} pw
 * @param {number} ph
 * @param {number} bx
 * @param {number} by
 * @param {number} bs
 * @returns {boolean}
 */
function collide(px, py, pw, ph, bx, by, bs) {
  return bx < px + pw && bx + bs > px && by < py + ph && by + bs > py;
}

/**
 * Advance game simulation by one frame if running.
 * @param {Record<string, boolean>} keys
 */
export function update(keys) {
  // Only update when running
  if (!_running) return;

  // Left paddle: always player-controlled (W/S)
  if (keys.w || keys.W) leftY  = clamp(leftY  - paddleSpeed, 0, H - PADDLE_H);
  if (keys.s || keys.S) leftY  = clamp(leftY  + paddleSpeed, 0, H - PADDLE_H);

  // Right paddle: either player (arrows) or CPU based on selection
  if (cpuMode === "none") {
    if (keys.ArrowUp)   rightY = clamp(rightY - paddleSpeed, 0, H - PADDLE_H);
    if (keys.ArrowDown) rightY = clamp(rightY + paddleSpeed, 0, H - PADDLE_H);
  } else {
    const factor = cpuSpeedFactor();
    const maxStep = paddleSpeed * factor;
    // Simple tracking with slight deadzone
    const paddleCenter = rightY + PADDLE_H / 2;
    const ballCenter = ballY + BALL_SIZE / 2;
    const dz = cpuDeadzone();
    let dy = 0;
    if (ballCenter < paddleCenter - dz) dy = -maxStep;
    else if (ballCenter > paddleCenter + dz) dy = maxStep;
    rightY = clamp(rightY + dy, 0, H - PADDLE_H);
  }

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

/** Draw a dashed vertical net centered horizontally. */
function drawNet() {
  g.fillStyle = WHITE;
  const segH  = Math.max(6, Math.round(10 * scale));
  const gap   = Math.max(6, Math.round(10 * scale));
  const lineW = Math.max(2, Math.round(2 * scale));
  const x     = Math.round(W / 2 - lineW / 2);
  for (let y = 0; y < H; y += segH + gap) g.fillRect(x, y, lineW, segH);
}

/** Render game frame (background, net, paddles, ball, score). */
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
