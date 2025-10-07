// === Simple, retro-accurate-ish Pong =======================================
// Look: dotted center line, square ball, blocky digit scores drawn on canvas.
// Controls: W/S for left paddle, ↑/↓ for right. Space to start/pause.

const c = document.getElementById("game");
const g = c.getContext("2d");

// ----- World dimensions and visual constants -----
const W = c.width, H = c.height;
const WHITE = "#fff";

const PADDLE_W = 10;
const PADDLE_H = 64;          // short paddles feel closer to original cabinets
const BALL_SIZE = 8;          // square "ball"
const WALL_PAD = 12;          // horizontal margin from edge for paddles
const SCORE_SCALE = 10;       // pixel font scale (bigger = larger digits)

// Speeds (tweak to taste)
const PADDLE_SPEED = 5;
const BALL_SPEED = 4.2;       // base speed; will accelerate a bit on hits
const BALL_SPEED_UP = 1.03;   // acceleration factor per paddle hit
const BALL_MAX_VY = 6;        // cap vertical speed

// ----- Game state -----
let leftY  = (H - PADDLE_H) / 2;
let rightY = (H - PADDLE_H) / 2;
let ballX  = W / 2;
let ballY  = H / 2;
let vx = Math.random() < 0.5 ? -BALL_SPEED : BALL_SPEED;
let vy = (Math.random() * 2 - 1) * (BALL_SPEED * 0.5);

let scoreL = 0, scoreR = 0;
let running = false;

const keys = Object.create(null);
addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.code === "Space") {
    running = !running;
    // If unpausing from a score reset, nudge ball so it isn't perfectly flat
    if (running && Math.abs(vy) < 0.2) vy = (Math.random() * 2 - 1) * 1.5;
    e.preventDefault();
  }
});
addEventListener("keyup",   e => keys[e.key] = false);

// ----- Tiny 3x5 blocky digit font (drawn as filled squares) -----
/*
Each digit is a 3x5 grid where 1 = filled block, 0 = empty.
We scale it with SCORE_SCALE to get nice chunky numbers.
*/
const FONT3x5 = {
  "0":[
    [1,1,1],
    [1,0,1],
    [1,0,1],
    [1,0,1],
    [1,1,1]
  ],
  "1":[
    [0,1,0],
    [1,1,0],
    [0,1,0],
    [0,1,0],
    [1,1,1]
  ],
  "2":[
    [1,1,1],
    [0,0,1],
    [1,1,1],
    [1,0,0],
    [1,1,1]
  ],
  "3":[
    [1,1,1],
    [0,0,1],
    [0,1,1],
    [0,0,1],
    [1,1,1]
  ],
  "4":[
    [1,0,1],
    [1,0,1],
    [1,1,1],
    [0,0,1],
    [0,0,1]
  ],
  "5":[
    [1,1,1],
    [1,0,0],
    [1,1,1],
    [0,0,1],
    [1,1,1]
  ],
  "6":[
    [1,1,1],
    [1,0,0],
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ],
  "7":[
    [1,1,1],
    [0,0,1],
    [0,1,0],
    [0,1,0],
    [0,1,0]
  ],
  "8":[
    [1,1,1],
    [1,0,1],
    [1,1,1],
    [1,0,1],
    [1,1,1]
  ],
  "9":[
    [1,1,1],
    [1,0,1],
    [1,1,1],
    [0,0,1],
    [1,1,1]
  ]
};

function drawDigit(n, x, y, scale = SCORE_SCALE, color = WHITE) {
  const grid = FONT3x5[n];
  if (!grid) return;
  g.fillStyle = color;
  for (let r = 0; r < 5; r++) {
    for (let cCol = 0; cCol < 3; cCol++) {
      if (grid[r][cCol]) {
        g.fillRect(x + cCol*scale, y + r*scale, scale, scale);
      }
    }
  }
}

function drawScore(val, x, y) {
  const s = String(val);
  const totalW = s.length * (3*SCORE_SCALE) + (s.length-1)*SCORE_SCALE; // 1 scale gap
  let cx = x - totalW/2;
  for (const ch of s) {
    drawDigit(ch, cx, y);
    cx += 3*SCORE_SCALE + SCORE_SCALE;
  }
}

// ----- Helpers -----
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function resetBall(direction = (Math.random() < 0.5 ? -
