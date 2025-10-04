// Super simple 2-player Pong (Left: W/S, Right: ArrowUp/ArrowDown)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreL = document.getElementById('l');
const scoreR = document.getElementById('r');

const W = canvas.width, H = canvas.height;

// Game objects
const PADDLE_H = 60, PADDLE_W = 8, PADDLE_SPEED = 4;
const BALL_SIZE = 8, BALL_SPEED = 3;

const left = { x: 16, y: H/2 - PADDLE_H/2 };
const right = { x: W - 16 - PADDLE_W, y: H/2 - PADDLE_H/2 };
const ball = { x: W/2, y: H/2, vx: BALL_SPEED, vy: BALL_SPEED };

let keys = {};
let lScore = 0, rScore = 0;

function resetBall(direction = Math.random() < 0.5 ? -1 : 1) {
  ball.x = W/2;
  ball.y = H/2;
  const angle = (Math.random() * 0.6 - 0.3); // slight random angle
  ball.vx = direction * BALL_SPEED * (1 + Math.abs(angle));
  ball.vy = BALL_SPEED * angle;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function update() {
  // Left paddle movement (W/S)
  if (keys['w']) left.y -= PADDLE_SPEED;
  if (keys['s']) left.y += PADDLE_SPEED;
  // Right paddle movement (ArrowUp/ArrowDown)
  if (keys['ArrowUp']) right.y -= PADDLE_SPEED;
  if (keys['ArrowDown']) right.y += PADDLE_SPEED;

  left.y = clamp(left.y, 0, H - PADDLE_H);
  right.y = clamp(right.y, 0, H - PADDLE_H);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom bounce
  if (ball.y <= 0 || ball.y + BALL_SIZE >= H) {
    ball.vy *= -1;
    // keep inside bounds
    ball.y = clamp(ball.y, 0, H - BALL_SIZE);
  }

  // Paddle collision (AABB)
  const hitLeft = ball.x <= left.x + PADDLE_W &&
                  ball.x >= left.x &&
                  ball.y + BALL_SIZE >= left.y &&
                  ball.y <= left.y + PADDLE_H;

  const hitRight = ball.x + BALL_SIZE >= right.x &&
                   ball.x + BALL_SIZE <= right.x + PADDLE_W &&
                   ball.y + BALL_SIZE >= right.y &&
                   ball.y <= right.y + PADDLE_H;

  if (hitLeft) {
    ball.x = left.x + PADDLE_W; // prevent sticking
    ball.vx = Math.abs(ball.vx);
    // add a little angle based on where it hit the paddle
    const offset = ((ball.y + BALL_SIZE/2) - (left.y + PADDLE_H/2)) / (PADDLE_H/2);
    ball.vy = BALL_SPEED * offset;
  }

  if (hitRight) {
    ball.x = right.x - BALL_SIZE;
    ball.vx = -Math.abs(ball.vx);
    const offset = ((ball.y + BALL_SIZE/2) - (right.y + PADDLE_H/2)) / (PADDLE_H/2);
    ball.vy = BALL_SPEED * offset;
  }

  // Scoring
  if (ball.x + BALL_SIZE < 0) {
    rScore++; scoreR.textContent = rScore; resetBall(1);
  } else if (ball.x > W) {
    lScore++; scoreL.textContent = lScore; resetBall(-1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Middle dashed line
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Paddles
  ctx.fillStyle = '#5ee';
  ctx.fillRect(left.x, left.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(right.x, right.y, PADDLE_W, PADDLE_H);

  // Ball
  ctx.fillStyle = '#fff';
  ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input
addEventListener('keydown', e => { keys[e.key] = true; });
addEventListener('keyup',   e => { keys[e.key] = false; });

// Start
resetBall();
loop();
