(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // World size (internal pixels)
  const W = canvas.width;   // 800
  const H = canvas.height;  // 500

  // Game state
  const paddle = {
    w: 14,
    h: 90,
    speed: 420, // px/s
  };

  const left = { x: 30,  y: (H - paddle.h) / 2, vy: 0, score: 0 };
  const right = { x: W - 30 - paddle.w, y: (H - paddle.h) / 2, vy: 0, score: 0 };

  const ball = {
    r: 9,
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    speed: 360,          // base speed
    speedGrowth: 1.04,   // multiplies after each paddle hit
    maxVy: 520,
  };

  const keys = new Set();
  let lastTime = performance.now();
  let running = true;

  function serve(direction = Math.random() < 0.5 ? -1 : 1) {
    ball.x = W / 2;
    ball.y = H / 2;

    // Randomize angle a bit; ensure not too flat
    const angle = (Math.random() * 0.6 - 0.3); // -0.3..0.3 radians vertical tilt
    const v = ball.speed;
    ball.vx = Math.cos(angle) * v * direction;
    ball.vy = Math.sin(angle) * v;
  }

  serve(); // initial serve

  // Input
  window.addEventListener("keydown", (e) => {
    keys.add(e.key);
    if (e.key === "r" || e.key === "R") resetGame();
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
  });

  function resetGame() {
    left.y = (H - paddle.h) / 2; left.vy = 0; left.score = 0;
    right.y = (H - paddle.h) / 2; right.vy = 0; right.score = 0;
    ball.speed = 360;
    serve();
  }

  function update(dt) {
    // Player input
    left.vy = 0;
    right.vy = 0;

    if (keys.has("w") || keys.has("W")) left.vy = -paddle.speed;
    if (keys.has("s") || keys.has("S")) left.vy = +paddle.speed;

    if (keys.has("ArrowUp"))   right.vy = -paddle.speed;
    if (keys.has("ArrowDown")) right.vy = +paddle.speed;

    // Move paddles
    left.y += left.vy * dt;
    right.y += right.vy * dt;

    // Clamp paddles
    left.y = Math.max(0, Math.min(H - paddle.h, left.y));
    right.y = Math.max(0, Math.min(H - paddle.h, right.y));

    // Move ball
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Wall collisions (top/bottom)
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
    }
    if (ball.y + ball.r > H) {
      ball.y = H - ball.r;
      ball.vy = -ball.vy;
    }

    // Paddle collisions
    collideWithPaddle(left);
    collideWithPaddle(right);

    // Scoring
    if (ball.x + ball.r < 0) {
      // right scores
      right.score++;
      ball.speed = 360; // reset speed on score
      serve(-1);
    } else if (ball.x - ball.r > W) {
      // left scores
      left.score++;
      ball.speed = 360;
      serve(+1);
    }
  }

  function collideWithPaddle(p) {
    // Axis-aligned bounding box for paddle
    const px1 = p.x;
    const px2 = p.x + paddle.w;
    const py1 = p.y;
    const py2 = p.y + paddle.h;

    // Closest point on paddle to ball center
    const cx = Math.max(px1, Math.min(ball.x, px2));
    const cy = Math.max(py1, Math.min(ball.y, py2));

    const dx = ball.x - cx;
    const dy = ball.y - cy;

    if (dx * dx + dy * dy <= ball.r * ball.r) {
      // Simple resolve: place ball just outside paddle and reflect vx
      if (ball.x < W / 2) {
        ball.x = px2 + ball.r; // left paddle
      } else {
        ball.x = px1 - ball.r; // right paddle
      }

      // Add "spin" based on impact point (where on the paddle)
      const hit = (ball.y - (p.y + paddle.h / 2)) / (paddle.h / 2); // -1..1
      const newVy = hit * ball.maxVy;

      // Increase speed slightly each hit
      ball.speed *= ball.speedGrowth;

      // Keep overall speed magnitude similar but reflect horizontally
      const sign = ball.x < W / 2 ? 1 : -1; // after resolve, send away from paddle
      const newVx = Math.sign(-ball.vx) * Math.sqrt(Math.max(80, ball.speed * ball.speed - newVy * newVy));
      ball.vx = sign * Math.abs(newVx);
      ball.vy = newVy;
    }
  }

  // Drawing
  function draw() {
    // Background
    ctx.clearRect(0, 0, W, H);

    // Midline (dashed)
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#31395f";
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = "#e8eaf6";
    ctx.font = "bold 48px system-ui, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.fillText(left.score, W / 2 - 80, 70);
    ctx.fillText(right.score, W / 2 + 80, 70);

    // Paddles
    ctx.fillStyle = "#b8c1ff";
    ctx.fillRect(left.x, left.y, paddle.w, paddle.h);
    ctx.fillRect(right.x, right.y, paddle.w, paddle.h);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#a8f0ff";
    ctx.fill();
  }

  function loop(t) {
    const dt = Math.min(0.033, (t - lastTime) / 1000); // clamp big frame gaps
    lastTime = t;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
